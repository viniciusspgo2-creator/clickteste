"use client";
import dynamic from "next/dynamic";

const FixedMugEditor = dynamic(
  () => import("@/components/studio-mockup-2d/fixed-mug-editor").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-screen place-items-center bg-[#101014] text-[#f5f5f5]">
        Preparando a Caneca Fixa…
      </div>
    ),
  },
);

export default function StudioMockup2DFixedMugPage() {
  return <FixedMugEditor />;
}
