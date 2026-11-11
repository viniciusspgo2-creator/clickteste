import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { STUDIO_MOCKUP_2D_ENABLED } from "@/lib/features";

export const metadata: Metadata = {
  title: { absolute: "Studio Click Mockup 2D | Click & Gruda" },
  description:
    "Projete sua arte 21 × 9,5 cm em canecas com warp cilíndrico, detecção de área e exportação em alta resolução.",
};

export default function StudioMockup2DLayout({ children }: { children: React.ReactNode }) {
  if (!STUDIO_MOCKUP_2D_ENABLED) redirect("/");
  return children;
}
