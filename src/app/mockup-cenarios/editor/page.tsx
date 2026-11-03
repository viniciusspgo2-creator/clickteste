"use client";
import dynamic from "next/dynamic";
import { PremiumGate } from "@/components/site/premium-gate";
const Editor = dynamic(
  () =>
    import("@/components/tools/mockup-scenes/editor").then(
      (m) => m.ScenesEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-screen place-items-center bg-[#f4f5ef] text-[#49613f]">
        Preparando seus cenários…
      </div>
    ),
  },
);
export default function ScenesEditorPage() {
  return (
    <PremiumGate title="Mockup de Cenários" backHref="/mockup-cenarios">
      <Editor />
    </PremiumGate>
  );
}
