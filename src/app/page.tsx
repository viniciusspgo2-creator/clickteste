import { redirect } from "next/navigation";
import { StudioHome } from "@/components/site/studio-home";
import { BONUS_TOOLS } from "@/lib/studio-links";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool } = await searchParams;
  if (tool === "mockup") redirect("/mockup-caneca-3d/studio");
  if (BONUS_TOOLS.some((t) => t.id === tool)) redirect(`/bonus/${tool}`);
  if (tool && tool !== "inicio") redirect("/bonus");
  return <StudioHome />;
}
