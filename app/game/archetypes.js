import { COMBAT_CLASSES, traceShot } from "./combat.js";
import { LOADOUTS } from "./operators.js";
import { EffectPool } from "./effects.js";
export function slashAttack(
  engine,
  multiplier = 1,
  fullCircle = false,
  silentVisual = false,
) {
  const r = engine.run,
    p = engine.playerPosition,
    range = fullCircle ? 7 : r.range,
    width = fullCircle ? Math.PI : 0.95;
  const combo = r.shots % 3 === 0 ? 1.7 : 1;
  for (const enemy of engine.enemies.slice()) {
    const x = enemy.group.position.x - p.x,
      z = enemy.group.position.z - p.z;
    const angle = Math.atan2(
      Math.sin(Math.atan2(x, z) - engine.yaw),
      Math.cos(Math.atan2(x, z) - engine.yaw),
    );
    if (Math.hypot(x, z) > range || Math.abs(angle) > width) continue;
    const sight = traceShot(
      p.x,
      p.z,
      Math.atan2(x, z),
      Math.hypot(x, z),
      [],
      engine.obstacles,
      1,
    );
    if (sight.distance + 0.01 < Math.hypot(x, z)) continue;
    engine.damageEnemy(enemy, r.damage * multiplier * combo);
    engine.fx ||= new EffectPool(engine.scene);
    engine.fx.impact(enemy.group.position, LOADOUTS.gale.tint);
  }
  if (silentVisual || !fullCircle) return;
  engine.fx ||= new EffectPool(engine.scene);
  engine.fx.slash(p, engine.yaw, range, LOADOUTS.gale.tint, fullCircle);
}
export function launchOrb(engine, angle, multiplier = 1) {
  const r = engine.run,
    p = engine.playerPosition;
  r.orbs ||= [];
  if (r.orbs.length >= 24) return;
  const distance = traceShot(
    p.x,
    p.z,
    angle,
    r.range,
    [],
    engine.obstacles,
    1,
  ).distance;
  r.orbs.push({
    x: p.x,
    z: p.z,
    dx: Math.sin(angle),
    dz: Math.cos(angle),
    distance,
    age: 0,
    previous: 0,
    damage: r.damage * multiplier,
    out: new Set(),
    back: new Set(),
  });
  engine.fx ||= new EffectPool(engine.scene);
  engine.fx.tracer(
    p.x,
    p.z,
    Math.sin(angle),
    Math.cos(angle),
    distance,
    LOADOUTS.lumen.tint,
    "lumen",
    r.level,
  );
}
export function updateOrbs(engine, dt) {
  const r = engine.run;
  if (!r.orbs?.length) return;
  for (const orb of r.orbs) {
    const previous = orb.age;
    orb.age = Math.min(1.2, orb.age + dt);
    // Split at the turnaround so no target is skipped on a coarse update.
    const points = previous < 0.6 && orb.age > 0.6 ? [0.6, orb.age] : [orb.age];
    for (const end of points) {
      const at = (t) => orb.distance * (t <= 0.6 ? t / 0.6 : 2 - t / 0.6);
      const a = at(orb.previous),
        b = at(end),
        sign = b >= a ? 1 : -1;
      const hits = traceShot(
        orb.x + orb.dx * a,
        orb.z + orb.dz * a,
        Math.atan2(orb.dx * sign, orb.dz * sign),
        Math.abs(b - a),
        engine.enemies,
        engine.obstacles,
        128,
      ).hits;
      const seen = end <= 0.6 ? orb.out : orb.back;
      for (const { enemy } of hits)
        if (!seen.has(enemy)) {
          seen.add(enemy);
          engine.damageEnemy(enemy, orb.damage);
          engine.fx.impact(enemy.group.position, LOADOUTS.lumen.tint);
        }
      orb.previous = end;
    }
  }
  r.orbs = r.orbs.filter((orb) => orb.age < 1.2);
}
export function archetypeAttack(engine, charged = false) {
  const id = engine.run.agent.id;
  if (id === "gale") {
    slashAttack(engine, charged ? 2 : 1, charged);
    return true;
  }
  if (id === "lumen") {
    for (const offset of charged ? [-0.3, 0, 0.3] : [0])
      launchOrb(engine, engine.yaw + offset, charged ? 1.4 : 1);
    return true;
  }
  return false;
}
export function archetypeUltimate(engine) {
  const r = engine.run,
    id = r.agent.id;
  if (id === "gale") {
    slashAttack(engine, 4, true, true);
    r.ward = 4;
    return true;
  }
  if (id === "lumen") {
    for (let i = 0; i < 8; i++) launchOrb(engine, (i * Math.PI) / 4, 2);
    r.hp = Math.min(r.maxHp, r.hp + 40);
    return true;
  }
  if (id === "nova") {
    for (let i = -1; i <= 1; i++)
      engine.fireRay(
        engine.yaw + i * 0.06,
        { ...COMBAT_CLASSES.nova, pierce: 12 },
        4,
      );
    return true;
  }
  return false;
}
