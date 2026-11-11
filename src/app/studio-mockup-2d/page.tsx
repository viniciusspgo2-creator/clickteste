"use client";
import dynamic from "next/dynamic";

const StudioMockup2DEditor = dynamic(
  () =>
    import("@/components/studio-mockup-2d/editor").then((m) => m.StudioMockup2DEditor),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-screen place-items-center bg-[#101014] text-[#f5f5f5]">
        Preparando o Studio Mockup 2D…
      </div>
    ),
  },
);

export default function StudioMockup2DPage() {
  return <StudioMockup2DEditor />;
}
