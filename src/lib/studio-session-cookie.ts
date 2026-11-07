import type {NextResponse} from 'next/server';
import {ACCESS_COOKIE} from '@/lib/premium-session';

export function writeStudioCookie(response: NextResponse, req: Request, token: string, remember: boolean, until: Date) {
 response.cookies.set(ACCESS_COOKIE, `${remember?'p':'s'}.${token}`, {
  httpOnly:true, secure:new URL(req.url).protocol==='https:', sameSite:'strict', path:'/',
  ...(remember?{expires:until}:{}),
 });
}
export function clearStudioCookie(response:NextResponse,req:Request){
 response.cookies.set(ACCESS_COOKIE,'',{httpOnly:true,secure:new URL(req.url).protocol==='https:',sameSite:'strict',path:'/',maxAge:0});
}
