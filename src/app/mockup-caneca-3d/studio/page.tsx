"use client";
import dynamic from "next/dynamic";
import { PremiumGate } from "@/components/site/premium-gate";
import "./studio-page.css";
const Studio = dynamic(() => import("@/components/tools/mockup/mockup-studio").then(m => m.MockupStudio), { ssr: false, loading: () => <div className="cg-studio-loading grid min-h-screen place-items-center bg-[#f5f4f1] font-medium text-[#555]">Preparando seu estúdio 3D…</div> });
export default function StudioPage() {
  return <div className="cg-studio-page"><PremiumGate><Studio /></PremiumGate></div>;
}
