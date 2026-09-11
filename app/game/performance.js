import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Batch immutable opaque scenery by material; retain collider meshes for raycasts.
export function batchScenery(engine) {
  const groups = new Map(),
    colliders = new Set(engine.obstacles.map((o) => o.mesh));
  engine.scene.updateMatrixWorld(true);
  const scenery=[];engine.scene.traverse(o=>{if(o.isMesh)scenery.push(o);});
  for (const mesh of scenery) {
    if (
      !mesh.isMesh ||
      Array.isArray(mesh.material) ||
      mesh.material.map ||
      mesh.material.transparent
    )
      continue;
    const m = mesh.material;
    const key = [
      m.type,
      m.color?.getHex(),
      m.emissive?.getHex(),
      m.roughness,
      m.metalness,
    ].join(":");
    if (!groups.has(key))
      groups.set(key, { material: m.clone(), geometries: [], cast: false });
    const bucket = groups.get(key),
      geometry = mesh.geometry.index
        ? mesh.geometry.toNonIndexed()
        : mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    bucket.geometries.push(geometry);
    bucket.cast ||= mesh.castShadow;
    if (colliders.has(mesh)) mesh.visible = false;
    else {
      mesh.parent?.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  }
  for (const bucket of groups.values()) {
    const geometry = mergeGeometries(bucket.geometries, false);
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.receiveShadow = true;
    mesh.castShadow = bucket.cast;
    engine.scene.add(mesh);
    bucket.geometries.forEach((g) => g.dispose());
  }
}
