"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, X } from "lucide-react";
import { LIBRARY_URL } from "@/lib/studio-links";
import { MOCKUP_SCENES_ENABLED } from "@/lib/features";

const nav = [
  { href: "/#inicio", label: "Início" },
  { href: "/#biblioteca", label: "Biblioteca de Artes" },
  { href: "/#studio", label: "Studio 3D" },
  ...(MOCKUP_SCENES_ENABLED ? [{ href: "/mockup-cenarios", label: "Mockup de Cenários" }] : []),
  { href: "/blog", label: "Blog" },
  { href: "/bonus", label: "Bônus grátis" },
  { href: "/#acessos", label: "Seu acesso" },
];
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="cg-header">
    <div className="cg-container cg-nav-bar">
      <Link href="/" className="cg-header-logo" aria-label="Click & Gruda — início" onClick={() => setMenuOpen(false)}>
        <Image src="/cg-home/logo-clickgruda.webp" alt="Click & Gruda" width={175} height={44} priority className="object-contain" />
      </Link>
      <nav className="cg-desktop-nav" aria-label="Navegação principal">
        {nav.map((item) => <Link key={item.label} href={item.href}>{item.label}</Link>)}
      </nav>
      <div className="cg-nav-actions">
        <Link className="cg-header-cta" href="/mockup-caneca-3d/studio">Entrar no Studio <ArrowUpRight size={16}/></Link>
        <button className="cg-menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(v=>!v)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
    </div>
    {menuOpen && <nav className="cg-mobile-nav" aria-label="Navegação para celular">{nav.map((item) => <Link onClick={()=>setMenuOpen(false)} key={item.label} href={item.href}>{item.label}<ArrowRight size={16}/></Link>)}<a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer">Biblioteca completa <ArrowUpRight size={16}/></a></nav>}
  </header>;
}
