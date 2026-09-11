import {
  actionPose,
  createBladeTrail,
  updateBladeTrail,
} from "./action-art.js";
import * as THREE from "three";
export function equipArsenal(group, id, def) {
  const gear = new THREE.Group(),
    weapon = new THREE.Group();
  group.add(gear);
  gear.add(weapon);
  weapon.scale.setScalar(0.7);
  const metal = new THREE.MeshStandardMaterial({
    color: id === "gale" ? 0x352e58 : 0x233542,
    metalness: 0.65,
    roughness: 0.4,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: def.tint,
    emissive: def.tint,
    emissiveIntensity: 1.3,
  });
  const fabric = new THREE.MeshStandardMaterial({
    color: id === "lumen" ? 0x644064 : id === "gale" ? 0x3c355e : 0x315c79,
    side: THREE.DoubleSide,
  });
  const part = (geometry, material, x, y, z, parent = weapon) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const orbit = [];
  const rings = [];
  let mantle;
  if (id === "gale") {
    weapon.scale.setScalar(0.85);
    const gold = new THREE.MeshStandardMaterial({color:0xcba967,metalness:.8,roughness:.3});
    const lacquer = new THREE.MeshStandardMaterial({color:0x242338,metalness:.45,roughness:.3});
    part(new THREE.CylinderGeometry(.085,.085,.62,10),fabric,0,0,-.02).rotation.x=Math.PI/2;
    for(let i=0;i<7;i++) {
      const wrap=part(new THREE.TorusGeometry(.086,.014,4,12),gold,0,0,-.27+i*.075);
      wrap.rotation.z=i*.4;
    }
    part(new THREE.CylinderGeometry(.24,.24,.075,8),gold,0,0,.3).rotation.x=Math.PI/2;
    const outline = new THREE.Shape();
    outline.moveTo(-.14,0);
    outline.quadraticCurveTo(-.12,1.7,.29,2.82);
    outline.lineTo(.51,3.04);
    outline.quadraticCurveTo(.18,1.45,.17,0);
    outline.closePath();
    const blade = new THREE.ExtrudeGeometry(outline, {
      depth:.055,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.022,bevelThickness:.018,
    });
    blade.rotateX(Math.PI/2);
    part(blade,new THREE.MeshStandardMaterial({color:0xd4e5ed,metalness:.88,roughness:.2}),0,.02,.34);
    const edgePath=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.13,-.035,.36),new THREE.Vector3(-.1,-.035,2.05),new THREE.Vector3(.49,-.035,3.36));
    part(new THREE.TubeGeometry(edgePath,24,.017,4,false),glow,0,0,0);
    // Layered lacquer plates give a readable warrior silhouette from above.
    for(const side of [-1,1]) {
      for(let i=0;i<3;i++) {
        const plate=part(new THREE.BoxGeometry(.48,.18,.54),lacquer,side*(.44+i*.045),1.92-i*.14,0,gear);
        plate.rotation.z=side*.22;
        part(new THREE.BoxGeometry(.46,.035,.56),gold,side*(.44+i*.045),1.86-i*.14,0,gear);
        const skirt=part(new THREE.BoxGeometry(.34,.22,.16),lacquer,side*.3,1.06-i*.2,.23,gear);
        skirt.rotation.x=-.14;
      }
    }
    part(new THREE.BoxGeometry(.74,.13,.52),gold,0,1.24,0,gear);
    mantle=part(new THREE.BoxGeometry(.3,.9,.055),fabric,-.17,.78,-.3,gear);
    part(new THREE.BoxGeometry(.3,.75,.055),fabric,.17,.86,-.3,gear);
    part(new THREE.SphereGeometry(.33,12,8,0,Math.PI*2,0,Math.PI/2),lacquer,0,2.32,0,gear);
    for(const side of [-1,1]) {
      const crest=part(new THREE.ConeGeometry(.075,.52,4),gold,side*.2,2.56,.18,gear);
      crest.rotation.z=-side*.5;
    }
  } else if (id === "lumen") {
    part(new THREE.SphereGeometry(0.23, 20, 12), glow, 0, 0.08, 0.48);
    for (let i = 0; i < 3; i++) {
      const shard = part(
        new THREE.OctahedronGeometry(0.15),
        glow,
        0,
        0,
        0,
        gear,
      );
      orbit.push(shard);
    }
    const robe = part(
      new THREE.ConeGeometry(0.57, 1.2, 8, 1, true),
      fabric,
      0,
      0.9,
      0,
      gear,
    );
    robe.scale.z = 0.7;
    part(
      new THREE.TorusGeometry(0.37, 0.045, 5, 20),
      glow,
      0,
      2.65,
      0,
      gear,
    ).rotation.x = Math.PI / 2;
  } else {
    part(new THREE.BoxGeometry(0.42, 0.4, 0.58), metal, 0, 0, 0.12);
    rings.push(
      part(new THREE.TorusGeometry(0.23, 0.035, 8, 32), glow, 0, 0, 0.47),
    );
    rings.push(
      part(new THREE.TorusGeometry(0.28, 0.022, 8, 32), glow, 0, 0, 0.37),
    );
    for (const x of [-0.22, 0.22])
      part(new THREE.BoxGeometry(0.1, 0.17, 0.65), glow, x, 0.06, 0.1);
    part(new THREE.BoxGeometry(0.68, 0.65, 0.35), metal, 0, 1.4, -0.3, gear);
  }
  const muzzle = part(new THREE.SphereGeometry(0.12, 6, 4), glow, 0, 0, 0.6);
  muzzle.visible = false;
  return {
    gear,
    weapon,
    muzzle,
    glow,
    def,
    id,
    shot: 0,
    charge: 0,
    orbit,
    custom: true,
    combo: 0,
    rings,
    mantle,
    trail: id === "gale" ? createBladeTrail(group, def.tint) : null,
  };
}
export function animateArsenal(actor) {
  const e = actor.equipment;
  if (!e?.custom) return;
  const t = actor.mixer.time;
  const pose = actionPose(
    e.id,
    actor.motion?.age ?? 10,
    e.def.interval,
    e.combo,
  );
  // Orientation is supplied by the actual wrist transform in characters.js.
  if (e.id === "gale") {
    if (e.mantle)
      e.mantle.rotation.z = -pose.swing * 0.08 + Math.sin(t * 5) * 0.025;
    updateBladeTrail(actor, pose.active);
  } else if (e.id === "lumen") {
    e.weapon.position.z += 0.12;
    e.weapon.scale.setScalar(0.7 + e.charge * 0.2 - pose.cast * 0.12);
    e.orbit.forEach((mesh, i) => {
      const angle = t * 1.8 + (i * Math.PI * 2) / 3;
      const radius = 0.75 - pose.cast * 0.2;
      mesh.position.set(
        Math.cos(angle) * radius,
        1.5 + Math.sin(angle * 2) * 0.1,
        Math.sin(angle) * radius,
      );
      mesh.rotation.y = t;
    });
  } else {
    for (let i = 0; i < e.rings.length; i++) {
      e.rings[i].rotation.z = t * (i ? 1 : -1) * 3;
      e.rings[i].scale.setScalar(1 + pose.thrust * 0.15);
    }
  }
  e.muzzle.visible = e.id === "nova" && pose.active && actor.motion.age < 0.12;
  e.muzzle.scale.setScalar(1 + pose.thrust * 1.5);
}
