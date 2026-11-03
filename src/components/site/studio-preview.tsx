"use client";
import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  OrbitControls,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { buildModel } from "@/components/tools/mockup/scene/model-geometry";
import { createCeramicMaterial } from "@/components/tools/mockup/scene/ceramic-material";
import {
  renderArtCanvas,
  makeArtTexture,
  canvasHeightFor,
} from "@/components/tools/mockup/lib/art-canvas";
import { useMockupStore } from "@/components/tools/mockup/state/store";
function Product() {
  const model = useMemo(() => buildModel("classic"), []);
  const material = useMemo(() => {
    const state = useMockupStore.getState();
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = canvasHeightFor(2048);
    renderArtCanvas(
      canvas,
      {
        ...state.art,
        imageId: null,
        text: "CRIE. INSPIRE. ENCANTE.",
        textColor: "#f9eee2",
        textSize: 38,
      },
      { ...state.mug, bodyColor: "#174e44" },
    );
    const texture = makeArtTexture(canvas, 8);
    return createCeramicMaterial(
      { ...state.mug, glazeStrength: 1.6 },
      { map: texture },
    );
  }, []);
  const handle = useMemo(
    () =>
      createCeramicMaterial(
        { ...useMockupStore.getState().mug, glazeStrength: 1.6 },
        { color: "#f1e3cf" },
      ),
    [],
  );
  useEffect(
    () => () => {
      model.body.dispose();
      model.handle.dispose();
      model.basePrint.dispose();
      material.map?.dispose();
      material.dispose();
      handle.dispose();
    },
    [model, material, handle],
  );
  return (
    <group position={[0, -4.5, 0]} rotation={[0.05, 1, -0.07]}>
      <mesh geometry={model.body} material={material} castShadow />
      <mesh geometry={model.handle} material={handle} castShadow />
    </group>
  );
}
export default function Preview() {
  return (
    <Canvas
      camera={{ position: [0, 6, 29], fov: 36 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 10]} intensity={2} />
      <Product />
      <Environment resolution={256}>
        <Lightformer
          intensity={4}
          position={[-5, 3, 5]}
          scale={[1.5, 12, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          intensity={2}
          position={[5, 7, -3]}
          scale={[8, 4, 1]}
          target={[0, 0, 0]}
        />
      </Environment>
      <ContactShadows
        position={[0, -4.8, 0]}
        scale={30}
        opacity={0.5}
        blur={2.5}
        far={15}
      />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.65}
        minPolarAngle={0.8}
        maxPolarAngle={1.6}
      />
    </Canvas>
  );
}
