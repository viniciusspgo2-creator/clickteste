import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Gift } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { BONUS_TOOLS, LIBRARY_URL } from "@/lib/studio-links";
import { BonusTool } from "@/components/tools/bonus-tool";
export async function generateMetadata({params}:{params:Promise<{tool:string}>}){const {tool}=await params;return {title:BONUS_TOOLS.find(t=>t.id===tool)?.title || "Bônus gratuitos"};}
export default async function ToolPage({params}:{params:Promise<{tool:string}>}){
 const {tool}=await params;const meta=BONUS_TOOLS.find(t=>t.id===tool);if(!meta)notFound();
 return <div className="cg-tool-shell min-h-screen"><Header/><main className="cg-container cg-tool-wrapper"><Link href="/bonus" className="cg-eyebrow"><ArrowLeft size={16}/> TODOS OS BÔNUS GRATUITOS</Link><div className="mt-7 cg-eyebrow"><Gift size={15}/> FERRAMENTA BÔNUS · 100% GRÁTIS</div><h1 className="cg-display cg-tool-title">{meta.title}</h1><p className="mt-4 mb-9 text-sm leading-relaxed text-neutral-400">{meta.description}</p><BonusTool tool={meta.id}/><div className="mt-14 rounded-2xl border border-orange-500/25 bg-orange-500/5 px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h2 className="font-bold text-white">Conhece a Biblioteca de Artes Click & Gruda?</h2><p className="mt-1 text-xs text-neutral-400">Acesso vitalício por R$ 47,90 e Studio Mockup 3D incluso para assinantes.</p></div><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-primary">Conhecer a Biblioteca <ArrowUpRight size={16}/></a></div></main><Footer/></div>;
}
