import fs from "node:fs/promises";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { MeshStandardMaterial, Box3, Vector3 } from "three";
// Offline model conversion: shipped runtime only loads GLB + local skin textures.
globalThis.window = { URL: globalThis.URL };
globalThis.document = {
  createElementNS: () => ({
    addEventListener() {},
    removeEventListener() {},
    set src(_value) {},
  }),
};
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:application/octet-stream;base64,${Buffer.from(buffer).toString("base64")}`;
      this.onloadend?.();
    });
  }
};
const loader = new FBXLoader();
async function readFbx(path) {
  const b = await fs.readFile(path);
  return loader.parse(
    b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    "",
  );
}
const model = await readFbx("work/assets/retro/Model/characterMedium.fbx");
model.traverse((o) => {
  if (o.isMesh) {
    o.material = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
    o.frustumCulled = false;
  }
});
const clips = [];
for (const name of ["idle", "run"]) {
  const animation = await readFbx(`work/assets/retro/Animations/${name}.fbx`);
  const clip = animation.animations.sort((a, b) => b.duration - a.duration)[0];
  clip.name = name;
  clips.push(clip);
}
console.log(
  "bounds",
  new Box3().setFromObject(model).getSize(new Vector3()).toArray(),
  "clips",
  clips.map((c) => [c.name, c.duration, c.tracks.length]),
);
const glb = await new GLTFExporter().parseAsync(model, {
  binary: true,
  animations: clips,
});
await fs.writeFile("public/models/survivor.glb", Buffer.from(glb));
console.log("GLB bytes", glb.byteLength);
