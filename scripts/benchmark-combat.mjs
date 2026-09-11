import * as THREE from "three";
import { traceShot } from "../app/game/combat.js";
import { EffectPool } from "../app/game/effects.js";
const enemies = Array.from({ length: 160 }, (_, i) => ({
  hp: 100,
  scale: 1,
  group: { position: { x: ((i % 16) - 8) * 2.5, z: -Math.floor(i / 16) * 3 } },
}));
const meshes = enemies.map((e) => {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 1.4, 4, 8));
  m.position.set(e.group.position.x, 1.15, e.group.position.z);
  m.updateMatrixWorld();
  return m;
});
const ray = new THREE.Raycaster(
  new THREE.Vector3(0, 1.3, 10),
  new THREE.Vector3(0, 0, -1),
  0,
  48,
);
function measure(fn) {
  for (let i = 0; i < 100; i++) fn(i);
  const t = performance.now();
  for (let i = 0; i < 2000; i++) fn(i);
  return performance.now() - t;
}
const legacy = measure((i) => {
  ray.ray.direction.set(Math.sin(i * 0.01), 0, -Math.cos(i * 0.01));
  ray.intersectObjects(meshes, false);
});
const numeric = measure((i) =>
  traceShot(0, 10, Math.PI - i * 0.01, 48, enemies, [], 3),
);
const scene = new THREE.Scene(),
  pool = new EffectPool(scene, 64);
for (let i = 0; i < 10000; i++) {
  pool.tracer(0, 0, 0, -1, 20, 0xffffff);
  pool.update(0.016);
}
console.log(
  JSON.stringify(
    {
      scenario: "160 enemies, 2000 traces; CPU only",
      legacyMeshRaycastMs: +legacy.toFixed(2),
      numericTraceMs: +numeric.toFixed(2),
      effectObjectsAfter10000: scene.children.length,
    },
    null,
    2,
  ),
);
