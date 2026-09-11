import { actionPose } from "./action-art.js";
import { softenSurface } from "./surface-art.js";
import { createMotion, restoreMotion, applyMotion } from "./motion.js";
import { equipInfected } from "./infected.js";
import {
  equipOperator,
  animateEquipment,
  poseWeaponArms,
} from "./operators.js";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";

// Asset manifest keys stay stable when models are replaced.
export const CHARACTER_ASSETS = {
  rig: "models/survivor.glb",
  viper: "models/viper.glb",
  bastion: "models/bastion.glb",
  pulse: "models/pulse.glb",
  reaper: "models/reaper.glb",
  female: "models/humanFemaleA.png",
  male: "models/humanMaleA.png",
  zombieFemale: "models/zombieFemaleA.png",
  zombieMale: "models/zombieMaleA.png",
};
let library;
export function loadCharacters() {
  if (!library)
    library = (async () => {
      const base = import.meta.env.BASE_URL;
      const rig = await new GLTFLoader().loadAsync(base + CHARACTER_ASSETS.rig);
      const textures = {};
      for (const key of ["female", "male", "zombieFemale", "zombieMale"]) {
        const texture = await new THREE.TextureLoader().loadAsync(
          base + CHARACTER_ASSETS[key],
        );
        texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        textures[key] = texture;
      }
      const operators = Object.fromEntries(
        await Promise.all(
          ["viper", "bastion", "pulse", "reaper"].map(async (id) => [
            id,
            await new GLTFLoader().loadAsync(base + CHARACTER_ASSETS[id]),
          ]),
        ),
      );
      return { rig, textures, operators };
    })().catch((error) => {
      library = undefined;
      throw error;
    });
  return library;
}
export function makeCharacter(
  assets,
  skin,
  accent,
  zombie = false,
  operator = "viper",
) {
  const modelId =
    { gale: "bastion", lumen: "pulse", nova: "reaper" }[operator] ||
    (operator === "archer"
      ? "viper"
      : operator === "sniper"
        ? "bastion"
        : operator);
  const native = !zombie && !!assets.operators?.[modelId];
  const source = native ? assets.operators[modelId] : assets.rig;
  const group = new THREE.Group(),
    model = clone(source.scene);
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  for (const clip of source.animations)
    actions[clip.name] = mixer.clipAction(clip);
  if (native) {
    actions.idle = actions.Idle_Gun_Pointing;
    actions.run = actions.Run;
  }
  actions.idle?.play();
  mixer.update(0);
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (o.isSkinnedMesh) o.computeBoundingBox();
  });
  const bounds = new THREE.Box3().setFromObject(model),
    size = bounds.getSize(new THREE.Vector3());
  model.scale.multiplyScalar(2.5 / size.y);
  model.position.y = (-bounds.min.y * 2.5) / size.y;
  model.traverse((o) => {
    if (o.isMesh) {
      if (native && o.isSkinnedMesh) o.geometry = softenSurface(o.geometry);
      o.userData.sharedGeometry = true;
      o.material = native
        ? o.material.clone()
        : new THREE.MeshStandardMaterial({
            map: assets.textures[skin],
            roughness: 0.82,
            color: zombie
              ? operator === "runner"
                ? 0x8e897a
                : operator === "brute"
                  ? 0x71816a
                  : 0x89977e
              : 0xffffff,
          });

      if (
        native &&
        operator === "lumen" &&
        o.material.color.b > o.material.color.r * 1.3
      )
        o.material.color.setHex(0x735378);
      if (native && operator === "sniper")
        o.material.color.multiply(new THREE.Color(0x9fb9da));
      if (native) {
        o.material.flatShading = false;
        o.material.roughness = .68;
        o.material.metalness = .08;
      }
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
    }
  });
  if (native) {
    const pistol = model.getObjectByName("Pistol");
    if (pistol) pistol.visible = false;
  }
  group.add(model);
  if (zombie) equipInfected(group, operator);
  const equipment = zombie ? null : equipOperator(group, operator, native);
  group.updateMatrixWorld(true);
  const wristNode = native
    ? model.getObjectByName(operator === "archer" ? "WristL" : "WristR")
    : null;
  return {
    wristBindInverse: wristNode
      ?.getWorldQuaternion(new THREE.Quaternion())
      .invert(),
    wristWorld: new THREE.Quaternion(),
    groupWorld: new THREE.Quaternion(),
    materials: (() => {
      const materials = [];
      model.traverse((o) => {
        if (o.isMesh) materials.push(o.material);
      });
      return materials;
    })(),
    zombie,
    infectedType: operator,
    spine: zombie ? model.getObjectByName("Spine") : null,
    headBone: zombie ? model.getObjectByName("Head") : null,
    headScale: zombie ? model.getObjectByName("Head")?.scale.clone() : null,
    leftArm: native ? model.getObjectByName("UpperArmL") : null,
    leftArmRest: native
      ? model.getObjectByName("UpperArmL")?.quaternion.clone()
      : null,
    native,
    motion: native ? createMotion(model, operator) : null,
    aimBones: native
      ? ["UpperArmR", "LowerArmR", "WristR"]
          .map((name) => model.getObjectByName(name))
          .filter(Boolean)
          .map((bone) => ({ bone, quaternion: bone.quaternion.clone() }))
      : [],
    wrist: native
      ? model.getObjectByName(operator === "archer" ? "WristL" : "WristR")
      : null,
    grip: new THREE.Vector3(),
    group,
    model,
    mixer,
    actions,
    equipment,
    mode: "idle",
    animationDebt: 0,
  };
}

export function animateCharacter(
  actor,
  moving,
  dt,
  speed = 1,
  direction = "run",
  firing = false,
) {
  const next = actor.native
    ? moving
      ? direction
      : firing && !actor.equipment?.custom
        ? "Idle_Gun_Shoot"
        : "idle"
    : moving
      ? "run"
      : "idle";
  restoreMotion(actor);
  if (actor.mode !== next) {
    const previous = actor.actions[actor.mode],
      action = actor.actions[next];
    previous?.fadeOut(0.12);
    if (action) {
      action.enabled = true;
      action.setEffectiveWeight(1).setEffectiveTimeScale(1);
      if (moving && previous)
        action.time = previous.time % action.getClip().duration;
      action.fadeIn(0.12).play();
    }
    actor.mode = next;
  }
  actor.mixer.update(dt * speed);
  if (actor.native && moving && actor.equipment?.id !== "archer") {
    for (const entry of actor.aimBones)
      entry.bone.quaternion.copy(entry.quaternion);
  }
  applyMotion(actor, moving, dt, direction);
  if (actor.equipment?.custom) {
    for (const entry of actor.aimBones)
      entry.bone.quaternion.copy(entry.quaternion);
    const right = actor.aimBones[0]?.bone,
      lower = actor.aimBones[1]?.bone;
    const pose = actionPose(
      actor.equipment.id,
      actor.motion.age,
      actor.equipment.def.interval,
      actor.equipment.combo,
    );
    actor.equipment.shot = pose.strength;
    if (actor.equipment.id === "gale" && right) {
      right.rotation.y += pose.swing;
      right.rotation.z += pose.swing * 0.45 - .18;
      const chest = actor.motion.bones.find(entry => entry.bone.name === "Chest")?.bone;
      if (chest) chest.rotation.y += pose.swing * .3;
      if (actor.leftArm) {
        actor.leftArm.quaternion.copy(actor.leftArmRest);
        actor.leftArm.rotation.z -= .45 + pose.strength * .5;
        actor.leftArm.rotation.y -= pose.swing * .45;
      }
      if (lower) lower.rotation.x += Math.abs(pose.swing) * 0.25;
    }
    if (actor.equipment.id === "lumen") {
      if (right) right.rotation.z += 0.35 + pose.cast * 0.4;
      if (actor.leftArm) {
        actor.leftArm.quaternion.copy(actor.leftArmRest);
        actor.leftArm.rotation.z -= 0.55 + pose.cast * 0.35;
      }
    }
    if (actor.equipment.id === "nova" && right) {
      right.rotation.x -= pose.thrust * 0.65;
      if (lower) lower.rotation.x += pose.thrust * 0.45;
    }
  }
  if (actor.zombie) {
    const t = actor.mixer.time;
    if (actor.spine) {
      actor.spine.rotation.x += 0.22;
      actor.spine.rotation.z += Math.sin(t * 3) * 0.065;
    }
    if (actor.headBone) {
      actor.headBone.scale.copy(actor.headScale).multiplyScalar(0.72);
      actor.headBone.rotation.z += 0.16 + Math.sin(t * 2) * 0.05;
    }
  }
  animateEquipment(actor, dt, moving);
  if (!actor.native) poseWeaponArms(actor);
  else if (actor.wrist && actor.equipment) {
    actor.group.updateMatrixWorld(true);
    actor.wrist.getWorldPosition(actor.grip);
    actor.group.worldToLocal(actor.grip);
    actor.equipment.weapon.position.copy(actor.grip);
    actor.equipment.weapon.position.y += 0.025;
    actor.equipment.weapon.position.z -= 0.08 + actor.equipment.shot * 0.045;
    if (actor.equipment.id === "archer") {
      actor.grip.set(-0.28, 1.6, 0.48);
      actor.equipment.weapon.position.copy(actor.grip);
    }
    if (actor.equipment.custom) {
      actor.wrist.getWorldQuaternion(actor.wristWorld);
      actor.group.getWorldQuaternion(actor.groupWorld).invert();
      actor.equipment.weapon.quaternion
        .copy(actor.groupWorld)
        .multiply(actor.wristWorld)
        .multiply(actor.wristBindInverse);
    }
    poseWeaponArms(actor);
  }
}
