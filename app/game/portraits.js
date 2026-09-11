import * as THREE from "three";
import { AGENTS } from "./content.js";
import { makeCharacter, animateCharacter } from "./characters.js";

// Reuse the game renderer once at load. No additional live WebGL contexts.
export function renderPortraits(renderer, assets, dispose) {
  const target = new THREE.WebGLRenderTarget(256, 320);
  const previous = renderer.getRenderTarget();
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xd6eeff, 0x46534b, 3));
  const light = new THREE.DirectionalLight(0xffe6cc, 4);
  light.position.set(3, 5, 6);
  scene.add(light);
  const camera = new THREE.OrthographicCamera(
    -1.3,
    1.3,
    1.625,
    -1.625,
    0.1,
    30,
  );
  camera.position.set(3, 2.8, 7);
  camera.lookAt(0, 1.4, 0);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  const pixels = new Uint8Array(256 * 320 * 4);
  const data = ctx.createImageData(256, 320);
  /** @type {Record<string, string>} */
  const portraits = {};
  try {
    for (const agent of AGENTS) {
      scene.background = new THREE.Color(agent.color).multiplyScalar(0.12);
      const actor = makeCharacter(
        assets,
        agent.gender === "여성" ? "female" : "male",
        agent.color,
        false,
        agent.id,
      );
      scene.add(actor.group);
      animateCharacter(actor, false, 0.016);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.readRenderTargetPixels(target, 0, 0, 256, 320, pixels);
      for (let y = 0; y < 320; y++)
        data.data.set(
          pixels.subarray((319 - y) * 1024, (320 - y) * 1024),
          y * 1024,
        );
      ctx.putImageData(data, 0, 0);
      portraits[agent.id] = canvas.toDataURL("image/webp", 0.85);
      scene.remove(actor.group);
      dispose(actor.group);
    }
  } finally {
    renderer.setRenderTarget(previous);
    target.dispose();
  }
  return portraits;
}
