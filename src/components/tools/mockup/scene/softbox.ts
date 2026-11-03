import * as THREE from "three";

/** Feathered photographic light: no solid white line from lip to foot. */
export function createSoftboxTexture(width = 64, height = 128) {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const horizontal = Math.pow(Math.sin(Math.PI * x / (width - 1)), 0.7);
    const vertical = Math.pow(Math.sin(Math.PI * y / (height - 1)), 0.4);
    const value = Math.round(255 * horizontal * vertical), offset = (y * width + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = value;
    pixels[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = THREE.NoColorSpace;
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
