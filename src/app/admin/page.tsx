import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AdminApp } from '@/components/admin/admin-app';

export const metadata: Metadata = { title: 'Admin Mestre · Click & Gruda', robots: { index: false, follow: false } };

/** Compatibilidade: o painel antigo só permanece disponível quando SSO não está configurado. */
export default function AdminPage() {
  if (process.env.UNIFIED_SSO_SECRET && process.env.UNIFIED_SSO_SECRET.length >= 32) {
    const raw = process.env.PORTAL_SSO_ORIGIN || process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3000';
    let destination: string | null = null;
    try {
      const target = new URL(raw);
      if (target.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && target.hostname === 'localhost' && target.protocol === 'http:')) {
        destination = target.origin + '/';
      }
    } catch { /* configuração inválida: manter painel antigo para recuperação */ }
    if (destination) redirect(destination);
  }
  return <AdminApp />;
}
