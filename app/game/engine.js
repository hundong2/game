import { MOBILITY, mobilityPose } from "./mobility.js";
import {
  archetypeAttack,
  archetypeUltimate,
  updateOrbs,
} from "./archetypes.js";
import { SPECIAL_ATTACKS, CHARGE_SECONDS } from "./specials.js";
import { dampAngle } from "./motion.js";
import { COMBAT_CLASSES, traceShot, SimulationClock } from "./combat.js";
import { EffectPool } from "./effects.js";
import { batchScenery } from "./performance.js";
import { LOADOUTS, firePose } from "./operators.js";
import * as THREE from "three";
import { AGENTS, ENEMIES, SKILLS, STAGES } from "./content.js";
import {
  createRun,
  chargeUltimate,
  spendUltimate,
  buyUpgrade,
  rewardKill,
  receiveDamage,
  waveComposition,
} from "./model.js";
import { localRanking } from "./storage.js";
import {
  loadCharacters,
  makeCharacter,
  animateCharacter,
} from "./characters.js";
import { createArena } from "./world.js";

// Renderer and input own no progression rules: all balance lives in content/model.
export class GameEngine {
  constructor(host, onUpdate) {
    this.host = host;
    this.onUpdate = onUpdate;
    this.onUpgrade = () => {};
    this.keys = new Set();
    this.enemies = [];
    this.obstacles = [];
    this.effects = [];
    this.simulationClock = new SimulationClock();
    this.yaw = Math.PI;
    this.pitch = 0;
    this.quality = "fast";
    this.previewLevel = 1;
    this.viewSize = 13;
    this.needsRender = true;
    this.fireTimer = 0;
    this.flash = 0;
    this.hit = 0;
    this.muted = false;
    this.disposed = false;
    this.playerPosition = new THREE.Vector3(0, 0, 10);
    this.aim = new THREE.Vector3(0, 0, -10);
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerActive = false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x19262d);
    this.scene.fog = new THREE.FogExp2(0x26343e, 0.006);
    const aspect = host.clientWidth / host.clientHeight;
    this.camera = new THREE.OrthographicCamera(
      -13 * aspect,
      13 * aspect,
      13,
      -13,
      0.1,
      130,
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.setSize(host.clientWidth, host.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute("aria-label", "항공 뷰 전투 화면");
    this.renderer.domElement.tabIndex = 0;
    host.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xb8dafa, 0x283845, 1.65));
    const sun = new THREE.DirectionalLight(0xffd3aa, 2.65);
    sun.position.set(-14, 32, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -45,
      right: 45,
      top: 45,
      bottom: -45,
      far: 100,
    });
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x79bddd, 1.4);
    rim.position.set(16, 14, -20);
    this.scene.add(rim);
    this.buildWorld();
    this.followCamera();
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xc2ed65,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    this.playerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.76, 0.84, 48),
      ringMaterial,
    );
    this.playerRing.rotation.x = -Math.PI / 2;
    this.playerRing.position.y = 0.09;
    this.scene.add(this.playerRing);
    this.aimLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({
        color: 0xc2ed65,
        transparent: true,
        opacity: 0.3,
        dashSize: 0.4,
        gapSize: 0.2,
      }),
    );
    this.scene.add(this.aimLine);
    this.ready = loadCharacters().then((assets) => {
      if (this.disposed) return;
      this.assets = assets;
      // Single static atlas avoids nine character renders and GPU readbacks at boot.
      this.portraits = Object.fromEntries(AGENTS.map(a => [a.id, import.meta.env.BASE_URL + "art/operators-v15.png"]));
    });
    this.resizeObserver = new ResizeObserver(() => {
      if (this.disposed) return;
      const w = host.clientWidth,
        h = host.clientHeight;
      this.camera.left = (-this.viewSize * w) / h;
      this.camera.right = (this.viewSize * w) / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.needsRender = true;
    });
    this.resizeObserver.observe(host);
    this.listeners = [];
    const listen = (target, type, fn) => {
      target.addEventListener(type, fn);
      this.listeners.push(() => target.removeEventListener(type, fn));
    };
    listen(window, "keydown", (e) => this.keyDown(e));
    listen(window, "keyup", (e) => this.keys.delete(e.code));
    listen(window, "blur", () => this.pause());
    listen(document, "visibilitychange", () => {
      if (document.hidden) this.pause();
    });
    listen(this.renderer.domElement, "mousemove", (e) =>
      this.pointAt(e.clientX, e.clientY),
    );
    listen(this.renderer.domElement, "mousedown", (e) => {
      if (this.run?.phase !== "playing") return;
      this.pointAt(e.clientX, e.clientY);
      this.unlockAudio();
      if (e.button === 0) {
        this.beginCharge();
      }
      if (e.button === 2) this.ultimate();
    });
    listen(window, "mouseup", (e) => {
      if (e.button === 0) this.releaseCharge();
    });
    listen(this.renderer.domElement, "contextmenu", (e) => e.preventDefault());
    listen(this.renderer.domElement, "webglcontextlost", (e) => {
      e.preventDefault();
      this.pause();
      if (this.run) {
        this.run.message = "그래픽 연결이 중단되었습니다. 새로고침해 주세요.";
        this.emit();
      }
    });
    this.performanceStats = {
      frameMs: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
    };
    this.last = performance.now();
    this.uiTimer = 0;
    this.raf = requestAnimationFrame((now) => this.frame(now));
  }
  pointAt(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      (-(clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.pointerActive = true;
    this.updateAim();
  }
  updateAim() {
    if (!this.pointerActive) return;
    this.camera.updateMatrixWorld();
    const ray = (this.aimRay ||= new THREE.Raycaster());
    ray.setFromCamera(this.pointer, this.camera);
    ray.ray.intersectPlane(
      (this.groundPlane ||= new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)),
      this.aim,
    );
    this.yaw = Math.atan2(
      this.aim.x - this.playerPosition.x,
      this.aim.z - this.playerPosition.z,
    );
  }
  followCamera() {
    const p = this.playerPosition;
    this.camera.position.set(p.x, 26, p.z + 19);
    this.camera.lookAt(p.x, 0, p.z);
    this.camera.updateMatrixWorld();
  }
  box(w, h, d, color, x, y, z, parent = this.scene) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  buildWorld() {
    createArena(this);
    batchScenery(this);
  }
  start(agent) {
    if (!this.assets) return;
    this.closePreview();
    this.clearEnemies();
    if (this.playerVisual) {
      this.scene.remove(this.playerVisual.group);
      this.disposeObject(this.playerVisual.group);
    }
    this.run = createRun(agent);
    this.fx?.clear();
    this.simulationClock?.reset();
    this.playerPosition.set(0, 0, 10);
    this.aim.set(0, 0, -10);
    this.yaw = Math.PI;
    this.pointerActive = false;
    this.keys.clear();
    this.fireTimer = 0;
    this.saved = false;
    this.storageSaved = undefined;
    this.playerVisual = makeCharacter(
      this.assets,
      this.run.agent.gender === "여성" ? "female" : "male",
      this.run.agent.color,
      false,
      this.run.agent.id,
    );
    this.scene.add(this.playerVisual.group);
    this.playerRing.material.color.set(this.run.agent.color);
    this.aimLine.material.color.set(this.run.agent.color);
    this.applyStage();
    this.spawnWave();
    this.followCamera();
    this.unlockAudio();
    this.emit();
  }
  setQuality(value) {
    this.quality = value;
    this.renderer.shadowMap.enabled = value === "high";
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, value === "high" ? 1.5 : 1.25),
    );
    this.needsRender = true;
  }
  previewOperator(id, motion = "idle") {
    if (!this.assets) return;
    this.closePreview();
    this.previewMotion = motion;
    this.previewVisual = makeCharacter(
      this.assets,
      "female",
      LOADOUTS[id].tint,
      false,
      id,
    );
    this.previewVisual.group.position.set(0, 0, 10);
    this.previewVisual.group.rotation.y = 0.3;
    this.scene.add(this.previewVisual.group);
    this.viewSize = 2.7;
    const aspect = this.host.clientWidth / this.host.clientHeight;
    Object.assign(this.camera, {
      left: -2.7 * aspect,
      right: 2.7 * aspect,
      top: 2.7,
      bottom: -2.7,
    });
    this.camera.position.set(4, 3.1, 16);
    this.camera.lookAt(0, 1.3, 10);
    this.camera.updateProjectionMatrix();
    this.needsRender = true;
  }
  closePreview() {
    this.fx?.clear();
    this.previewShotTimer = 0;
    if (this.previewVisual) {
      this.scene.remove(this.previewVisual.group);
      this.disposeObject(this.previewVisual.group);
      this.previewVisual = null;
    }
    this.viewSize = 13;
    if (this.host) {
      const aspect = this.host.clientWidth / this.host.clientHeight;
      Object.assign(this.camera, {
        left: -13 * aspect,
        right: 13 * aspect,
        top: 13,
        bottom: -13,
      });
      this.camera.updateProjectionMatrix();
      this.followCamera();
    }
    this.needsRender = true;
  }
  unlockAudio() {
    if (!this.audio) {
      try {
        this.audio = new (window.AudioContext || window.webkitAudioContext)();
      } catch {}
    }
    this.audio?.resume().catch(() => {});
  }
  tone(frequency, duration = 0.08, type = "sawtooth", volume = 0.025) {
    if (!this.audio || this.muted) return;
    const o = this.audio.createOscillator(),
      g = this.audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(frequency, this.audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(25, frequency / 4),
      this.audio.currentTime + duration,
    );
    g.gain.setValueAtTime(volume, this.audio.currentTime);
    g.gain.exponentialRampToValueAtTime(
      0.001,
      this.audio.currentTime + duration,
    );
    o.connect(g);
    g.connect(this.audio.destination);
    o.start();
    o.stop(this.audio.currentTime + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  spawnWave() {
    const types = waveComposition(this.run.wave),
      p = this.playerPosition;
    types.forEach((type, i) => {
      const angle = (i / types.length) * Math.PI * 2;
      const x =
        this.run.wave === 1
          ? -9 + i * 3.6
          : THREE.MathUtils.clamp(p.x + Math.sin(angle) * 18, -20, 20);
      const z =
        this.run.wave === 1
          ? -8 - i * 1.4
          : THREE.MathUtils.clamp(p.z + Math.cos(angle) * 20, -37, 37);
      let sx = x,
        sz = z;
      for (let n = 0; n < 12 && !this.canMove(sx, sz, 0.8); n++) {
        sx = THREE.MathUtils.clamp(sx + 1.5, -20, 20);
        sz = THREE.MathUtils.clamp(sz + 1.1, -37, 37);
      }
      this.spawn(type, sx, sz);
    });
    this.run.remaining = this.enemies.length;
  }
  spawn(type, x, z) {
    const spec = ENEMIES[type],
      group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.setScalar(spec.scale);
    this.scene.add(group);
    const actor = this.assets
      ? makeCharacter(
          this.assets,
          this.enemies.length % 2 ? "zombieFemale" : "zombieMale",
          0x879d75,
          true,
          type,
        )
      : null;
    if (actor) group.add(actor.group);
    const torso = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.48, 1.4, 4, 8),
      new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    torso.material.visible = false;
    torso.position.y = 1.15;
    group.add(torso);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 8, 8),
      new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    head.material.visible = false;
    head.position.y = 2.25;
    group.add(head);
    const hpBackground = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.075),
      new THREE.MeshBasicMaterial({ color: 0x18272c, depthTest: false }),
    );
    hpBackground.rotation.x = -Math.PI / 3;
    hpBackground.position.set(0, 2.9, 0);
    group.add(hpBackground);
    const hpBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.075),
      new THREE.MeshBasicMaterial({
        color: type === "boss" ? 0xffa55e : 0xd98173,
        depthTest: false,
      }),
    );
    hpBar.rotation.x = -Math.PI / 3;
    hpBar.position.set(0, 2.91, 0.01);
    group.add(hpBar);
    const enemy = {
      type,
      ...spec,
      hp: spec.hp * (1 + (this.run.wave - 1) * 0.1),
      maxHp: spec.hp * (1 + (this.run.wave - 1) * 0.1),
      group,
      head,
      torso,
      actor,
      hpBar,
      legs: [],
      arms: [],
      cooldown: 1,
      slow: 0,
      flash: 0,
    };
    torso.userData.enemy = enemy;
    head.userData.enemy = enemy;
    this.enemies.push(enemy);
  }
  disposeObject(object) {
    object.traverse((o) => {
      if (!o.userData.sharedGeometry) o.geometry?.dispose();
      o.skeleton?.dispose();
      if (o.material) {
        for (const mat of Array.isArray(o.material)
          ? o.material
          : [o.material]) {
          // Skin textures belong to the shared character library; geometry/materials are per actor.
          mat.dispose();
        }
      }
    });
  }
  clearEnemies() {
    for (const e of this.enemies) {
      this.scene.remove(e.group);
      this.disposeObject(e.group);
    }
    this.enemies = [];
  }
  applyStage() {
    const stage = STAGES[Math.min(2, Math.floor((this.run.wave - 1) / 3))];
    this.scene.background.set(stage.sky);
    this.scene.fog.color.set(stage.fog);
  }
  keyDown(e) {
    if (document.querySelector("[role=dialog]")) return;
    if (
      e.target instanceof HTMLElement &&
      (e.target.matches("input,textarea,select") || e.target.isContentEditable)
    )
      return;
    const recognized = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Space",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyF",
      "KeyQ",
      "KeyE",
      "KeyR",
      "KeyU",
      "KeyZ",
      "KeyX",
      "KeyC",
      "Digit1",
      "Digit2",
      "Digit3",
      "Escape",
      "ControlLeft",
      "ControlRight",
      "ShiftLeft",
      "ShiftRight",
    ];
    if (!recognized.includes(e.code) || !this.run) return;
    e.preventDefault();
    if (e.code === "Escape" && !e.repeat) {
      if (this.run.phase === "paused") this.resume();
      else this.pause();
      return;
    }
    if (this.run.phase !== "playing") return;
    this.keys.add(e.code);
    if (e.repeat) return;

    if (e.code === "ControlLeft" || e.code === "ControlRight") this.roll();
    if (e.code === "KeyZ") this.upgrade("damage");
    if (e.code === "KeyX") this.upgrade("armor");
    if (e.code === "KeyC") this.upgrade("range");
    if (e.code === "KeyR") this.reload();
    if (e.code === "Space") this.skill();
    if (e.code === "KeyF") this.selectSkill((this.run.selectedSkill + 1) % 3);
    if (e.code.startsWith("Digit"))
      this.selectSkill(Number(e.code.slice(-1)) - 1);
    if (e.code === "KeyU") {
      this.pause();
      this.onUpgrade?.();
    }
  }
  roll() {
    const r = this.run;
    const mobility = MOBILITY[r?.agent.id] || MOBILITY.viper;
    if (!r || r.phase !== "playing" || r.rollTime > 0 || r.rollCooldown > 0 || r.stamina < mobility.cost)
      return false;
    let x =
      Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
      Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
    let z =
      Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
      Number(this.keys.has("KeyW") || this.keys.has("ArrowUp"));
    const length = Math.hypot(x, z);
    if (!length || mobility.forward) {
      x = Math.sin(this.yaw);
      z = Math.cos(this.yaw);
    } else {
      x /= length;
      z /= length;
    }
    Object.assign(r, {
      rollTime: mobility.duration,
      rollCooldown: mobility.cooldown,
      rollX: x,
      rollZ: z,
      stamina: r.stamina - mobility.cost,
    });
    r.guard = false;
    r.message = mobility.name;
    this.fx ||= new EffectPool(this.scene);
    this.fx.mobility(this.playerPosition, Math.atan2(x,z), r.agent.id, LOADOUTS[r.agent.id].tint);
    this.cancelCharge();
    this.emit();
    return true;
  }
  selectSkill(index) {
    if (this.run && index >= 0 && index < 3) {
      this.run.selectedSkill = index;
      this.emit();
    }
  }
  reload() {
    if (
      this.run?.phase !== "playing" ||
      this.run.reload ||
      this.run.ammo === this.run.magazine
    )
      return;
    this.run.reload =
      this.run.agent.id === "archer"
        ? 0.8
        : this.run.agent.id === "sniper"
          ? 2.1
          : 1.6;
    this.tone(180, 0.2, "triangle");
    this.emit();
  }
  shoot() {
    if (this.run?.rollTime > 0) return;
    const r = this.run;
    if (r?.phase !== "playing" || r.reload || this.fireTimer > 0 || r.guard)
      return;
    if (r.ammo <= 0) {
      this.reload();
      return;
    }
    r.ammo--;
    this.fireTimer =
      Math.max(-0.1, this.fireTimer) + LOADOUTS[r.agent.id].interval;
    firePose(this.playerVisual);
    this.flash = 0.07;
    this.tone(110, 0.08, "sawtooth", 0.04);
    this.updateAim();
    r.shots++;
    if (archetypeAttack(this)) {
      this.needsRender = true;
      return;
    }
    const spec = COMBAT_CLASSES[r.agent.id];
    for (let pellet = 0; pellet < spec.pellets; pellet++)
      this.fireRay(
        this.yaw + (pellet - (spec.pellets - 1) / 2) * spec.spread,
        spec,
      );
    this.needsRender = true;
  }
  fireRay(angle, spec, multiplier = 1) {
    const r = this.run,
      p = this.playerPosition;
    const trace = traceShot(
      p.x,
      p.z,
      angle,
      r.range,
      this.enemies,
      this.obstacles,
      spec.pierce,
    );
    for (const { enemy, distance } of trace.hits) {
      let damage = r.damage * spec.multiplier * multiplier;
      if (r.agent.id === "sniper" && distance > 18) damage *= 1.5;
      if (r.agent.id === "viper" && r.shots % 4 === 0) damage *= 1.6;
      if (r.agent.id === "reaper") damage *= 1 + r.frenzy * 0.06;
      if (r.agent.id === "archer") {
        enemy.poison = 3;
        enemy.poisonDamage = 8 + r.level * 2;
      }
      this.damageEnemy(enemy, damage);
      this.fx ||= new EffectPool(this.scene);
      this.fx.impact(enemy.group.position, LOADOUTS[r.agent.id].tint);
      if (r.agent.id === "pulse") r.hp = Math.min(r.maxHp, r.hp + 2);
      this.hit = 0.15;
    }
    this.fx ||= new EffectPool(this.scene);
    this.fx.tracer(
      p.x,
      p.z,
      trace.dx,
      trace.dz,
      trace.distance,
      LOADOUTS[r.agent.id].tint,
      r.agent.id,
      r.level,
    );
  }
  burst(position, color) {
    this.fx ||= new EffectPool(this.scene);
    this.fx.burst(position, color);
  }
  damageEnemy(enemy, damage) {
    if (enemy.hp <= 0) return;
    enemy.hp -= damage;
    enemy.hpBar.scale.x = Math.max(0, enemy.hp / enemy.maxHp);
    enemy.flash = 0.12;
    for (const material of enemy.actor?.materials || [])
      material.emissive.setHex(0x913c22);
    if (enemy.hp <= 0) {
      this.burst(enemy.group.position, 0xc2b175);
      rewardKill(this.run, enemy);
      this.scene.remove(enemy.group);
      this.disposeObject(enemy.group);
      this.enemies = this.enemies.filter((e) => e !== enemy);
      this.run.remaining = this.enemies.length;
    }
  }
  beginCharge() {
    const r = this.run;
    if (
      !r ||
      r.phase !== "playing" ||
      r.rollTime > 0 ||
      r.reload > 0 ||
      r.charging
    )
      return false;
    this.shoot();
    if (r.reload > 0) return false;
    r.charging = true;
    r.charge = 0;
    return true;
  }
  cancelCharge() {
    if (this.run) {
      this.run.charging = false;
      this.run.charge = 0;
    }
  }
  releaseCharge() {
    const r = this.run;
    if (!r?.charging) return false;
    const charged = r.charge >= CHARGE_SECONDS;
    this.cancelCharge();
    if (
      !charged ||
      r.phase !== "playing" ||
      r.rollTime > 0 ||
      r.reload > 0 ||
      r.specialCooldown > 0 ||
      r.ammo < 2
    )
      return false;
    const spec = SPECIAL_ATTACKS[r.agent.id];
    r.ammo -= 2;
    r.specialCooldown = 2.5;
    r.shots++;
    if (!archetypeAttack(this, true))
      for (let i = 0; i < spec.count; i++)
        this.fireRay(
          this.yaw + (i - (spec.count - 1) / 2) * spec.spread,
          { ...COMBAT_CLASSES[r.agent.id], pierce: spec.pierce },
          spec.multiplier,
        );
    if (r.agent.id === "pulse") r.hp = Math.min(r.maxHp, r.hp + 15);
    if (r.agent.id === "bastion") r.ward = Math.max(r.ward, 2);
    firePose(this.playerVisual);
    this.flash = 0.15;
    r.message = spec.name + " 발사";
    this.emit();
    return true;
  }
  ultimate() {
    const r = this.run;
    if (!r || !spendUltimate(r)) {
      if (r?.phase === "playing") {
        r.message = "필살기 충전이 필요합니다.";
        this.emit();
      }
      return false;
    }
    this.cancelCharge();
    r.ultimateFx = r.agent.id === "lumen" ? 3 : 1.6;
    r.ultimateSequence++;
    const def = LOADOUTS[r.agent.id];
    archetypeUltimate(this);
    const forward = new THREE.Vector3(
      Math.sin(this.yaw),
      0,
      Math.cos(this.yaw),
    );
    const target = this.playerPosition.clone().addScaledVector(forward, 10);
    for (const enemy of this.enemies.slice()) {
      const delta = enemy.group.position.clone().sub(this.playerPosition),
        distance = delta.length();
      if (
        (def.ultimate === "needle" || def.ultimate === "execution") &&
        delta.dot(forward) > 0 &&
        delta.dot(forward) < r.range &&
        Math.abs(delta.x * forward.z - delta.z * forward.x) <
          (def.ultimate === "execution" ? 0.8 : 2.4)
      )
        this.damageEnemy(enemy, 360 + r.level * 18);
      if (def.ultimate === "thorns" && distance < 20) {
        enemy.poison = 5;
        enemy.poisonDamage = 20;
        enemy.slow = 5;
        this.damageEnemy(enemy, 150 + r.level * 10);
      }
      if (
        def.ultimate === "fault" &&
        distance < 15 &&
        delta.dot(forward) > 0 &&
        Math.abs(delta.x * forward.z - delta.z * forward.x) <
          delta.dot(forward) * 1.4
      ) {
        enemy.slow = 5;
        this.damageEnemy(enemy, 220 + r.level * 12);
      }
      if (def.ultimate === "emp" && distance < 18) {
        enemy.slow = 8;
        this.damageEnemy(enemy, 130 + r.level * 8);
      }
      if (
        def.ultimate === "hellfire" &&
        enemy.group.position.distanceTo(target) < 11
      )
        this.damageEnemy(enemy, 300 + r.level * 15);
    }
    if (def.ultimate === "fault") r.ward = 5;
    if (def.ultimate === "emp") r.hp = Math.min(r.maxHp, r.hp + 75);
    this.fx ||= new EffectPool(this.scene);
    this.fx.ultimate(
      def.ultimate === "hellfire" ? target : this.playerPosition,
      this.yaw,
      r.agent.id,
      def.tint,
      r.range,
    );
    firePose(this.playerVisual);
    this.skillFlash = 0.4;
    r.message = def.title + " 발동";
    this.tone(80, 0.5, "sawtooth", 0.055);
    this.emit();
    return true;
  }
  skill() {
    const r = this.run;
    if (r?.phase !== "playing" || r.cooldowns[r.selectedSkill] > 0) return;
    const n = r.selectedSkill;
    if (n === 0 && ["gale", "lumen", "nova"].includes(r.agent.id)) {
      r.cooldowns[0] = 12;
      if (r.agent.id === "gale") r.ward = 5;
      if (r.agent.id === "lumen") r.hp = Math.min(r.maxHp, r.hp + 40);
      if (r.agent.id === "nova") {
        r.ammo = r.magazine;
        r.specialCooldown = 0;
      }
      r.message = COMBAT_CLASSES[r.agent.id].skill + " 발동";
      this.emit();
      return;
    }
    if (n === 0 && r.agent.id === "pulse") r.hp = Math.min(r.maxHp, r.hp + 25);
    if (
      n === 0 &&
      ["archer", "sniper", "bastion", "reaper"].includes(r.agent.id)
    ) {
      r.cooldowns[0] = SKILLS[0].cooldown * r.agent.cooldown;
      if (r.agent.id === "archer")
        for (let i = -2; i <= 2; i++)
          this.fireRay(this.yaw + i * 0.13, COMBAT_CLASSES.archer, 0.85);
      if (r.agent.id === "sniper") {
        this.fireRay(this.yaw, COMBAT_CLASSES.sniper, 2);
        for (const e of this.enemies)
          if (e.group.position.distanceTo(this.playerPosition) < 25) e.slow = 4;
      }
      if (r.agent.id === "bastion") {
        r.ward = 6;
        this.burst(this.playerPosition, 0xefbe63);
      }
      if (r.agent.id === "reaper") {
        r.ammo = r.magazine;
        r.frenzy = 5;
      }
      r.message = COMBAT_CLASSES[r.agent.id].skill + " 발동";
      this.emit();
      return;
    }

    if (n === 1 && r.hp >= r.maxHp) {
      r.message = "체력이 가득 찼습니다.";
      this.emit();
      return;
    }
    r.cooldowns[n] = SKILLS[n].cooldown * r.agent.cooldown;
    for (const enemy of this.enemies) {
      const distance = enemy.group.position.distanceTo(this.playerPosition);
      if (n === 0 && distance < 12) this.damageEnemy(enemy, 100 + r.level * 8);
      if (n === 2 && distance < 18) enemy.slow = 6;
    }
    if (n === 1) r.hp = Math.min(r.maxHp, r.hp + r.agent.heal);
    r.message = `${SKILLS[n].name} 발동`;
    this.tone(n === 1 ? 900 : 220, 0.4, "sine", 0.05);
    this.burst(
      this.playerPosition,
      n === 0 ? 0xedc577 : n === 1 ? 0x77ddb6 : 0x89cce8,
    );
    this.skillFlash = 0.35;
    this.emit();
  }
  upgrade(id) {
    if (buyUpgrade(this.run, id)) {
      this.tone(650, 0.12, "sine");
      this.emit();
      return true;
    }
    return false;
  }
  pause() {
    if (this.run?.phase !== "playing") return;
    this.cancelCharge();
    this.run.phase = "paused";
    this.keys.clear();
    this.run.guard = false;
    if (document.pointerLockElement) document.exitPointerLock();
    this.emit();
  }
  resume() {
    if (this.run?.phase !== "paused") return;
    this.run.phase = "playing";
    this.keys.clear();
    this.unlockAudio();
    this.emit();
  }
  quit() {
    if (this.run) {
      this.run.phase = "menu";
      this.clearEnemies();
      this.keys.clear();
      if (this.playerVisual) {
        this.scene.remove(this.playerVisual.group);
        this.disposeObject(this.playerVisual.group);
        this.playerVisual = null;
      }
      this.run = null;
    }
  }
  canMove(x, z, radius = 0.35) {
    return (
      Math.abs(x) < 21 &&
      Math.abs(z) < 39 &&
      !this.obstacles.some(
        (o) =>
          Math.abs(x - o.x) < o.w + radius && Math.abs(z - o.z) < o.d + radius,
      )
    );
  }
  update(dt) {
    const r = this.run;
    if (!r || r.phase !== "playing") return;
    r.seconds += dt;
    updateOrbs(this, dt);
    r.specialCooldown = Math.max(0, r.specialCooldown - dt);
    r.ultimateFx = Math.max(0, r.ultimateFx - dt);
    if (r.charging) r.charge = Math.min(CHARGE_SECONDS, r.charge + dt);
    r.rollCooldown = Math.max(0, r.rollCooldown - dt);
    const rolling = r.rollTime > 0;
    const rollStep = Math.min(dt, r.rollTime);
    r.rollTime = Math.max(0, r.rollTime - dt);
    r.ward = Math.max(0, r.ward - dt);
    r.frenzy = Math.max(0, r.frenzy - dt * 0.25);
    r.ultimateLock = Math.max(0, r.ultimateLock - dt);
    this.fireTimer = Math.max(-0.1, this.fireTimer - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.hit = Math.max(0, this.hit - dt);
    this.skillFlash = Math.max(0, (this.skillFlash || 0) - dt);
    this.damageFlash = Math.max(0, (this.damageFlash || 0) - dt);
    for (let i = 0; i < r.cooldowns.length; i++)
      r.cooldowns[i] = Math.max(0, r.cooldowns[i] - dt);
    if (r.reload > 0) {
      r.reload = Math.max(0, r.reload - dt);
      if (r.reload === 0) r.ammo = r.magazine;
    }
    r.guard =
      !rolling &&
      (this.keys.has("Guard") || this.keys.has("KeyQ")) &&
      r.stamina > 2;
    r.stamina = THREE.MathUtils.clamp(
      r.stamina + (r.guard ? -20 : 14) * dt,
      0,
      100,
    );
    const forward =
      (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) -
      (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0);
    const right =
      (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) -
      (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0);
    const moving = !!(forward || right),
      norm = Math.hypot(forward, right) || 1;
    const sprint =
      (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) &&
      r.stamina > 10 &&
      moving &&
      !r.guard;
    if (sprint) r.stamina = Math.max(0, r.stamina - 24 * dt);
    const speed =
        (r.agent.speed * (r.guard ? 0.4 : sprint ? 1.45 : 1) * dt) / norm,
      p = this.playerPosition;
    const moveX = rolling ? r.rollX * MOBILITY[r.agent.id].speed * rollStep : right * speed;
    const moveZ = rolling ? r.rollZ * MOBILITY[r.agent.id].speed * rollStep : -forward * speed;
    if (this.canMove(p.x + moveX, p.z)) p.x += moveX;
    if (this.canMove(p.x, p.z + moveZ)) p.z += moveZ;
    this.followCamera();
    this.updateAim();
    if (this.playerVisual) {
      this.playerVisual.group.position.copy(p);
      this.playerVisual.group.rotation.y = this.yaw;
      const angle = Math.atan2(right, -forward) - this.yaw;
      const front = Math.cos(angle),
        side = Math.sin(angle);
      const direction =
        front > 0.55
          ? "run"
          : front < -0.55
            ? "Run_Back"
            : side > 0
              ? "Run_Right"
              : "Run_Left";
      this.playerMotion = {
        moving,
        speed: sprint ? 1.6 : 1,
        direction,
        firing: this.keys.has("Fire") || this.flash > 0,
      };
    }
    // Left hold charges instead of repeatedly firing.
    for (const e of this.enemies) {
      e.cooldown -= dt;
      e.slow = Math.max(0, e.slow - dt);
      e.flash = Math.max(0, e.flash - dt);
      const tint = e.flash
        ? 0x913c22
        : e.poison > 0
          ? 0x23582c
          : e.slow
            ? 0x164d6a
            : 0;
      if (e.tint !== tint) {
        e.tint = tint;
        for (const material of e.actor?.materials || [])
          material.emissive.setHex(tint);
      }
      if (e.poison > 0) {
        const tick = Math.min(dt, e.poison);
        e.poison -= tick;
        this.damageEnemy(e, e.poisonDamage * tick);
        if (e.hp <= 0) continue;
      }
      const vx = p.x - e.group.position.x,
        vz = p.z - e.group.position.z,
        distance = Math.hypot(vx, vz);
      e.group.rotation.y = Math.atan2(vx, vz);
      e.moving = distance > 1.15 * e.scale;
      if (distance > 1.15 * e.scale) {
        const step = e.speed * (e.slow ? 0.2 : 1) * dt;
        const ex = e.group.position.x,
          ez = e.group.position.z;
        let nx = ex + (vx / distance) * step;
        const nz = ez + (vz / distance) * step;
        if (this.canMove(nx, ez, 0.3)) e.group.position.x = nx;
        else {
          nx = ex + (ex > 0 ? -1 : 1) * step;
          if (this.canMove(nx, ez, 0.3)) e.group.position.x = nx;
        }
        if (this.canMove(e.group.position.x, nz, 0.3)) e.group.position.z = nz;
        else {
          const side = ex >= 0 ? 1 : -1;
          nx = e.group.position.x + side * step;
          if (this.canMove(nx, ez, 0.3)) e.group.position.x = nx;
        }
        e.legs.forEach(
          (leg, i) =>
            (leg.rotation.x =
              Math.sin(r.seconds * e.speed * 5 + i * Math.PI) * 0.45),
        );
      } else if (e.cooldown <= 0) {
        if (!rolling) receiveDamage(r, e.damage);
        e.cooldown = 1.1;
        this.damageFlash = 0.3;
        this.tone(65, 0.16, "sawtooth", 0.035);
      }
    }
    if (this.enemies.length === 0 && r.phase === "playing") {
      if (r.wave === 9) {
        r.phase = "won";
        r.score += 3000;
      } else if (!r.intermission) {
        r.intermission = 7;
        chargeUltimate(r, 45 + Math.floor((r.wave - 1) / 3) * 15);
        r.credits += 70 + r.wave * 10;
        r.hp = Math.min(r.maxHp, r.hp + 18);
        r.message = "웨이브 완료 · 보급 크레딧과 체력을 획득했습니다.";
      } else {
        r.intermission = Math.max(0, r.intermission - dt);
        if (r.intermission === 0) {
          r.wave++;
          this.applyStage();
          this.spawnWave();
          r.message = `WAVE ${String(r.wave).padStart(2, "0")} · 감염자 접근 중`;
        }
      }
    }
    if (["dead", "won"].includes(r.phase) && !this.saved) {
      this.saved = true;
      this.storageSaved = localRanking.submit(r);
      this.keys.clear();
      this.emit();
    }
  }
  emit() {
    this.needsRender = true;
    if (this.run)
      this.onUpdate({
        ...this.run,
        upgrades: { ...this.run.upgrades },
        cooldowns: [...this.run.cooldowns],
        hit: this.hit > 0,
        damageFlash: this.damageFlash > 0,
        skillFlash: this.skillFlash > 0,
        position: { x: this.playerPosition.x, z: this.playerPosition.z },
        heading: this.yaw,
        enemies: [], // Radar is disabled; avoid rebuilding an unused enemy snapshot.
        storageSaved: this.storageSaved,
      });
  }
  frame(now) {
    if (this.disposed) return;
    const elapsed = now - this.last;
    this.performanceStats.frameMs =
      this.performanceStats.frameMs * 0.95 + elapsed * 0.05;
    const dt = Math.min(elapsed / 1000, 0.1);
    this.last = now;
    if (document.hidden) {
      this.raf = requestAnimationFrame((next) => this.frame(next));
      return;
    }
    if (
      this.run?.phase !== "playing" &&
      !this.previewVisual &&
      !this.needsRender
    ) {
      this.raf = requestAnimationFrame((next) => this.frame(next));
      return;
    }
    this.needsRender = false;
    this.simulationClock ||= new SimulationClock();
    const simulationStart = performance.now();
    const steps =
      this.run?.phase === "playing"
        ? this.simulationClock.advance(elapsed / 1000, (step) =>
            this.update(step),
          )
        : 0;
    this.performanceStats.simulationMs = performance.now() - simulationStart;
    this.performanceStats.simulationSteps = steps;
    if (this.run?.phase === "playing") {
      if (this.playerVisual && this.playerMotion) {
        const m = this.playerMotion;
        this.playerVisual.equipment.charge = this.run.charging
          ? this.run.charge / CHARGE_SECONDS
          : 0;
        animateCharacter(
          this.playerVisual,
          m.moving,
          dt,
          m.speed,
          m.direction,
          m.firing,
        );
      }
      if (this.playerVisual) {
        const r = this.run,
          group = this.playerVisual.group;
        group.position.copy(this.playerPosition);
        this.playerVisual.facing = dampAngle(
          this.playerVisual.facing ?? this.yaw,
          this.yaw,
          dt,
        );
        group.rotation.y = this.playerVisual.facing;
        const traversal = mobilityPose(r.agent.id, r.rollTime);
        group.scale.set(traversal.phaseScale, traversal.squash * traversal.phaseScale, traversal.phaseScale);
        group.rotation.x = 0;
        group.rotation.z = 0;
        if (r.rollTime > 0) {
          group.rotation.y = Math.atan2(r.rollX, r.rollZ);
          group.rotation.x = traversal.lean;
          group.position.y = traversal.lift;
        }
      }
      this.performanceStats.visibleEnemies = 0;
      this.cullPoint ||= new THREE.Vector3();
      for (const enemy of this.enemies) {
        this.cullPoint.copy(enemy.group.position);
        this.cullPoint.y = 1.4;
        this.cullPoint.project(this.camera);
        enemy.group.visible =
          Math.abs(this.cullPoint.x) < 1.2 && Math.abs(this.cullPoint.y) < 1.2;
        if (!enemy.group.visible) {
          enemy.animationDebt = 0;
          continue;
        }
        this.performanceStats.visibleEnemies++;
        if (!enemy.actor) continue;
        enemy.animationDebt = (enemy.animationDebt || 0) + dt;
        const interval =
          enemy.group.position.distanceToSquared(this.playerPosition) > 625
            ? 1 / 15
            : 1 / 30;
        if (enemy.animationDebt >= interval) {
          animateCharacter(
            enemy.actor,
            enemy.moving,
            enemy.animationDebt,
            enemy.slow ? 0.2 : enemy.speed * 0.65,
          );
          enemy.animationDebt = 0;
        }
      }
    }
    if (this.previewVisual) {
      if(this.previewMotion === "idle")this.previewVisual.group.rotation.y += dt * 0.12;
      this.previewShotTimer = (this.previewShotTimer || 0) - dt;
      if (
        ["shoot", "strafe", "attack"].includes(this.previewMotion) &&
        this.previewShotTimer <= 0
      ) {
        const actor = this.previewVisual,
          id = actor.equipment.id;
        firePose(actor);
        this.previewShotTimer = LOADOUTS[id].interval;
        this.fx ||= new EffectPool(this.scene);
        this.previewMuzzle ||= new THREE.Vector3();
        actor.group.updateMatrixWorld(true);
        (id === "lumen" ? actor.equipment.weapon : actor.equipment.muzzle).getWorldPosition(this.previewMuzzle);
        const pellets = id === "gale" ? 0 : COMBAT_CLASSES[id].pellets;
        for (let i = 0; i < pellets; i++) {
          const angle =
            actor.group.rotation.y +
            (i - (pellets - 1) / 2) * COMBAT_CLASSES[id].spread;
          this.fx.tracer(
            this.previewMuzzle.x,
            this.previewMuzzle.z,
            Math.sin(angle),
            Math.cos(angle),
            4,
            LOADOUTS[id].tint,
            id,
            this.previewLevel || 1,
            this.previewMuzzle.y,
          );
        }
      }
      animateCharacter(
        this.previewVisual,
        !["idle","attack"].includes(this.previewMotion),
        dt,
        1,
        this.previewMotion === "strafe" ? "Run_Left" : "run",
        ["shoot","strafe","attack"].includes(this.previewMotion),
      );
    }

    this.playerRing.visible = !!this.run;
    this.aimLine.visible = !!this.run;
    if (this.run) {
      const p = this.playerPosition;
      this.playerRing.position.set(p.x, 0.09, p.z);
      this.playerRing.scale.setScalar(this.run.guard ? 1.4 : 1);
      let positions = this.aimLine.geometry.getAttribute("position");
      if (!positions) {
        positions = new THREE.BufferAttribute(new Float32Array(6), 3);
        this.aimLine.geometry.setAttribute("position", positions);
      }
      const length = Math.min(this.run.range, 10);
      positions.setXYZ(0, p.x, 0.15, p.z);
      positions.setXYZ(
        1,
        p.x + Math.sin(this.yaw) * length,
        0.15,
        p.z + Math.cos(this.yaw) * length,
      );
      positions.needsUpdate = true;
      // Constant two-vertex line distance; update without allocating a new buffer.
      let distances = this.aimLine.geometry.getAttribute("lineDistance");
      if (!distances) {
        distances = new THREE.BufferAttribute(new Float32Array([0, length]), 1);
        this.aimLine.geometry.setAttribute("lineDistance", distances);
      }
      distances.setX(1, length);
      distances.needsUpdate = true;
      this.aimLine.frustumCulled = false;
    }
    this.fx?.update(dt);
    this.performanceStats.effects = this.fx?.active || 0;
    this.performanceStats.droppedEffects = this.fx?.dropped || 0;
    this.dust.rotation.y += dt * 0.002;
    this.renderer.render(this.scene, this.camera);
    Object.assign(this.performanceStats, {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
    });
    this.uiTimer += dt;
    if (this.uiTimer > 0.12 && this.run?.phase === "playing") {
      this.uiTimer = 0;
      this.emit();
    }
    this.raf = requestAnimationFrame((next) => this.frame(next));
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.listeners.forEach((fn) => fn());
    this.resizeObserver.disconnect();
    if (document.pointerLockElement === this.renderer.domElement)
      document.exitPointerLock();
    this.disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.audio?.close().catch(() => {});
  }
}
