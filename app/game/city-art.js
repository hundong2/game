import * as THREE from "three";

export function dressCity(engine) {
  const {scene} = engine;
  const box=(w,h,d,c,x,y,z)=>engine.box(w,h,d,c,x,y,z);
  // Thin painted crossings and drainage details do not create invisible colliders.
  for (const z of [-15,26]) for(let x=-10;x<11;x+=2)
    box(1.1,.018,3.2,0x879395,x,.05,z);
  for(const side of [-1,1]) {
    box(.45,.12,78,0x3e4b52,side*12.8,.07,0);
    for(let z=-33;z<38;z+=14) {
      for(let i=0;i<6;i++)box(.5,.022,.06,0x17242e,side*12.3,.08,z+i*.13);
      const post=box(.14,4.5,.14,0x263a48,side*19,2.25,z);
      box(1.8,.12,.12,0x263a48,side*18.2,4.4,z);
      const lamp=box(.65,.09,.32,side<0?0x62c9da:0xf6bd70,side*17.5,4.35,z);
      lamp.material.emissive.setHex(side<0?0x2d8dba:0xf0a051);
      lamp.material.emissiveIntensity=2;
      post.castShadow=true;
      const spill=new THREE.Mesh(new THREE.PlaneGeometry(5,9), new THREE.MeshBasicMaterial({
        color:side<0?0x63bfd3:0xe9a251,transparent:true,opacity:.035,depthWrite:false,
      }));
      spill.rotation.x=-Math.PI/2;spill.position.set(side*16,.055,z);scene.add(spill);
    }
  }
  // Shuttered storefronts remain outside the central combat corridor.
  for(const side of [-1,1])for(let z=-30;z<32;z+=15) {
    const sign=box(.07,.7,4.5,side<0?0x224b62:0x653c37,side*21.94,3.3,z);
    sign.material.emissive.setHex(side<0?0x123849:0x492521);
    for(let n=0;n<7;n++)box(.1,.09,4.8,0x26343c,side*21.9,.4+n*.3,z);
    box(.8,.15,5.2,0x36444d,side*21.5,2.9,z);
  }
}
