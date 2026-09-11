import * as THREE from "three";
// Bounded transient GPU resources. Dropping excess cosmetic effects never drops damage.
export class EffectPool {
  constructor(scene, capacity = 64) {
    this.scene = scene;
    this.dropped = 0;
    this.slots = [];
    this.sealGeometry = new THREE.RingGeometry(.539,.55,80);
    const coreGeometry = new THREE.SphereGeometry(1, 16, 10);
    for (let i = 0; i < capacity; i++) {
      const ring = i < capacity / 2;
      const geometry = ring
        ? new THREE.RingGeometry(0.49, 0.55, 40)
        : new THREE.BufferGeometry().setAttribute(
            "position",
            new THREE.BufferAttribute(new Float32Array(72), 3),
          );
      const material = ring
        ? new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        : new THREE.LineBasicMaterial({ transparent: true, depthWrite: false });
      const mesh = ring
        ? new THREE.Mesh(geometry, material)
        : new THREE.LineSegments(geometry, material);
      mesh.visible = false;
      mesh.frustumCulled = false;
      scene.add(mesh);
      const core = ring
        ? null
        : new THREE.Mesh(
            coreGeometry,
            new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            }),
          );
      if (core) {
        mesh.add(core);
        const halo = new THREE.Mesh(
          coreGeometry,
          new THREE.ShaderMaterial({
            uniforms:{tint:{value:new THREE.Color(0xffffff)}},
            vertexShader:`varying vec3 normalV;varying vec3 viewV;void main(){vec4 v=modelViewMatrix*vec4(position,1.);normalV=normalMatrix*normal;viewV=-v.xyz;gl_Position=projectionMatrix*v;}`,
            fragmentShader:`uniform vec3 tint;varying vec3 normalV;varying vec3 viewV;void main(){float soft=pow(max(0.,dot(normalize(normalV),normalize(viewV))),2.5);gl_FragColor=vec4(tint,soft*.2);}`,
            transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
          }),
        );
        halo.scale.setScalar(1.8);
        core.add(halo);
      }
      this.slots.push({ mesh, core, ring, baseGeometry: geometry, life: 0, max: 1 });
    }
  }
  acquire(ring, color, life) {
    const slot = this.slots.find((s) => s.ring === ring && s.life <= 0);
    if (!slot) {
      this.dropped++;
      return null;
    }
    slot.life = slot.max = life;
    slot.cinematic = false;
    slot.pattern = "";
    slot.mesh.geometry = slot.baseGeometry;
    slot.mesh.geometry.setDrawRange(0, Infinity);
    if (slot.core) slot.core.visible = true;
    slot.radius = 12;
    slot.mesh.visible = true;
    slot.mesh.material.color.set(color);
    slot.mesh.material.opacity = 0.85;
    slot.mesh.scale.setScalar(1);
    return slot;
  }
  impact(position, color) {
    const s = this.acquire(false, color, 0.22);
    if (!s) return;
    s.pattern = "impact";
    s.core.visible = false;
    const p = s.mesh.geometry.attributes.position;
    for (let i = 0; i < 12; i++) {
      const a = i * 2.399,
        h = 0.8 + (i % 3) * 0.25;
      p.setXYZ(i * 2, position.x, 0.9, position.z);
      p.setXYZ(
        i * 2 + 1,
        position.x + Math.cos(a) * 0.7,
        h,
        position.z + Math.sin(a) * 0.7,
      );
    }
    p.needsUpdate = true;
  }
  burst(position, color) {
    const s = this.acquire(true, color, 0.4);
    if (!s) return;
    s.mesh.position.set(position.x, 0.13, position.z);
    s.mesh.rotation.x = -Math.PI / 2;
  }
  tracer(x, z, dx, dz, distance, color, kind = "viper", level = 1, height = 1.3) {
    if (kind === true) kind = "archer";
    const duration =
      kind === "lumen"
        ? 1.2
        : kind === "nova" ? .22 : kind === "sniper"
          ? 0.2
          : kind === "archer"
            ? 0.32
            : kind === "pulse"
              ? 0.24
              : 0.1;
    const s = this.acquire(false, color, duration);
    if (!s) return;
    Object.assign(s, {
      x,
      z,
      dx,
      dz,
      distance,
      height,
      kind,
      tier: Math.min(3, 1 + Math.floor((Math.max(1, level) - 1) / 4)),
    });
    if (s.core) { s.core.material.color.set(color); s.core.children[0].material.uniforms.tint.value.set(color); }
    this.drawTracer(s, 0);
    return s;
  }
  drawTracer(s, progress) {
    const { x, z, dx, dz, distance, kind, height = 1.3 } = s;
    if (s.pattern === "slash") {
      this.drawSlash(s, progress);
      return;
    }
    const beam = kind === "sniper";
    const head =
      kind === "lumen"
        ? distance * (progress < 0.5 ? progress * 2 : 2 - progress * 2)
        : beam
          ? distance
          : Math.min(distance, 0.7 + progress * distance);
    const length =
      kind === "archer"
        ? 1.25
        : kind === "pulse"
          ? 0.45
          : kind === "reaper"
            ? 2
            : 0.7;
    if (s.core) {
      s.core.position.set(x + dx * head, height, z + dz * head);
      const radius =
        (["pulse", "lumen"].includes(kind) ? 0.24 : 0.065) *
        (1 + (s.tier - 1) * 0.4);
      s.core.scale.set(
        radius,
        radius,
        ["pulse", "lumen"].includes(kind) ? radius : radius * 3,
      );
      s.core.rotation.y = Math.atan2(dx, dz);
      s.core.material.opacity = Math.min(1, (s.life / s.max) * 3);
    }
    const tail = beam ? 0.55 : Math.max(0.55, head - length);
    const p = s.mesh.geometry.attributes.position;
    const vertex = (i, along, side = 0, y = height) =>
      p.setXYZ(
        i,
        x + dx * along - dz * side,
        y,
        z + dz * along + dx * side,
      );
    vertex(0, tail);
    vertex(1, head);
    if (kind === "archer") {
      vertex(2, head - 0.3, -0.16);
      vertex(3, head);
      vertex(4, head - 0.3, 0.16);
      vertex(5, head);
      vertex(6, tail, -0.12);
      vertex(7, tail + 0.25);
    } else if (["pulse", "lumen"].includes(kind)) {
      vertex(2, head, -0.18);
      vertex(3, head, 0.18);
      vertex(4, head, 0, height - .18);
      vertex(5, head, 0, height + .18);
      vertex(6, head - 0.2);
      vertex(7, head + 0.2);
    } else {
      vertex(2, tail, -0.025);
      vertex(3, head, -0.025);
      vertex(4, tail, 0.025);
      vertex(5, head, 0.025);
      vertex(6, head);
      vertex(7, head);
    }
    // Fixed vertex budget: leveled trails add no geometry or draw calls.
    for (let i = 8; i < 24; i++) vertex(i, head);
    for (let i = 0; i < s.tier * 2; i++) {
      const side = (i % 2 ? 1 : -1) * (0.08 + Math.floor(i / 2) * 0.1);
      const lag = (i + 1) * 0.17;
      const curl =
        kind === "pulse" || kind === "archer"
          ? Math.sin(progress * 24 + i) * 0.15
          : 0;
      vertex(8 + i * 2, Math.max(0.55, tail - lag), side + curl);
      vertex(9 + i * 2, Math.max(0.55, head - lag), side);
    }
    if (s.tier >= 2) {
      const radius = 0.18 * s.tier;
      vertex(20, head - radius, -radius);
      vertex(21, head + radius, radius);
      vertex(22, head - radius, radius);
      vertex(23, head + radius, -radius);
    }
    p.needsUpdate = true;
  }
  slash(position, yaw, radius, color, full = false) {
    const slot = this.acquire(true, color, 0.4);
    if (!slot) return;
    Object.assign(slot, { pattern: "blade", radius, yaw, full });
    slot.mesh.position.set(position.x, 0.4, position.z);
    slot.mesh.rotation.set(-Math.PI / 2, 0, yaw - 0.95);
    slot.mesh.geometry.setDrawRange(0, full ? 240 : 78);
    slot.mesh.scale.setScalar((radius / 0.55) * 0.7);
    return slot;
  }
  drawSlash(s, progress) {
    const p = s.mesh.geometry.attributes.position;
    const width = s.full ? Math.PI * 2 : 1.9;
    for (let i = 0; i < 12; i++)
      for (let k = 0; k < 2; k++) {
        const angle = s.yaw - width / 2 + ((i + k) / 12) * width;
        const radius = s.radius * (0.6 + progress * 0.4);
        p.setXYZ(
          i * 2 + k,
          s.x + Math.sin(angle) * radius,
          0.6 + Math.sin(progress * Math.PI) * 0.5,
          s.z + Math.cos(angle) * radius,
        );
      }
    p.needsUpdate = true;
  }
  mobility(position, yaw, id, color) {
    const portal = id === "lumen" || id === "nova";
    for (let i=0;i<3;i++) {
      const s=this.acquire(portal,color,.5+i*.08);
      if(!s) break;
      if(portal) {
        s.mesh.position.set(position.x, .6+i*.25, position.z);
        s.mesh.rotation.set(id==="lumen"?0:-Math.PI/2, id==="lumen"?yaw:0,0);
        s.radius=3+i;
      } else {
        s.pattern="impact"; s.core.visible=false;
        const p=s.mesh.geometry.attributes.position;
        for(let j=0;j<12;j++) {
          const side=(j-5.5)*.11, start=(j%3)*.25;
          const x=position.x+Math.cos(yaw)*side, z=position.z-Math.sin(yaw)*side;
          const y=id==="archer"?.3+j*.06:id==="bastion"?1.7:.25+i*.3;
          p.setXYZ(j*2,x-Math.sin(yaw)*start,y,z-Math.cos(yaw)*start);
          p.setXYZ(j*2+1,x-Math.sin(yaw)*(2+start),y,z-Math.cos(yaw)*(2+start));
        }
        p.needsUpdate=true;
      }
    }
  }
  ultimate(position, yaw, id, color, range) {
    if (id === "gale" || id === "bastion") {
      for (let i = 0; i < 3; i++) {
        const slot = this.slash(
          position,
          yaw + (id === "gale" ? (i * Math.PI * 2) / 3 : 0),
          id === "gale" ? 7 : 5 + i * 5,
          color,
          false,
        );
        if (slot) {
          slot.life = slot.max = 1.1 + i * 0.1;
          if (id === "gale") slot.mesh.geometry.setDrawRange(0, 42);
        }
      }
      return;
    }
    if (id === "lumen") {
      // Six nested seals stay on the ground so enemies remain legible.
      for(let i=0;i<6;i++) {
        const s=this.acquire(true,color,2.2+i*.12);
        if(!s) break;
        s.pattern="seal";s.radius=7+i*3;s.yaw=i*.35;
        s.mesh.geometry=this.sealGeometry;
        s.mesh.position.set(position.x,.08+i*.025,position.z);
        s.mesh.rotation.set(-Math.PI/2,0,s.yaw);

      }
      for(let n=0;n<2;n++) {
        const s=this.acquire(false,color,2.6);if(!s)break;
        s.pattern="impact";s.core.visible=false;
        const p=s.mesh.geometry.attributes.position, radius=7+n*7;
        for(let j=0;j<12;j++) {
          const a=j*Math.PI/6,b=(j+5)*Math.PI/6;
          p.setXYZ(j*2,position.x+Math.sin(a)*radius,.12,position.z+Math.cos(a)*radius);
          p.setXYZ(j*2+1,position.x+Math.sin(b)*radius,.12,position.z+Math.cos(b)*radius);
        }
        p.needsUpdate=true;
      }
      return;
    }
    if (["sniper", "viper", "nova"].includes(id)) {
      const count = id === "sniper" ? 1 : id === "nova" ? 3 : 5;
      for (let i = 0; i < count; i++) {
        const a = yaw + (i - (count - 1) / 2) * 0.035;
        const slot = this.tracer(
          position.x,
          position.z,
          Math.sin(a),
          Math.cos(a),
          range,
          color,
          "sniper",
          9,
        );
        if (slot) slot.life = slot.max = 0.9;
      }
      return;
    }
    if (id === "archer" || id === "reaper") {
      for (let i = 0; i < 16; i++) {
        const a = i * 2.399,
          radius = Math.sqrt(i) * (id === "archer" ? 4.5 : 2.8);
        const slot = this.acquire(false, color, 0.9 + i * 0.035);
        if (!slot) break;
        const p = slot.mesh.geometry.attributes.position;
        slot.pattern = "rain";
        slot.mesh.position.set(0, 0, 0);
        const x = position.x + Math.sin(a) * radius,
          z = position.z + Math.cos(a) * radius;
        for (let j = 0; j < 24; j++) p.setXYZ(j, x, j % 2 ? 1 : 8 + (i % 3), z);
        p.needsUpdate = true;
        slot.core.position.set(x, 1, z);
        slot.core.material.color.set(color);
        slot.core.scale.setScalar(id === "reaper" ? 0.22 : 0.09);
      }
      return;
    }
    // Medic: concentric healing waves, no ballistic rain or blade arcs.
    for (let i = 0; i < 3; i++) {
      const slot = this.acquire(true, color, 1 + i * 0.2);
      if (!slot) break;
      slot.mesh.position.set(position.x, 0.15 + i * 0.15, position.z);
      slot.mesh.rotation.x = -Math.PI / 2;
      slot.radius = 30 + i * 3;
    }
  }
  update(dt) {
    for (const s of this.slots) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.mesh.visible = s.life > 0;
      if (s.life > 0) {
        s.mesh.material.opacity = Math.min(1, (s.life / s.max) * 2);
        if (s.pattern === "seal") {
          const t=1-s.life/s.max;
          s.mesh.scale.setScalar(s.radius*(.5+Math.min(1,t*4)*1.3));
          s.mesh.rotation.z=s.yaw+t*(s.yaw%2?1:-1)*2;
          s.mesh.material.opacity=Math.sin(Math.PI*t)*.45;
        } else if (s.pattern === "blade") {
          const progress = 1 - s.life / s.max;
          s.mesh.scale.setScalar((s.radius / 0.55) * (0.7 + progress * 0.3));
          s.mesh.rotation.z = s.yaw - 0.95 + progress * 1.6;
        } else if (s.ring)
          s.mesh.scale.setScalar(1 + (1 - s.life / s.max) * s.radius);
        else if (s.pattern !== "rain" && s.pattern !== "impact")
          this.drawTracer(s, 1 - s.life / s.max);
      }
    }
  }
  clear() {
    for (const s of this.slots) {
      s.life = 0;
      s.mesh.visible = false;
    }
  }
  get active() {
    let n = 0;
    for (const s of this.slots) if (s.life > 0) n++;
    return n;
  }
}
