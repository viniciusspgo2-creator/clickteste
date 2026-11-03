import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MOCKUP_SCENES_ENABLED } from "@/lib/features";
export const metadata: Metadata = {
  title: { absolute: "Mockup de Cenários | Click & Gruda" },
};
export default function ScenesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!MOCKUP_SCENES_ENABLED) redirect("/");
  return children;
}
