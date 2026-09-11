globalThis.ProgressEvent = class {
  constructor(type, init) {
    Object.assign(this, { type }, init);
  }
};
import fs from "node:fs/promises";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((b) => {
      this.result = b;
      this.onloadend?.();
    });
  }
};
const keep = [
  "Idle_Gun",
  "Idle_Gun_Pointing",
  "Idle_Gun_Shoot",
  "Gun_Shoot",
  "Run",
  "Run_Back",
  "Run_Left",
  "Run_Right",
  "Run_Shoot",
  "Death",
];
for (const id of ["viper", "bastion", "pulse", "reaper"]) {
  const data = await fs.readFile(`work/assets/${id}.gltf`, "utf8");
  const rig = await new GLTFLoader().parseAsync(data, "");
  const clips = rig.animations.filter((a) => keep.includes(a.name));
  const out = await new GLTFExporter().parseAsync(rig.scene, {
    binary: true,
    animations: clips,
  });
  await fs.writeFile(`public/models/${id}.glb`, Buffer.from(out));
  console.log(
    id,
    out.byteLength,
    clips.map((a) => a.name),
  );
}
