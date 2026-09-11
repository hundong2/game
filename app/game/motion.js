// Original motion profiles inspired by readable MOBA combat, independent of damage rules.
export const MOTION_PROFILES = {
  gale: {
    name: "회전 검무",
    response: 20,
    lean: 0.18,
    twist: 0.7,
    kick: 0.08,
    recovery: 0.38,
  },
  lumen: {
    name: "프리즘 시전",
    response: 14,
    lean: 0.08,
    twist: 0.38,
    kick: 0.16,
    recovery: 0.6,
  },
  nova: {
    name: "건틀릿 펀치",
    response: 22,
    lean: 0.14,
    twist: 0.3,
    kick: 0.3,
    recovery: 0.3,
  },
  viper: {
    name: "기동 사수",
    response: 18,
    lean: 0.13,
    twist: 0.14,
    kick: 0.08,
    recovery: 0.22,
  },
  bastion: {
    name: "중장 포격",
    response: 9,
    lean: 0.08,
    twist: 0.06,
    kick: 0.24,
    recovery: 0.42,
  },
  pulse: {
    name: "유영 시전자",
    response: 12,
    lean: 0.07,
    twist: 0.32,
    kick: 0.16,
    recovery: 0.38,
  },
  reaper: {
    name: "속사 추격",
    response: 22,
    lean: 0.16,
    twist: 0.12,
    kick: 0.1,
    recovery: 0.16,
  },
  archer: {
    name: "유연한 사냥꾼",
    response: 15,
    lean: 0.12,
    twist: 0.28,
    kick: 0.12,
    recovery: 0.52,
  },
  sniper: {
    name: "정밀 조준",
    response: 11,
    lean: 0.055,
    twist: 0.1,
    kick: 0.25,
    recovery: 0.65,
  },
};
export function dampAngle(current, target, dt, response = 20) {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  return current + delta * (1 - Math.exp(-response * Math.max(0, dt)));
}
export function shotEnvelope(age, duration) {
  if (age < 0 || age >= duration) return 0;
  const t = age / duration;
  return t < 0.18
    ? Math.sin(((t / 0.18) * Math.PI) / 2)
    : Math.pow(1 - (t - 0.18) / 0.82, 2);
}
export function createMotion(model, id) {
  return {
    profile: MOTION_PROFILES[id] || MOTION_PROFILES.viper,
    speed: 0,
    side: 0,
    age: 10,
    bones: ["Chest", "Torso", "ShoulderR"]
      .map((name) => model.getObjectByName(name))
      .filter(Boolean)
      .map((bone) => ({ bone, rotation: bone.rotation.clone() })),
  };
}
export function restoreMotion(actor) {
  for (const entry of actor.motion?.bones || [])
    entry.bone.rotation.copy(entry.rotation);
}
export function applyMotion(actor, moving, dt, direction) {
  const motion = actor.motion;
  if (!motion) return;
  const p = motion.profile,
    blend = 1 - Math.exp(-p.response * dt);
  motion.speed += ((moving ? 1 : 0) - motion.speed) * blend;
  const side =
    direction === "Run_Left" ? -1 : direction === "Run_Right" ? 1 : 0;
  motion.side += (side - motion.side) * blend;
  motion.age += dt;
  const shot = shotEnvelope(motion.age, p.recovery);
  for (const entry of motion.bones) {
    entry.rotation.copy(entry.bone.rotation);
    if (entry.bone.name === "Chest") {
      entry.bone.rotation.x += motion.speed * p.lean - shot * p.kick;
      entry.bone.rotation.y += shot * p.twist;
      entry.bone.rotation.z -= motion.side * p.lean;
    } else if (entry.bone.name === "Torso") {
      entry.bone.rotation.z +=
        Math.sin(actor.mixer.time * 7) * motion.speed * p.lean * 0.25;
    } else entry.bone.rotation.x -= shot * p.kick * 0.6;
  }
}
