"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { GroundedSkybox } from "three/examples/jsm/objects/GroundedSkybox.js";
import { MathUtils } from "three";
import { useMockupStore } from "../state/store";
import { getEnvironment } from "../lib/environment-registry";
import { studioRefs } from "./studio-refs";

/** Real perspective and a projected support surface, separate from the print. */
export function PanoramaBackdrop() {
  const bg = useMockupStore(s => s.bg);
  const hdriId = useMockupStore(s => s.light.hdriId);
  const scene = useThree(s=>s.scene);
  const camera = useThree(s=>s.camera);
  const environment = getEnvironment(hdriId);
  const active = bg.panorama && bg.type === "studio-white" && !!environment;
  const height = MathUtils.clamp(bg.panoramaHeight ?? 45, 10, 120);
  const skybox = useMemo(() => {
    if (!environment) return null;
    const mesh = new GroundedSkybox(environment.texture, height, 1200, 64);
    mesh.name = "environment-backdrop";
    mesh.position.y = height - .03;
    mesh.renderOrder = -1000;
    mesh.frustumCulled = false;
    mesh.layers.set(1);
    mesh.material.depthTest = false;
    mesh.visible = false;
    return mesh;
  }, [environment, height]);
  useEffect(() => {
    if (!skybox) return;
    scene.add(skybox); camera.layers.enable(1);
    return () => { scene.remove(skybox); skybox.geometry.dispose(); skybox.material.dispose(); };
  }, [skybox, scene, camera]);
  useFrame(() => {
    if (!skybox || studioRefs.exporting) return;
    // eslint-disable-next-line react-hooks/immutability -- Mutating a Three.js engine object in its frame loop.
    skybox.visible = !!active;
    // eslint-disable-next-line react-hooks/immutability -- Same mutable Three.js engine handle.
    skybox.rotation.y = MathUtils.degToRad(bg.panoramaRotation ?? 0);
  });
  return null;
}
