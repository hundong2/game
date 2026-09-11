// Data-only class contract. Add a class without changing input or render ownership.
export const COMBAT_CLASSES = {
  gale: {
    kind: "blade",
    pellets: 1,
    pierce: 8,
    multiplier: 1,
    spread: 0,
    passive: "3타마다 넓은 강화 베기",
    skill: "자력 장갑",
    icon: "✦",
  },
  lumen: {
    kind: "orb",
    pellets: 1,
    pierce: 8,
    multiplier: 1,
    spread: 0,
    passive: "프리즘 왕복 각각 1회 명중",
    skill: "빛의 회복",
    icon: "◈",
  },
  nova: {
    kind: "gauntlet",
    pellets: 1,
    pierce: 2,
    multiplier: 1,
    spread: 0,
    passive: "관통 에너지탄",
    skill: "중력 과충전",
    icon: "ϟ",
  },
  viper: {
    kind: "rifle",
    pellets: 1,
    pierce: 1,
    multiplier: 1,
    spread: 0,
    passive: "네 번째 탄환 강화",
    skill: "충격파",
    icon: "◎",
  },
  bastion: {
    kind: "shotgun",
    pellets: 5,
    pierce: 1,
    multiplier: 0.48,
    spread: 0.095,
    passive: "근거리 5발 산탄",
    skill: "철벽 진형",
    icon: "◇",
  },
  pulse: {
    kind: "pulse",
    pellets: 1,
    pierce: 1,
    multiplier: 1,
    spread: 0,
    passive: "명중 시 체력 2 회복",
    skill: "회복 파동",
    icon: "✚",
  },
  reaper: {
    kind: "rifle",
    pellets: 3,
    pierce: 1,
    multiplier: 0.5,
    spread: 0.018,
    passive: "3연발 탄군 · 처치 연속 시 공격력 상승",
    skill: "과충전 탄창",
    icon: "≋",
  },
  archer: {
    kind: "bow",
    pellets: 1,
    pierce: 2,
    multiplier: 1,
    spread: 0,
    passive: "독화살 · 3초 지속 피해",
    skill: "다중 사격",
    icon: "➶",
  },
  sniper: {
    kind: "sniper",
    pellets: 1,
    pierce: 3,
    multiplier: 1,
    spread: 0,
    passive: "18m 밖 피해 +50% · 3명 관통",
    skill: "빙결 저격",
    icon: "⌖",
  },
};

// Horizontal gameplay proxies: no scene traversal or skinned-mesh raycasting.
export function rayBoxDistance(x, z, dx, dz, box, range) {
  let near = 0,
    far = range;
  for (const [origin, dir, center, half] of [
    [x, dx, box.x, box.w],
    [z, dz, box.z, box.d],
  ]) {
    if (Math.abs(dir) < 1e-8) {
      if (Math.abs(origin - center) > half) return Infinity;
      continue;
    }
    let a = (center - half - origin) / dir,
      b = (center + half - origin) / dir;
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (near > far) return Infinity;
  }
  return near;
}
export function traceShot(x, z, angle, range, enemies, obstacles, pierce = 1) {
  const dx = Math.sin(angle),
    dz = Math.cos(angle);
  let wall = range;
  for (const box of obstacles)
    wall = Math.min(wall, rayBoxDistance(x, z, dx, dz, box, range));
  const hits = [];
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const p = enemy.group.position,
      vx = p.x - x,
      vz = p.z - z,
      t = vx * dx + vz * dz,
      r = 0.48 * enemy.scale;
    const side = vx * vx + vz * vz - t * t;
    if (side > r * r || t + r < 0) continue;
    const distance = Math.max(0, t - Math.sqrt(Math.max(0, r * r - side)));
    if (distance < wall) hits.push({ enemy, distance });
  }
  hits.sort((a, b) => a.distance - b.distance);
  if (hits.length > pierce) hits.length = pierce;
  return {
    hits,
    distance: hits.length >= pierce ? hits[hits.length - 1].distance : wall,
    dx,
    dz,
  };
}

export class SimulationClock {
  constructor() {
    this.debt = 0;
    this.droppedSeconds = 0;
  }
  advance(elapsed, update) {
    const input = Math.max(0, elapsed);
    this.droppedSeconds += Math.max(0, input - 0.1);
    this.debt += Math.min(input, 0.1);
    let steps = 0;
    while (this.debt >= 1 / 60 - 1e-9 && steps < 6) {
      update(1 / 60);
      this.debt -= 1 / 60;
      steps++;
    }
    return steps;
  }
  reset() {
    this.debt = 0;
  }
}

export function classSkills(id, base) {
  const spec = COMBAT_CLASSES[id];
  return base.map((skill, index) =>
    index
      ? skill
      : {
          ...skill,
          name: spec.skill,
          icon: spec.icon,
          detail: spec.passive + " · 직업 전용 기술",
        },
  );
}
