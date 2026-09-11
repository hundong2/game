import { AGENTS, UPGRADES } from "./content.js";
export function createRun(id = "viper") {
  const agent = AGENTS.find((a) => a.id === id) || AGENTS[0];
  return {
    agent,
    phase: "playing",
    hp: agent.hp,
    maxHp: agent.hp,
    damage: agent.damage,
    armor: agent.armor,
    range: agent.range,
    ammo: agent.magazine,
    magazine: agent.magazine,
    credits: 100,
    xp: 0,
    xpNext: 80,
    level: 1,
    wave: 1,
    kills: 0,
    score: 0,
    seconds: 0,
    ultimate: 100,
    ultimateLock: 0,
    shots: 0,
    charging: false,
    charge: 0,
    specialCooldown: 0,
    ultimateFx: 0,
    ultimateSequence: 0,
    frenzy: 0,
    ward: 0,
    selectedSkill: 0,
    cooldowns: [0, 0, 0],
    upgrades: { damage: 0, armor: 0, range: 0 },
    stamina: 100,
    rollTime: 0,
    rollCooldown: 0,
    rollX: 0,
    rollZ: 0,
    reload: 0,
    guard: false,
    remaining: 0,
    intermission: 0,
    message: "신호 확인. 격리 구역에 진입했습니다.",
  };
}
export function upgradeCost(run, id) {
  const def = UPGRADES.find((u) => u.id === id);
  return def ? Math.round(def.cost * (1 + run.upgrades[id] * 0.65)) : Infinity;
}
export function buyUpgrade(run, id) {
  const cost = upgradeCost(run, id);
  if (
    !["playing", "paused"].includes(run.phase) ||
    run.credits < cost ||
    run.upgrades[id] >= 8
  )
    return false;
  run.credits -= cost;
  run.upgrades[id]++;
  if (id === "damage") run.damage += 7;
  if (id === "armor") {
    run.armor += 5;
    run.hp = Math.min(run.maxHp, run.hp + 15);
  }
  if (id === "range") run.range += 5;
  run.message = `${UPGRADES.find((u) => u.id === id).name} 강화 완료`;
  return true;
}
export function rewardKill(run, enemy) {
  run.kills++;
  if (run.agent.id === "reaper") run.frenzy = Math.min(5, run.frenzy + 1);
  chargeUltimate(run, 7 + Math.floor((run.wave - 1) / 3) * 2);
  run.credits += enemy.reward;
  run.score += enemy.reward * 10;
  run.xp += enemy.xp;
  while (run.xp >= run.xpNext) {
    run.xp -= run.xpNext;
    run.level++;
    run.xpNext = Math.round(run.xpNext * 1.3);
    run.maxHp += 8;
    run.hp = Math.min(run.maxHp, run.hp + 25);
    run.damage += 2;
    run.message = `LEVEL ${run.level} · 공격력 +2 / 최대 체력 +8`;
  }
}
export function receiveDamage(run, raw) {
  if (run.phase !== "playing") return 0;
  const damage = Math.max(
    1,
    ((raw * 100) / (100 + run.armor)) * (run.guard ? 0.25 : 1),
  );
  const applied = run.ward > 0 ? damage * 0.4 : damage;
  run.hp = Math.max(0, run.hp - applied);
  if (run.hp <= 0) run.phase = "dead";
  return applied;
}
export function waveComposition(wave) {
  const result = Array.from({ length: 4 + wave * 2 }, (_, i) =>
    wave >= 2 && i % 3 === 0 ? "runner" : "walker",
  );
  if (wave % 3 === 0) result.push("brute");
  if (wave === 9) result.push("boss");
  return result;
}

// One charge costs 100. No overflow is banked above three charges.
export function chargeUltimate(run, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  run.ultimate = Math.min(300, run.ultimate + amount);
}
export function spendUltimate(run) {
  if (run.phase !== "playing" || run.ultimate < 100 || run.ultimateLock > 0)
    return false;
  run.ultimate -= 100;
  run.ultimateLock = 0.65;
  return true;
}
