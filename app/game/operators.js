import { equipArsenal, animateArsenal } from "./arsenal.js";
import * as THREE from "three";

export const LOADOUTS = {
  gale: {
    title: "POLAR STORM / 자력 폭풍",
    interval: 0.38,
    recoil: 0.1,
    tint: 0xb5a0ff,
    width: 1,
    height: 1,
    barrel: 1,
    ultimate: "storm",
  },
  lumen: {
    title: "PRISM BLOOM / 프리즘 개화",
    interval: 0.65,
    recoil: 0.1,
    tint: 0xffafd4,
    width: 1,
    height: 1,
    barrel: 1,
    ultimate: "bloom",
  },
  nova: {
    title: "GRAVITY LANCE / 중력 창",
    interval: 0.32,
    recoil: 0.18,
    tint: 0x76ccff,
    width: 1,
    height: 1,
    barrel: 1,
    ultimate: "lance",
  },
  archer: {
    title: "THORN / 가시 폭우",
    interval: 0.62,
    recoil: 0.12,
    tint: 0xa3dc91,
    width: 1,
    height: 1,
    barrel: 1,
    ultimate: "thorns",
  },
  sniper: {
    title: "EXECUTION / 처형 탄환",
    interval: 0.9,
    recoil: 0.3,
    tint: 0x9dbbfd,
    width: 1,
    height: 1,
    barrel: 1.8,
    ultimate: "execution",
  },
  viper: {
    title: "NEEDLE / 정밀 관통탄",
    interval: 0.24,
    recoil: 0.1,
    tint: 0xc2ed65,
    width: 0.9,
    height: 1,
    barrel: 1.25,
    ultimate: "needle",
  },
  bastion: {
    title: "FAULT / 지면 충격파",
    interval: 0.36,
    recoil: 0.24,
    tint: 0xefbe63,
    width: 1.25,
    height: 1.04,
    barrel: 0.7,
    ultimate: "fault",
  },
  pulse: {
    title: "RESURGE / 회복 EMP",
    interval: 0.2,
    recoil: 0.07,
    tint: 0x6bdad0,
    width: 0.94,
    height: 0.97,
    barrel: 0.85,
    ultimate: "emp",
  },
  reaper: {
    title: "HELLFIRE / 광역 탄막",
    interval: 0.115,
    recoil: 0.14,
    tint: 0xf28b65,
    width: 1.08,
    height: 1.02,
    barrel: 1,
    ultimate: "hellfire",
  },
};

export function equipOperator(group, id, native = false) {
  const def = LOADOUTS[id] || LOADOUTS.viper;
  if (["gale", "lumen", "nova"].includes(id))
    return equipArsenal(group, id, def);
  const gear = new THREE.Group();
  group.add(gear);
  const dark = new THREE.MeshStandardMaterial({
    color: 0x202932,
    roughness: 0.58,
    metalness: 0.35,
  });
  const cloth = new THREE.MeshStandardMaterial({
    color:
      id === "pulse"
        ? 0xd0ddd9
        : id === "viper"
          ? 0x48533b
          : id === "bastion"
            ? 0x665541
            : 0x49383b,
    roughness: 0.95,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: def.tint,
    emissive: def.tint,
    emissiveIntensity: 1.1,
  });
  const part = (geo, mat, x, y, z, parent = gear) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  if (!native) {
    part(new THREE.BoxGeometry(0.72, 0.68, 0.4), cloth, 0, 1.48, 0);
    for (const x of [-0.23, 0, 0.23])
      part(new THREE.BoxGeometry(0.16, 0.24, 0.12), dark, x, 1.32, 0.25);
    if (id === "viper") {
      const cape = part(
        new THREE.ConeGeometry(0.54, 1.35, 6, 1, true),
        cloth,
        0,
        1.2,
        -0.18,
      );
      cape.scale.z = 0.45;
      cape.rotation.z = 0.12;
      part(new THREE.SphereGeometry(0.3, 12, 8), cloth, 0, 2.22, -0.04);
      part(new THREE.BoxGeometry(0.42, 0.08, 0.13), glow, 0, 2.26, 0.24);
    } else if (id === "bastion") {
      for (const x of [-0.48, 0.48])
        part(new THREE.SphereGeometry(0.29, 8, 6), cloth, x, 1.77, 0);
      part(new THREE.SphereGeometry(0.34, 12, 8), dark, 0, 2.24, 0);
      part(new THREE.BoxGeometry(0.49, 0.14, 0.15), glow, 0, 2.24, 0.26);
      part(new THREE.BoxGeometry(0.74, 0.78, 0.27), dark, 0, 1.45, -0.38);
    } else if (id === "pulse") {
      part(new THREE.BoxGeometry(0.63, 0.75, 0.38), cloth, 0, 1.53, -0.38);
      part(new THREE.BoxGeometry(0.38, 0.11, 0.035), glow, 0, 1.59, -0.585);
      part(new THREE.BoxGeometry(0.11, 0.38, 0.035), glow, 0, 1.59, -0.59);
      for (const x of [-0.42, 0.42])
        part(
          new THREE.CylinderGeometry(0.1, 0.1, 0.53, 8),
          glow,
          x,
          1.5,
          -0.33,
        );
      part(
        new THREE.TorusGeometry(0.27, 0.06, 6, 16),
        dark,
        0,
        2.25,
        0,
      ).rotation.x = Math.PI / 2;
    } else {
      part(new THREE.BoxGeometry(0.65, 0.9, 0.3), dark, 0, 1.4, -0.35);
      for (let i = 0; i < 6; i++)
        part(
          new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6),
          glow,
          -0.3 + i * 0.12,
          1.65,
          0.27,
        );
      part(
        new THREE.SphereGeometry(0.29, 10, 8),
        dark,
        0,
        2.25,
        -0.02,
      ).scale.y = 0.55;
    }
  }
  if (native && (id === "archer" || id === "sniper")) {
    const mantle = new THREE.MeshStandardMaterial({
      color: id === "archer" ? 0x365d3e : 0x41576b,
      roughness: 1,
      side: THREE.DoubleSide,
    });
    const cape = part(
      new THREE.ConeGeometry(0.52, 1.45, 7, 1, true),
      mantle,
      0,
      1.22,
      -0.23,
    );
    cape.scale.z = 0.38;
    if (id === "archer") {
      part(
        new THREE.CylinderGeometry(0.13, 0.1, 0.8, 8),
        dark,
        -0.3,
        1.55,
        -0.36,
      ).rotation.z = -0.25;
      for (let i = 0; i < 4; i++) {
        part(
          new THREE.CylinderGeometry(0.014, 0.014, 0.7, 4),
          cloth,
          -0.4 + i * 0.07,
          1.95,
          -0.37,
        );
        part(
          new THREE.ConeGeometry(0.055, 0.16, 4),
          glow,
          -0.4 + i * 0.07,
          2.25,
          -0.37,
        );
      }
    }
  }
  const weapon = new THREE.Group();
  weapon.position.set(0.34, 1.43, 0.3);
  if (native) weapon.scale.setScalar(0.58);
  gear.add(weapon);
  part(new THREE.BoxGeometry(0.2, 0.25, 0.57), dark, 0, 0, 0.2, weapon);
  const barrel = part(
    new THREE.CylinderGeometry(0.065, 0.08, def.barrel, 10),
    dark,
    0,
    0.02,
    0.5 + def.barrel / 2,
    weapon,
  );
  barrel.rotation.x = Math.PI / 2;
  part(
    new THREE.BoxGeometry(0.12, 0.32, 0.2),
    dark,
    0,
    -0.2,
    0.16,
    weapon,
  ).rotation.x = -0.22;
  part(new THREE.BoxGeometry(0.13, 0.12, 0.25), glow, 0, 0.18, 0.27, weapon);
  if (id === "bastion")
    part(
      new THREE.CylinderGeometry(0.22, 0.22, 0.28, 10),
      dark,
      0,
      -0.14,
      0.3,
      weapon,
    ).rotation.z = Math.PI / 2;
  if (id === "reaper")
    part(new THREE.BoxGeometry(0.24, 0.2, 0.8), dark, 0.1, -0.1, 0.66, weapon);
  const muzzle = part(
    new THREE.ConeGeometry(0.19, 0.55, 6),
    new THREE.MeshBasicMaterial({
      color: def.tint,
      transparent: true,
      opacity: 0.95,
    }),
    0,
    0.02,
    0.6 + def.barrel,
    weapon,
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.visible = false;
  if (id === "archer") {
    for (const child of weapon.children) child.visible = false;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.9, 0.1),
      new THREE.Vector3(0, -0.5, 0.45),
      new THREE.Vector3(0, 0, 0.2),
      new THREE.Vector3(0, 0.5, 0.45),
      new THREE.Vector3(0, 0.9, 0.1),
    ]);
    part(
      new THREE.TubeGeometry(curve, 20, 0.045, 6, false),
      cloth,
      0,
      0,
      0,
      weapon,
    );
    const string = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.9, 0.1),
        new THREE.Vector3(0, 0, -0.3),
        new THREE.Vector3(0, 0.9, 0.1),
      ]),
      new THREE.LineBasicMaterial({ color: 0xd9dfbf }),
    );
    weapon.add(string);
    weapon.userData.bowString = string;
    const arrow = part(
      new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6),
      glow,
      0,
      0,
      0.3,
      weapon,
    );
    arrow.rotation.x = Math.PI / 2;
    const tip = part(
      new THREE.ConeGeometry(0.065, 0.18, 4),
      dark,
      0,
      0,
      1,
      weapon,
    );
    tip.rotation.x = Math.PI / 2;
    muzzle.visible = false;
  }
  if (!native) group.scale.set(def.width, def.height, 1);
  return { gear, weapon, muzzle, glow, def, shot: 0, charge: 0, id };
}
export function firePose(actor) {
  if (actor?.equipment) {
    actor.equipment.shot = 1;
    actor.equipment.combo = (actor.equipment.combo || 0) + 1;
  }
  if (actor?.motion) actor.motion.age = 0;
}
export function animateEquipment(actor, dt, moving) {
  const e = actor.equipment;
  if (!e) return;
  e.shot = Math.max(
    0,
    e.shot -
      dt *
        (e.id === "archer"
          ? 2.4
          : e.id === "sniper"
            ? 3
            : e.id === "bastion"
              ? 4.5
              : 12),
  );
  e.weapon.position.z = 0.3 - e.shot * e.def.recoil;
  e.weapon.rotation.x = -e.shot * e.def.recoil;
  if (e.id === "archer") e.weapon.rotation.y = -0.18 * e.shot;
  if (e.id === "sniper") e.weapon.rotation.z = 0.08 * e.shot;
  e.weapon.rotation.z =
    e.id === "reaper"
      ? Math.sin(e.shot * 25) * e.shot * 0.1
      : e.id === "sniper"
        ? e.shot * 0.08
        : 0;
  e.gear.rotation.x = e.shot * (e.id === "bastion" ? 0.07 : 0.025);
  e.gear.position.y = moving ? Math.sin(actor.mixer.time * 12) * 0.025 : 0;
  e.muzzle.visible = e.id !== "archer" && e.shot > 0.55;
  if (e.id === "archer") {
    const positions = e.weapon.userData.bowString.geometry.attributes.position;
    positions.setZ(1, -0.05 - 0.4 * (1 - e.shot));
    positions.needsUpdate = true;
  }
  e.glow.emissiveIntensity = 1.1 + e.charge * 2;
  e.weapon.rotation.x -= e.charge * 0.12;
  e.muzzle.scale.setScalar(1 + e.charge * 0.5);
  e.muzzle.rotation.z += dt * 30;
  if (e.custom)
    e.shot = Math.max(
      e.shot,
      actor.motion ? 1 - actor.motion.age / e.def.interval : 0,
    );
}

// Two-bone aim pose layered over locomotion; hands follow the weapon grip.
export function poseWeaponArms(actor) {
  if (!actor.equipment) return;
  if (actor.equipment.custom) {
    animateArsenal(actor);
    return;
  }
  actor.group.updateMatrixWorld(true);
  const target = new THREE.Vector3(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  const rotateTo = (bone, child, point) => {
    bone.getWorldPosition(a);
    child.getWorldPosition(b);
    const delta = new THREE.Quaternion().setFromUnitVectors(
      b.sub(a).normalize(),
      point.clone().sub(a).normalize(),
    );
    const world = bone
      .getWorldQuaternion(new THREE.Quaternion())
      .premultiply(delta);
    const parent = bone.parent
      .getWorldQuaternion(new THREE.Quaternion())
      .invert();
    bone.quaternion.copy(parent.multiply(world));
    bone.updateWorldMatrix(false, true);
  };
  for (const side of ["Right", "Left"]) {
    const bow = actor.equipment.id === "archer";
    if (actor.native && !bow && side === "Right") continue;
    const upper = actor.model.getObjectByName(
        actor.native
          ? side === "Right"
            ? "UpperArmR"
            : "UpperArmL"
          : side + "Arm",
      ),
      lower = actor.model.getObjectByName(
        actor.native
          ? side === "Right"
            ? "LowerArmR"
            : "LowerArmL"
          : side + "ForeArm",
      ),
      hand = actor.model.getObjectByName(
        actor.native ? (side === "Right" ? "WristR" : "WristL") : side + "Hand",
      );
    if (!upper || !lower || !hand) continue;
    const recoil = actor.equipment.shot * actor.equipment.def.recoil;
    target.set(
      side === "Right" ? 0.34 : 0.25,
      1.43,
      side === "Right" ? 0.42 - recoil : 0.85 - recoil,
    );
    if (actor.native)
      target
        .copy(actor.grip)
        .add(
          new THREE.Vector3(
            bow ? 0.12 : -0.025,
            -0.04,
            bow ? -0.28 * (1 - actor.equipment.shot) : 0.32,
          ),
        );
    if (actor.native && bow && side === "Left") target.copy(actor.grip);
    actor.group.localToWorld(target);
    upper.getWorldPosition(a);
    lower.getWorldPosition(b);
    hand.getWorldPosition(c);
    const l1 = a.distanceTo(b),
      l2 = b.distanceTo(c),
      distance = Math.min(
        l1 + l2 - 0.001,
        Math.max(0.01, a.distanceTo(target)),
      );
    const direction = target.clone().sub(a).normalize();
    const pole = new THREE.Vector3(
      side === "Right" ? 1 : -1,
      -0.4,
      0,
    ).transformDirection(actor.group.matrixWorld);
    pole.addScaledVector(direction, -pole.dot(direction)).normalize();
    const x = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance);
    const elbow = a
      .clone()
      .addScaledVector(direction, x)
      .addScaledVector(pole, Math.sqrt(Math.max(0, l1 * l1 - x * x)));
    rotateTo(upper, lower, elbow);
    rotateTo(lower, hand, target);
  }
}
