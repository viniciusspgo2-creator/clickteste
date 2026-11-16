import 'server-only';
import {headers} from 'next/headers';
import {checkPremiumSession} from '@/lib/premium-session';
/** Bônus exclusivos: trial/visitante não recebem acesso, mesmo com código válido de 7 dias. */
export async function paidBonusAllowed(){
  const request=new Request('http://localhost/bonus',{headers:await headers()});
  const access=await checkPremiumSession(request);
  return access.ok && (access.plan==='Biblioteca Click Gruda'||access.plan==='Admin Master');
}
