import * as THREE from "three";
import { dressCity } from "./city-art.js";

export function createArena(engine) {
  const { scene } = engine;
  const box = (w, h, d, c, x, y, z) => engine.box(w, h, d, c, x, y, z);
  scene.background = new THREE.Color(0x19262d);
  scene.fog = new THREE.FogExp2(0x26343e, 0.006);
  const floor = box(84, 0.4, 96, 0x384951, 0, -0.24, 0);
  floor.receiveShadow = true;
  const road=box(25, 0.03, 76, 0xb7c4ce, 0, 0, 0);
  const asphalt=document.createElement('canvas');asphalt.width=512;asphalt.height=512;
  const paint=asphalt.getContext('2d');paint.fillStyle='#354147';paint.fillRect(0,0,512,512);
  let seed=71;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<22000;i++){const value=40+Math.floor(random()*50);paint.fillStyle=`rgba(${value},${value+5},${value+8},.45)`;paint.fillRect(random()*512,random()*512,1+random()*2,1+random()*2);}
  paint.strokeStyle='#202d32';paint.lineWidth=1.2;
  for(let i=0;i<14;i++){let x=random()*512,y=random()*512;paint.beginPath();paint.moveTo(x,y);for(let j=0;j<5;j++){x+=(random()-.5)*45;y+=random()*25;paint.lineTo(x,y);}paint.stroke();}
  const texture=new THREE.CanvasTexture(asphalt);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(4,12);texture.anisotropy=4;road.material.map=texture;road.receiveShadow=true;

  // The generated material replaces the debug-like grid and repeated flat floor.
  new THREE.TextureLoader().load(import.meta.env.BASE_URL + 'art/asphalt-v15.png', wet => {
    if(engine.disposed) {wet.dispose();return;}
    wet.colorSpace=THREE.SRGBColorSpace;wet.wrapS=wet.wrapT=THREE.RepeatWrapping;
    wet.repeat.set(1.6,4.8);wet.anisotropy=4;
    road.material.map=wet;road.material.color.setHex(0x87929c);road.material.roughness=.48;
    road.material.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\nfloat groundLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(groundLuma),diffuseColor.rgb,.45);');
    };
    road.material.needsUpdate=true;
    texture.dispose();engine.needsRender=true;
  });
  for (let z = -35; z < 38; z += 5) {
    box(0.13, 0.035, 2, 0x83958e, -0.15, 0.04, z);
    box(0.13, 0.035, 2, 0x83958e, 0.15, 0.04, z);
  }
  for (const x of [-12, 12]) box(0.16, 0.05, 76, 0xb99e63, x, 0.04, 0);
  // Perimeter stays outside the playable area so roofs cannot hide the player.
  for (const side of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const x = side * 28,
        z = -37 + i * 15,
        h = 4 + (i % 3) * 1.5;
      box(12, h, 12, [0x43545b, 0x4d5b62, 0x34494f][i % 3], x, h / 2, z);
      box(12.5, 0.3, 12.5, 0x293d45, x, h, z);
      box(3, 0.8, 3, 0x34434b, x + 2, h + 0.4, z);
      for (let a = -4; a < 5; a += 3) {
        const window = box(
          0.1,
          1.5,
          1.5,
          0x87b9bc,
          x - side * 6.05,
          2.5,
          z + a,
        );
        window.material.emissive.setHex(0x325b63);
      }
    }
  const covers = [
    [-8, -8, 3.5, 1.4],
    [7, 2, 3, 1.6],
    [-6, 20, 4, 1.5],
    [8, -22, 3.5, 1.5],
    [-16, 5, 1.5, 5],
    [15, 23, 1.5, 4],
  ];
  covers.forEach(([x, z, w, d]) => {
    const mesh = box(w, 1.2, d, 0x42525d, x, 0.6, z);
    engine.obstacles.push({ x, z, w: w / 2, d: d / 2, mesh });
    for (let a = -w / 2 + 0.4; a < w / 2; a += 0.8) {
      const stripe = engine.box(
        0.35,
        0.08,
        d + 0.02,
        0x9d906b,
        a,
        0.64,
        0,
        mesh,
      );
      stripe.rotation.z = 0.05;
    }
  });
  // Abandoned cars, tires and sealed supply containers provide scale cues.
  for (const [x, z, color] of [
    [-17, -22, 0x456775],
    [15, -7, 0x8b5b4d],
    [-16, 31, 0x597466],
  ]) {
    const body = box(2.1, 0.75, 4.2, color, x, 0.75, z);
    engine.obstacles.push({ x, z, w: 1.1, d: 2.2, mesh: body });
    box(1.75, 0.65, 2.1, 0x263b43, x, 1.4, z - 0.2);
    box(1.6, 0.04, 1.8, color, x, 1.75, z - 0.2);
    for (const side of [-1, 1])
      for (const dz of [-1.35, 1.35]) {
        const tire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12),
          new THREE.MeshStandardMaterial({ color: 0x142229 }),
        );
        tire.rotation.z = Math.PI / 2;
        tire.position.set(x + side * 1.04, 0.45, z + dz);
        scene.add(tire);
      }
  }
  for (const z of [-41, 41])
    for (let x = -20; x <= 20; x += 3) box(2.8, 1.3, 0.7, 0x819095, x, 0.65, z);
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d4b775";
  ctx.font = "bold 94px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("QUARANTINE 07", 512, 115);
  ctx.font = "30px monospace";
  ctx.fillText("NO ENTRY  /  BIOHAZARD", 512, 177);
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 3.75),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  decal.rotation.x = -Math.PI / 2;
  decal.position.set(0, 0.065, -31);
  scene.add(decal);
  const dustGeo = new THREE.BufferGeometry();
  const pts = [];
  for (let i = 0; i < 160; i++)
    pts.push(
      Math.random() * 70 - 35,
      Math.random() * 6,
      Math.random() * 80 - 40,
    );
  dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  engine.dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xaac9c5,
      size: 0.035,
      transparent: true,
      opacity: 0.4,
    }),
  );
  scene.add(engine.dust);
  dressCity(engine);
}
