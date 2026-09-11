import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Two shared meshes per archetype; wounds, exposed ribs and mutations are batched.
const cache = new Map();
export function equipInfected(group, type) {
  if (!cache.has(type)) {
    const skin = [],
      wounds = [];
    const add = (
      list,
      geometry,
      x,
      y,
      z,
      sx = 1,
      sy = 1,
      sz = 1,
      rotation = 0,
    ) => {
      geometry.scale(sx, sy, sz);
      geometry.rotateZ(rotation);
      geometry.translate(x, y, z);
      list.push(geometry.toNonIndexed());
      geometry.dispose();
    };
    for (let i = 0; i < 5; i++) {
      add(
        wounds,
        new THREE.SphereGeometry(0.13, 6, 4),
        -0.2 + i * 0.08,
        1.65 - i * 0.085,
        0.29,
        1.3,
        0.6,
        0.2,
        -0.5,
      );
      add(
        skin,
        new THREE.BoxGeometry(0.28, 0.035, 0.06),
        -0.08,
        1.6 - i * 0.07,
        0.32,
        1,
        1,
        1,
        -0.15,
      );
    }
    const count =
      type === "brute" || type === "boss" ? 7 : type === "runner" ? 3 : 0;
    for (let i = 0; i < count; i++)
      add(
        skin,
        new THREE.ConeGeometry(0.12, 0.5, 5),
        -0.48 + i * 0.15,
        1.85 + Math.sin(i) * 0.12,
        -0.1,
        1,
        1,
        1,
        (i - 3) * -0.2,
      );
    for (const x of [-0.32, 0.32])
      add(
        wounds,
        new THREE.ConeGeometry(0.2, 0.5, 5),
        x,
        0.95,
        0.12,
        1,
        1,
        0.4,
        x,
      );
    const geometry = [mergeGeometries(skin), mergeGeometries(wounds)];
    for (const g of [...skin, ...wounds]) g.dispose();
    cache.set(type, geometry);
  }
  const colors = [0xb7ad85, type === "boss" ? 0x935247 : 0x542b2c];
  cache.get(type).forEach((geometry, i) => {
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: colors[i], roughness: 1 }),
    );
    mesh.userData.sharedGeometry = true;
    group.add(mesh);
  });
}
