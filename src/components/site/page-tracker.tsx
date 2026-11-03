'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPage } from '@/lib/track';

/** Registra pageviews das rotas reais (/blog, / etc.) — ferramentas SPA são
 *  registradas pelo tools-store. */
export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) trackPage(pathname);
  }, [pathname]);

  return null;
}
