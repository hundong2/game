import * as THREE from "three";

const surfaces = new WeakMap();
// Cache smooth normals without changing skin weights, positions or triangle count.
export function softenSurface(source) {
  if (surfaces.has(source)) return surfaces.get(source);
  const geometry = source.clone();
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const positions = geometry.attributes.position, normals = geometry.attributes.normal;
  const groups = new Map(), keys = [];
  for (let i=0;i<positions.count;i++) {
    const key = [positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*10000)).join(',');
    keys.push(key);
    if (!groups.has(key)) groups.set(key,new THREE.Vector3());
    groups.get(key).add(new THREE.Vector3(normals.getX(i),normals.getY(i),normals.getZ(i)));
  }
  const n = new THREE.Vector3();
  for (let i=0;i<positions.count;i++) {
    n.copy(groups.get(keys[i])).normalize();
    if (n.lengthSq()>.01) normals.setXYZ(i,n.x,n.y,n.z);
  }
  normals.needsUpdate=true;
  surfaces.set(source,geometry);
  return geometry;
}
