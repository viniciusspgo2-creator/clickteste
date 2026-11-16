"use client";
import dynamic from "next/dynamic";
import { PremiumGate } from "@/components/site/premium-gate";

const CompositionEditor = dynamic(
  () => import("@/components/studio-mockup-2d/composition-editor").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-screen place-items-center bg-[#101014] text-[#f5f5f5]">
        Preparando o Editor Mockup 2D…
      </div>
    ),
  },
);

export default function StudioMockup2DPage() {
  return <PremiumGate title="Studio Mockup 2D" backHref="/"><CompositionEditor /></PremiumGate>;
}
