import * as THREE from "three";
export function actionPose(id, age, duration, combo = 1) {
  const t = Math.min(1, Math.max(0, age / duration)),
    active = age < duration;
  const release = Math.sin((Math.min(1, t / 0.38) * Math.PI) / 2);
  const recover = t < 0.38 ? 1 : Math.pow(1 - (t - 0.38) / 0.62, 2);
  const sign = combo % 2 ? 1 : -1;
  return {
    active,
    strength: active ? Math.sin(Math.PI * t) : 0,
    swing:
      id === "gale" && active ? sign * (-1.15 + release * 2.6) * recover : 0,
    thrust: id === "nova" && active ? release * recover : 0,
    cast: id === "lumen" && active ? Math.sin(Math.PI * t) : 0,
  };
}
// A fixed 12-sample ribbon follows the actual blade, rather than a ground circle.
export function createBladeTrail(group, color) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(12 * 6 * 3),
    uv = new Float32Array(12 * 6 * 2);
  for (let i = 0; i < 12; i++) {
    const values = [
      i / 12,
      0,
      i / 12,
      1,
      (i + 1) / 12,
      0,
      i / 12,
      1,
      (i + 1) / 12,
      1,
      (i + 1) / 12,
      0,
    ];
    uv.set(values, i * 12);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tint: { value: new THREE.Color(color) },
      strength: { value: 0 },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 tint;uniform float strength;varying vec2 vUv;void main(){float edge=pow(sin(vUv.y*3.14159),.6);float fade=pow(1.-vUv.x,1.7);gl_FragColor=vec4(mix(tint,vec3(1.),edge*.6),edge*fade*strength*.7);}`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  group.add(mesh);
  return {
    mesh,
    history: Array.from({ length: 13 }, () => ({
      base: new THREE.Vector3(),
      tip: new THREE.Vector3(),
    })),
    base: new THREE.Vector3(),
    tip: new THREE.Vector3(),
    valid: 0,
  };
}
export function updateBladeTrail(actor, active) {
  const trail = actor.equipment.trail;
  if (!trail) return;
  trail.mesh.visible = active;
  if (!active) {
    trail.valid = 0;
    return;
  }
  actor.group.updateMatrixWorld(true);
  trail.base.set(0, 0, 0.35);
  trail.tip.set(0.49, 0, 3.36);
  actor.equipment.weapon.localToWorld(trail.base);
  actor.equipment.weapon.localToWorld(trail.tip);
  actor.group.worldToLocal(trail.base);
  actor.group.worldToLocal(trail.tip);
  for (let i = 12; i > 0; i--) {
    trail.history[i].base.copy(trail.history[i - 1].base);
    trail.history[i].tip.copy(trail.history[i - 1].tip);
  }
  trail.history[0].base.copy(trail.base);
  trail.history[0].tip.copy(trail.tip);
  if (!trail.valid)
    for (const sample of trail.history) {
      sample.base.copy(trail.base);
      sample.tip.copy(trail.tip);
    }
  trail.valid = Math.min(12, trail.valid + 1);
  const p = trail.mesh.geometry.attributes.position;
  for (let i = 0; i < 12; i++) {
    const a = trail.history[i],
      b = trail.history[i + 1],
      v = [a.base, a.tip, b.base, a.tip, b.tip, b.base];
    for (let j = 0; j < 6; j++) p.setXYZ(i * 6 + j, v[j].x, v[j].y, v[j].z);
  }
  p.needsUpdate = true;
  trail.mesh.material.uniforms.strength.value = 0.9;
}
