// Ctrl traversal stays in the fixed-step collision simulation for every class.
export const MOBILITY = {
  viper: {name:"섀도 스텝", duration:.44, speed:13, cooldown:1.2, cost:28, lean:.5, lift:.05},
  bastion: {name:"방패 돌파", duration:.48, speed:11, cooldown:1.6, cost:28, lean:.3, lift:0},
  pulse: {name:"펄스 활공", duration:.42, speed:14, cooldown:1.3, cost:26, lean:.15, lift:.55},
  reaper: {name:"추진 돌격", duration:.36, speed:17, cooldown:1.4, cost:30, lean:.6, lift:.15},
  archer: {name:"바람 도약", duration:.5, speed:12, cooldown:1.3, cost:26, lean:-.2, lift:1.4},
  sniper: {name:"전술 슬라이드", duration:.48, speed:12, cooldown:1.4, cost:24, lean:.7, lift:0},
  gale: {name:"발도 돌진", duration:.3, speed:20, cooldown:1.2, cost:28, lean:.65, lift:.08, forward:true},
  lumen: {name:"프리즘 전이", duration:.24, speed:23, cooldown:1.5, cost:28, lean:0, lift:.35},
  nova: {name:"중력 도약", duration:.38, speed:16, cooldown:1.4, cost:28, lean:.25, lift:.95},
};
export function mobilityPose(id, remaining) {
  const p=MOBILITY[id] || MOBILITY.viper;
  const t=Math.max(0,Math.min(1,1-remaining/p.duration));
  const wave=remaining>0?Math.sin(t*Math.PI):0;
  return {lean:p.lean*wave || 0,lift:p.lift*wave,squash:id==="sniper"?1-wave*.42:1,
    phaseScale:id==="lumen"?1-wave*.72:1};
}
