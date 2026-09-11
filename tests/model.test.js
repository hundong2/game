import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AGENTS, ENEMIES } from "../app/game/content.js";
import {
  createRun,
  buyUpgrade,
  upgradeCost,
  rewardKill,
  receiveDamage,
  waveComposition,
} from "../app/game/model.js";
import { readProfile, localRanking } from "../app/game/storage.js";
import { GameEngine } from "../app/game/engine.js";

test("surface smoothing preserves geometry and skin attributes and reuses its cache", async()=>{
  const {softenSurface}=await import('../app/game/surface-art.js');
  const original=new THREE.BoxGeometry(1,2,1);
  original.setAttribute('skinWeight',new THREE.Float32BufferAttribute(new Float32Array(original.attributes.position.count*4).fill(.25),4));
  const smooth=softenSurface(original);
  assert.notEqual(smooth,original);assert.equal(softenSurface(original),smooth);
  assert.deepEqual(smooth.attributes.position.array,original.attributes.position.array);
  assert.deepEqual(smooth.attributes.skinWeight.array,original.attributes.skinWeight.array);
  assert.equal(smooth.index.count,original.index.count);
  assert.ok(Array.from(smooth.attributes.normal.array).every(Number.isFinite));
  assert.notDeepEqual(smooth.attributes.normal.array,original.attributes.normal.array);
});

// Real engine methods, deterministic clock, no WebGL renderer/browser required.
function fixture(agent = "viper") {
  const engine = Object.create(GameEngine.prototype);
  Object.assign(engine, {
    run: createRun(agent),
    scene: new THREE.Scene(),
    camera: new THREE.OrthographicCamera(-17, 17, 17, -17, 0.1, 130),
    playerPosition: new THREE.Vector3(0, 0, 10),
    aim: new THREE.Vector3(0, 0, -10),
    pointerActive: false,
    effects: [],
    weapon: new THREE.Group(),
    keys: new Set(),
    enemies: [],
    obstacles: [],
    yaw: Math.PI,
    pitch: 0,
    fireTimer: 0,
    flash: 0,
    hit: 0,
    onUpdate: () => {},
    tone: () => {},
    saved: false,
  });
  engine.scene.background = new THREE.Color();
  engine.scene.fog = new THREE.FogExp2();
  engine.camera.position.set(0, 1.7, 12);
  engine.scene.add(engine.camera);
  return engine;
}
globalThis.document = { pointerLockElement: null };
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => memory.get(k) || null,
  setItem: (k, v) => memory.set(k, v),
};
function advance(e, seconds) {
  for (let i = 0; i < Math.ceil(seconds / 0.02); i++) e.update(0.02);
}

test("nine classes start with independent traits and state", () => {
  assert.equal(AGENTS.length, 9);
  const a = createRun("bastion"),
    b = createRun("pulse");
  assert.equal(a.hp, 145);
  assert.equal(b.agent.heal, 55);
  a.upgrades.armor = 4;
  assert.equal(b.upgrades.armor, 0);
  assert.equal(createRun("unknown").agent.id, "viper");
});
test("upgrades are atomic, scale in price, cap at eight and reject invalid actions", () => {
  const r = createRun();
  assert.equal(buyUpgrade(r, "damage"), true);
  assert.equal(r.credits, 20);
  assert.equal(r.damage, 35);
  assert.equal(upgradeCost(r, "damage"), 132);
  const snapshot = JSON.stringify(r);
  assert.equal(buyUpgrade(r, "damage"), false);
  assert.equal(buyUpgrade(r, "bogus"), false);
  assert.equal(JSON.stringify(r), snapshot);
  r.credits = 100000;
  for (let i = 0; i < 10; i++) buyUpgrade(r, "damage");
  assert.equal(r.upgrades.damage, 8);
  r.phase = "dead";
  assert.equal(buyUpgrade(r, "armor"), false);
});
test("multi-level rewards preserve excess XP and heal within bounds", () => {
  const r = createRun();
  r.hp = 10;
  rewardKill(r, { xp: 500, reward: 25 });
  assert.ok(r.level > 2);
  assert.ok(r.xp < r.xpNext);
  assert.ok(r.hp <= r.maxHp);
  assert.equal(r.score, 250);
  assert.equal(r.kills, 1);
});
test("guard reduces damage by 75%, armor scales, death clamps to zero", () => {
  const a = createRun(),
    b = createRun();
  b.guard = true;
  assert.equal(receiveDamage(b, 40), receiveDamage(a, 40) * 0.25);
  a.phase = "paused";
  const hp = a.hp;
  receiveDamage(a, 1000);
  assert.equal(a.hp, hp);
  a.phase = "playing";
  receiveDamage(a, 10000);
  assert.equal(a.hp, 0);
  assert.equal(a.phase, "dead");
});
test("stage waves introduce runners, brutes and final boss only at intended wave", () => {
  assert.ok(waveComposition(2).includes("runner"));
  assert.ok(waveComposition(3).includes("brute"));
  assert.ok(!waveComposition(8).includes("boss"));
  assert.equal(waveComposition(9).filter((e) => e === "boss").length, 1);
});
test("storage recovers from corruption, unknown versions, invalid records and blocked access", () => {
  for (const v of [
    "{broken",
    "null",
    '{"version":2,"runs":[]}',
    '{"version":1,"runs":[{},null]}',
  ]) {
    const storage = { getItem: () => v };
    assert.deepEqual(readProfile(storage), { version: 1, runs: [] });
  }
  assert.deepEqual(
    readProfile({
      getItem: () => {
        throw Error("blocked");
      },
    }),
    { version: 1, runs: [] },
  );
});
test("movement is normalized, collision bounds enforced and pause freezes time", () => {
  const a = fixture(),
    b = fixture();
  a.keys.add("KeyW");
  b.keys.add("KeyW");
  b.keys.add("KeyD");
  advance(a, 0.5);
  advance(b, 0.5);
  assert.ok(
    Math.abs(
      a.playerPosition.distanceTo(new THREE.Vector3(0, 0, 10)) -
        b.playerPosition.distanceTo(new THREE.Vector3(0, 0, 10)),
    ) < 0.01,
  );
  advance(b, 20);
  assert.ok(b.playerPosition.x <= 21);
  assert.equal(b.yaw, Math.PI);
  assert.equal(b.run.ammo, 24);
  a.pause();
  const before = a.run.seconds;
  advance(a, 1);
  assert.equal(a.run.seconds, before);
  assert.equal(a.keys.size, 0);
});
test("hitscan kills, grants rewards, observes range and cover, reload restores ammo", () => {
  const e = fixture();
  e.spawn("walker", 0, -8);
  e.scene.updateMatrixWorld(true);
  e.shoot();
  e.fireTimer = 0;
  e.shoot();
  e.fireTimer = 0;
  e.shoot();
  assert.equal(e.enemies.length, 0);
  assert.equal(e.run.kills, 1);
  assert.equal(e.run.ammo, 21);
  e.reload();
  advance(e, 1.7);
  assert.equal(e.run.ammo, 24);
  e.clearEnemies();
  e.spawn("walker", 0, -40);
  e.fireTimer = 0;
  e.shoot();
  assert.equal(e.enemies[0].hp, ENEMIES.walker.hp);
  e.clearEnemies();
  e.spawn("walker", 0, -2);
  const cover = e.box(3, 4, 1, 0, 0, 2, 3);
  e.obstacles.push({ x: 0, z: 3, w: 1.5, d: 0.5, mesh: cover });
  e.fireTimer = 0;
  e.shoot();
  assert.equal(e.enemies[0].hp, 65);
  e.clearEnemies();
});
test("skill cooldowns, medic healing and freeze affect real enemy simulation", () => {
  const e = fixture("pulse");
  e.run.hp = 20;
  e.selectSkill(1);
  e.skill();
  assert.equal(e.run.hp, 75);
  const cooldown = e.run.cooldowns[1];
  e.skill();
  assert.equal(e.run.hp, 75);
  assert.equal(cooldown, 22 * 0.72);
  e.spawn("walker", 0, 4);
  e.selectSkill(2);
  e.skill();
  assert.equal(e.enemies[0].slow, 6);
  e.selectSkill(0);
  e.skill();
  assert.equal(e.enemies.length, 0);
  e.clearEnemies();
});
test("full nine-wave lifecycle reaches victory and saves exactly once", () => {
  const e = fixture();
  e.spawnWave();
  assert.ok(e.enemies.every((z) => z.group.position.z < 0));
  for (let wave = 1; wave <= 9; wave++) {
    assert.equal(e.run.wave, wave);
    for (const enemy of e.enemies) e.damageEnemy(enemy, 100000);
    e.update(0.02);
    if (wave < 9) {
      assert.equal(e.run.intermission, 7);
      advance(e, 7.04);
      assert.ok(e.enemies.length > 0);
    }
  }
  assert.equal(e.run.phase, "won");
  const count = localRanking.list().length;
  advance(e, 1);
  assert.equal(localRanking.list().length, count);
  assert.ok(localRanking.list()[0].score >= 3000);
});
test("enemy melee produces death, result is saved, next run has fresh resources", () => {
  const e = fixture();
  e.run.hp = 1;
  e.spawn("walker", 0, 10.2);
  e.enemies[0].cooldown = 0;
  e.update(0.02);
  assert.equal(e.run.phase, "dead");
  assert.equal(e.saved, true);
  const r = createRun();
  assert.equal(r.kills, 0);
  assert.equal(r.ammo, r.magazine);
  assert.equal(r.credits, 100);
});

test("WASD cardinal directions move independently of facing without consuming ammo", () => {
  for (const [key, axis, sign] of [
    ["KeyW", "z", -1],
    ["KeyS", "z", 1],
    ["KeyA", "x", -1],
    ["KeyD", "x", 1],
  ]) {
    const e = fixture();
    e.yaw = 0.71;
    const before = e.playerPosition.clone();
    e.keys.add(key);
    advance(e, 0.2);
    assert.ok((e.playerPosition[axis] - before[axis]) * sign > 0);
    assert.equal(e.yaw, 0.71);
    assert.equal(e.run.ammo, 24);
    assert.equal(e.run.guard, false);
  }
});
test("mouse projection supports every quadrant and preserves aim direction while moving", () => {
  const e = fixture();
  e.pointer = new THREE.Vector2();
  e.pointerActive = true;
  e.followCamera();
  for (const [x, y] of [
    [0.5, 0.5],
    [-0.5, 0.5],
    [0.5, -0.5],
    [-0.5, -0.5],
  ]) {
    e.pointer.set(x, y);
    e.updateAim();
    assert.equal(Math.sign(e.aim.x - e.playerPosition.x), Math.sign(x));
    assert.equal(Math.sign(e.aim.z - e.playerPosition.z), -Math.sign(y));
  }
  const yaw = e.yaw;
  e.keys.add("KeyW");
  advance(e, 0.3);
  assert.ok(Math.abs(e.yaw - yaw) < 0.00001);
});
test("shipped skinned GLB stays human-sized and grounded across animation poses", async () => {
  const { readFile } = await import("node:fs/promises");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { makeCharacter, animateCharacter } =
    await import("../app/game/characters.js");
  const bytes = await readFile(
    new URL("../public/models/survivor.glb", import.meta.url),
  );
  const rig = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  assert.ok(rig.animations.some((c) => c.name === "idle"));
  assert.ok(rig.animations.some((c) => c.name === "run"));
  const actor = makeCharacter(
    { rig, textures: { female: null } },
    "female",
    0xc2ed65,
  );
  for (const moving of [false, true]) {
    animateCharacter(actor, moving, 0.2);
    actor.group.updateMatrixWorld(true);
    let meshes = 0;
    actor.model.traverse((o) => {
      if (o.isSkinnedMesh) {
        meshes++;
        o.skeleton.update();
        o.computeBoundingBox();
        const box = o.boundingBox.clone().applyMatrix4(o.matrixWorld);
        assert.ok(box.getSize(new THREE.Vector3()).y > 2);
        assert.ok(box.max.y < 3);
        assert.ok(Math.abs(box.min.y) < 0.4);
      }
    });
    assert.ok(meshes > 0);
  }
});

test("ultimate meter caps at three, spends once, rejects pause and empty, and restarts clean", async () => {
  const { chargeUltimate, spendUltimate } =
    await import("../app/game/model.js");
  const r = createRun();
  assert.equal(r.ultimate, 100);
  chargeUltimate(r, 999);
  assert.equal(r.ultimate, 300);
  for (let i = 0; i < 3; i++) {
    r.ultimateLock = 0;
    assert.equal(spendUltimate(r), true);
    assert.equal(spendUltimate(r), false);
  }
  r.ultimateLock = 0;
  assert.equal(spendUltimate(r), false);
  chargeUltimate(r, 100);
  r.phase = "paused";
  assert.equal(spendUltimate(r), false);
  assert.equal(createRun().ultimate, 100);
});
test("all four ultimates have distinct effects and later waves award more charge", () => {
  for (const id of ["viper", "bastion", "pulse", "reaper"]) {
    const e = fixture(id);
    e.run.hp = 20;
    e.spawn("walker", 0, 3);
    assert.equal(e.ultimate(), true);
    assert.equal(e.enemies.length, 0);
    assert.equal(e.run.ultimate, 7);
    assert.equal(e.ultimate(), false);
    if (id === "pulse") assert.ok(e.run.hp > 20);
  }
  const a = createRun(),
    b = createRun();
  a.ultimate = 0;
  b.ultimate = 0;
  b.wave = 7;
  rewardKill(a, ENEMIES.walker);
  rewardKill(b, ENEMIES.walker);
  assert.ok(b.ultimate > a.ultimate);
  const e = fixture();
  e.run.ultimate = 0;
  e.update(0.02);
  assert.equal(e.run.ultimate, 45);
  e.update(0.02);
  assert.equal(e.run.ultimate, 45);
});
test("operator fire cadence differs and scenery batching retains cover raycasts", async () => {
  const { LOADOUTS } = await import("../app/game/operators.js");
  assert.equal(new Set(Object.values(LOADOUTS).map((o) => o.interval)).size, 9);
  const { batchScenery } = await import("../app/game/performance.js");
  const e = fixture();
  e.spawn("walker", 0, -2);
  const cover = e.box(3, 4, 1, 0, 0, 2, 3);
  e.obstacles.push({ x: 0, z: 3, w: 1.5, d: 0.5, mesh: cover });
  // Batch only static scenery, mirroring construction before actors spawn.
  e.scene.remove(e.enemies[0].group);
  batchScenery(e);
  e.scene.add(e.enemies[0].group);
  e.shoot();
  assert.equal(e.enemies[0].hp, 65);
});

test("four native operator assets contain directional and shooting clips with weapons attached to hands", async () => {
  const { readFile } = await import("node:fs/promises");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  const { makeCharacter, animateCharacter } =
    await import("../app/game/characters.js");
  const signatures = [];
  for (const id of ["viper", "bastion", "pulse", "reaper"]) {
    const bytes = await readFile(
      new URL(`../public/models/${id}.glb`, import.meta.url),
    );
    const rig = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    for (const clip of [
      "Run_Back",
      "Run_Left",
      "Run_Right",
      "Run_Shoot",
      "Idle_Gun_Shoot",
    ])
      assert.ok(rig.animations.some((a) => a.name === clip));
    const a = makeCharacter(
      { operators: { [id]: rig }, textures: {} },
      "female",
      0xffffff,
      false,
      id,
    );
    assert.equal(a.native, true);
    assert.ok(a.wrist);
    for (const direction of ["run", "Run_Back", "Run_Left", "Run_Right"]) {
      animateCharacter(a, true, 0.08, 1, direction);
      assert.equal(a.mode, direction);
    }
    animateCharacter(a, true, 0.08, 1, "run", true);
    assert.equal(a.mode, "run");
    animateCharacter(a, true, .08, 1, "Run_Left", true);
    assert.equal(a.mode, "Run_Left");
    if (a.model.getObjectByName("Pistol")) assert.equal(a.model.getObjectByName("Pistol").visible, false);
    a.group.updateMatrixWorld(true);
    const wrist = a.wrist.getWorldPosition(new THREE.Vector3());
    const gun = a.equipment.weapon.getWorldPosition(new THREE.Vector3());
    assert.ok(wrist.distanceTo(gun) < 0.2);
    const size = new THREE.Box3()
      .setFromObject(a.model)
      .getSize(new THREE.Vector3());
    assert.ok(size.y > 2 && size.y < 3.1);
    signatures.push(bytes.byteLength);
  }
  assert.equal(new Set(signatures).size, 4);
});
test("static and hidden frames do not render or advance simulation", () => {
  const e = fixture();
  e.performanceStats = { frameMs: 16 };
  e.last = 0;
  e.run.phase = "paused";
  e.needsRender = false;
  e.update = () => assert.fail("Static frame advanced");
  const old = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  try {
    e.frame(16);
    document.hidden = true;
    e.run.phase = "playing";
    e.frame(32);
  } finally {
    document.hidden = false;
    globalThis.requestAnimationFrame = old;
  }
});

test("sniper pierces three targets but stops at cover, archer applies poison", () => {
  const s = fixture("sniper");
  for (const z of [-10, -12, -14, -16]) s.spawn("walker", 0, z);
  s.shoot();
  assert.equal(s.run.kills, 3);
  assert.equal(s.enemies.length, 1);
  const c = fixture("sniper");
  c.spawn("walker", 0, -10);
  c.obstacles.push({ x: 0, z: 0, w: 2, d: 1 });
  c.shoot();
  assert.equal(c.run.kills, 0);
  const a = fixture("archer");
  a.spawn("brute", 0, -2);
  a.shoot();
  assert.equal(a.enemies[0].poison, 3);
  const hp = a.enemies[0].hp;
  a.update(0.5);
  assert.ok(a.enemies[0].hp < hp);
});
test("shotgun spreads, medic heals on hit, class skills and new ultimates work", () => {
  const s = fixture("bastion");
  s.spawn("brute", 0, 6);
  s.shoot();
  assert.ok(s.enemies[0].hp < ENEMIES.brute.hp - 25);
  const m = fixture("pulse");
  m.run.hp = 30;
  m.spawn("brute", 0, 4);
  m.shoot();
  assert.equal(m.run.hp, 32);
  const a = fixture("archer");
  a.spawn("brute", 0, 0);
  a.skill();
  assert.ok(a.run.cooldowns[0] > 0);
  assert.ok(a.enemies[0].hp < ENEMIES.brute.hp);
  const b = fixture("bastion");
  b.skill();
  assert.equal(b.run.ward, 6);
  for (const id of ["archer", "sniper"]) {
    const e = fixture(id);
    e.spawn("walker", 0, 0);
    assert.equal(e.ultimate(), true);
    assert.equal(e.run.kills, 1);
  }
});
test("fixed clock preserves one second of simulation across render frequencies", async () => {
  const { SimulationClock } = await import("../app/game/combat.js");
  for (const hz of [30, 60, 144]) {
    const clock = new SimulationClock();
    let seconds = 0;
    for (let i = 0; i < hz; i++) clock.advance(1 / hz, (dt) => (seconds += dt));
    assert.ok(Math.abs(seconds - 1) < 1e-6);
  }
  const clock = new SimulationClock();
  let steps = 0;
  clock.advance(5, () => steps++);
  assert.equal(steps, 6);
  assert.ok(clock.droppedSeconds > 4);
});
test("effect pool stays bounded through 10000 emissions and resets on restart", async () => {
  const { EffectPool } = await import("../app/game/effects.js");
  const scene = new THREE.Scene(),
    pool = new EffectPool(scene, 64);
  const p = new THREE.Vector3();
  for (let i = 0; i < 10000; i++) {
    pool.burst(p, 0xff0000);
    pool.tracer(0, 0, 0, 1, 10, 0xffffff);
    if (i % 10 === 0) pool.update(0.02);
  }
  assert.equal(scene.children.length, 64);
  assert.ok(pool.active <= 64);
  assert.ok(pool.dropped > 0);
  pool.clear();
  assert.equal(pool.active, 0);
});

test("class projectile shapes travel, sniper beam persists, and pooled reuse resets", async () => {
  const { EffectPool } = await import("../app/game/effects.js");
  const pool = new EffectPool(new THREE.Scene());
  const shapes = [];
  for (const id of [
    "viper",
    "bastion",
    "pulse",
    "reaper",
    "archer",
    "sniper",
  ]) {
    pool.clear();
    pool.tracer(0, 0, 0, 1, 20, 0xffffff, id);
    const slot = pool.slots.find((s) => s.life > 0);
    const before = slot.mesh.geometry.attributes.position.getZ(1);
    pool.update(0.05);
    const after = slot.mesh.geometry.attributes.position.getZ(1);
    assert.ok(id === "sniper" ? after === before : after > before);
    shapes.push(
      Array.from(slot.mesh.geometry.attributes.position.array).join(","),
    );
    pool.update(1);
    assert.equal(pool.active, 0);
  }
  assert.ok(new Set(shapes).size >= 5);
});

test("roll uses movement direction, normalizes diagonals, locks input and respects walls", () => {
  for (const keys of [["ArrowRight"], ["KeyD", "KeyW"]]) {
    const e = fixture();
    keys.forEach((k) => e.keys.add(k));
    const start = e.playerPosition.clone();
    assert.equal(e.roll(), true);
    assert.equal(e.run.stamina, 72);
    assert.equal(e.roll(), false);
    const ammo = e.run.ammo;
    e.shoot();
    assert.equal(e.run.ammo, ammo);
    e.keys.clear();
    advance(e, 0.44);
    assert.ok(Math.abs(e.playerPosition.distanceTo(start) - 5.72) < 0.01);
    assert.ok(e.playerPosition.x > 0);
    assert.equal(e.run.rollTime, 0);
    e.run.phase = "paused";
    const cooldown = e.run.rollCooldown;
    advance(e, 1);
    assert.equal(e.run.rollCooldown, cooldown);
    assert.equal(e.roll(), false);
  }
  const wall = fixture();
  wall.keys.add("ArrowRight");
  wall.obstacles = [{ x: 2, z: 10, w: 0.2, d: 3 }];
  wall.roll();
  advance(wall, 0.44);
  assert.ok(wall.playerPosition.x < 1.5);
  const tired = fixture();
  tired.run.stamina = 27;
  assert.equal(tired.roll(), false);
  const stationary = fixture();
  stationary.yaw = 0;
  stationary.roll();
  assert.equal(stationary.run.rollZ, 1);
});

test("level effects upgrade without increasing pool geometry and reset on reuse", async () => {
  const { EffectPool } = await import("../app/game/effects.js");
  const pool = new EffectPool(new THREE.Scene());
  for (const id of AGENTS.map((a) => a.id)) {
    const variants = [];
    for (const level of [1, 5, 9]) {
      pool.clear();
      pool.tracer(0, 0, 0, 1, 20, 0xffffff, id, level);
      pool.update(0.04);
      const slot = pool.slots.find((s) => s.life > 0);
      assert.equal(slot.mesh.geometry.attributes.position.count, 24);
      variants.push(
        Array.from(slot.mesh.geometry.attributes.position.array).join(","),
      );
    }
    assert.equal(new Set(variants).size, 3);
  }
  assert.equal(pool.slots.length, 64);
});

test("MOBA motion profiles recover, blend angles by shortest path and never accumulate pose offsets", async () => {
  const {
    MOTION_PROFILES,
    dampAngle,
    shotEnvelope,
    createMotion,
    restoreMotion,
    applyMotion,
  } = await import("../app/game/motion.js");
  assert.equal(Object.keys(MOTION_PROFILES).length, 9);
  assert.equal(shotEnvelope(1, 0.4), 0);
  assert.ok(shotEnvelope(0.08, 0.4) > shotEnvelope(0.3, 0.4));
  const angle = dampAngle(Math.PI - 0.01, -Math.PI + 0.01, 0.016);
  assert.ok(Math.abs(angle - (Math.PI - 0.01)) < 0.02);
  const model = new THREE.Group(),
    chest = new THREE.Bone();
  chest.name = "Chest";
  model.add(chest);
  const actor = { motion: createMotion(model, "pulse"), mixer: { time: 0 } };
  actor.motion.age = 0;
  for (let i = 0; i < 600; i++) {
    restoreMotion(actor);
    actor.mixer.time += 1 / 60;
    applyMotion(actor, false, 1 / 60, "idle");
  }
  assert.ok(Math.abs(chest.rotation.x) < 1e-8);
  assert.ok(Math.abs(chest.rotation.y) < 1e-8);
  applyMotion(actor, true, 0.1, "Run_Left");
  assert.ok(chest.rotation.z > 0);
  restoreMotion(actor);
  assert.ok(Math.abs(chest.rotation.z) < 1e-8);
});


test("left click tap fires once, hold-release fires one class special and cooldown blocks repeat", () => {
  for(const id of AGENTS.map(a=>a.id)) {
    const e=fixture(id), ammo=e.run.ammo;
    e.beginCharge(); advance(e,.1); assert.equal(e.releaseCharge(),false);
    assert.equal(e.run.ammo,ammo-1);
    advance(e,1); e.beginCharge(); advance(e,.82);
    assert.equal(e.run.charge,.8); assert.equal(e.releaseCharge(),true);
    assert.equal(e.run.ammo,ammo-4); assert.equal(e.run.specialCooldown,2.5);
    assert.equal(e.releaseCharge(),false);
    assert.equal(e.run.charging,false);
  }
});
test("charge cancels on pause and roll; insufficient ammo never spends special resources", () => {
  const e=fixture(); e.beginCharge(); advance(e,1); e.pause();
  assert.equal(e.run.charging,false); assert.equal(e.releaseCharge(),false);
  e.run.phase="playing"; e.run.ammo=1; e.beginCharge(); advance(e,1);
  assert.equal(e.releaseCharge(),false); assert.equal(e.run.ammo,0);
  e.run.ammo=24; e.run.reload=0; e.beginCharge(); advance(e,1); e.roll();
  assert.equal(e.run.charging,false);
});
test("ultimate patterns are class-specific, bounded and expire", async () => {
 const {EffectPool}=await import("../app/game/effects.js");
 const pool=new EffectPool(new THREE.Scene());
 const expected={viper:5,bastion:3,pulse:3,reaper:16,archer:16,sniper:1,gale:3,lumen:8,nova:3};
 for(const id of AGENTS.map(a=>a.id)) {pool.clear();pool.ultimate(new THREE.Vector3(),0,id,0xffffff,32);assert.equal(pool.active,expected[id]);pool.update(4);assert.equal(pool.active,0);}
});
test("blade hits only the forward sector, third hit is stronger, cover blocks it", async () => {
 const {slashAttack}=await import("../app/game/archetypes.js");
 const e=fixture("gale");e.spawn("brute",0,7);e.spawn("brute",0,13);e.spawn("brute",0,0);
 const [front,back,far]=e.enemies;e.run.shots=1;slashAttack(e);assert.equal(front.hp,front.maxHp-54);assert.equal(back.hp,back.maxHp);assert.equal(far.hp,far.maxHp);
 e.run.shots=3;slashAttack(e);assert.ok(front.hp<front.maxHp-54*2);
 const covered=fixture("gale");covered.spawn("brute",0,7);covered.obstacles=[{x:0,z:8.5,w:2,d:.2}];slashAttack(covered);assert.equal(covered.enemies[0].hp,covered.enemies[0].maxHp);
});
test("prism is a real returning projectile with at most one hit per pass", async () => {
 const {launchOrb,updateOrbs}=await import("../app/game/archetypes.js");
 const e=fixture("lumen");e.spawn("brute",0,5);const enemy=e.enemies[0];launchOrb(e,Math.PI);
 assert.equal(enemy.hp,enemy.maxHp);
 for(let i=0;i<60;i++)updateOrbs(e,.02);
 assert.equal(enemy.hp,enemy.maxHp-e.run.damage*2);assert.equal(e.run.orbs.length,0);
 for(let i=0;i<100;i++)launchOrb(e,Math.PI);assert.equal(e.run.orbs.length,24);
 const covered=fixture("lumen");covered.spawn("brute",0,5);covered.obstacles=[{x:0,z:7,w:2,d:.3}];launchOrb(covered,Math.PI);for(let i=0;i<60;i++)updateOrbs(covered,.02);assert.equal(covered.enemies[0].hp,covered.enemies[0].maxHp);
});
test("three new ultimates execute different mechanics and spend exactly one charge", () => {
 for(const id of ["gale","lumen","nova"]) {
  const e=fixture(id);e.spawn("brute",0,8);e.run.ultimate=300;e.ultimate();
  assert.ok(e.run.ultimate>=200 && e.run.ultimate<220);
  if(id==="gale")assert.equal(e.run.ward,4);
  if(id==="lumen")assert.equal(e.run.orbs.length,8);
  if(id==="nova")assert.equal(e.run.kills,1);
 }
});


test("new classes have visible distinct equipment and stable animated rigs", async () => {
 const {readFile}=await import("node:fs/promises");
 const {GLTFLoader}=await import("three/addons/loaders/GLTFLoader.js");
 const {makeCharacter,animateCharacter}=await import("../app/game/characters.js");
 const {firePose}=await import("../app/game/operators.js");
 for(const [id,base] of [["gale","bastion"],["lumen","pulse"],["nova","reaper"]]) {
  const bytes=await readFile(new URL(`../public/models/${base}.glb`,import.meta.url));
  const rig=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),"");
  const actor=makeCharacter({operators:{[base]:rig},textures:{}},"female",0xffffff,false,id);
  assert.ok(actor.native && actor.equipment.custom);
  for(let i=0;i<180;i++){if(i%30===0)firePose(actor);animateCharacter(actor,true,1/60,1,"Run_Left",true);}
  const size=new THREE.Box3().setFromObject(actor.group).getSize(new THREE.Vector3());
  assert.ok(Number.isFinite(size.y) && size.y>2 && size.y<4);
  assert.ok(actor.equipment.weapon.children.some(child=>child.visible));
  assert.equal(actor.equipment.id,id);
 }
});


test("custom action timeline recovers and the blade ribbon reuses a finite buffer", async () => {
 const {actionPose,createBladeTrail,updateBladeTrail}=await import("../app/game/action-art.js");
 for(const id of ["gale","lumen","nova"]) { assert.equal(actionPose(id,1,.4).active,false);assert.equal(actionPose(id,1,.4).strength,0); }
 assert.ok(actionPose("gale",.15,.4,1).swing*actionPose("gale",.15,.4,2).swing<0);
 const group=new THREE.Group(),weapon=new THREE.Group();group.add(weapon);
 const trail=createBladeTrail(group,0xffffff), actor={group,equipment:{weapon,trail}};
 const buffer=trail.mesh.geometry.attributes.position;
 for(let i=0;i<500;i++){weapon.rotation.y=i*.1;updateBladeTrail(actor,true);}
 assert.equal(trail.mesh.geometry.attributes.position,buffer);assert.equal(buffer.count,72);
 assert.ok(Array.from(buffer.array).every(Number.isFinite));
 updateBladeTrail(actor,false);assert.equal(trail.mesh.visible,false);assert.equal(trail.valid,0);
});

test("class mobility keeps collision rules, warrior follows aim, all poses recover", async()=>{
 const {MOBILITY,mobilityPose}=await import("../app/game/mobility.js");
 for(const id of AGENTS.map(a=>a.id)) {
  const e=fixture(id);e.yaw=Math.PI/2;e.keys.add("KeyW");const before=e.playerPosition.clone();
  assert.equal(e.roll(),true);assert.equal(e.roll(),false);
  assert.equal(e.run.stamina,100-MOBILITY[id].cost);
  if(id==="gale") {assert.ok(e.run.rollX>.99);assert.ok(Math.abs(e.run.rollZ)<.01);}
  else assert.equal(e.run.rollZ,-1);
  advance(e,MOBILITY[id].duration+.05);
  assert.ok(e.playerPosition.distanceTo(before)>3);
  const pose=mobilityPose(id,0);assert.equal(pose.lean,0);assert.equal(pose.lift,0);assert.equal(pose.phaseScale,1);
  e.run.stamina=0;e.run.rollCooldown=0;assert.equal(e.roll(),false);
  const wall=fixture(id);wall.yaw=Math.PI/2;wall.obstacles=[{x:2,z:10,w:.2,d:3}];
  wall.roll();advance(wall,.7);assert.ok(wall.playerPosition.x<1.6,`${id} crossed cover`);
 }
});
