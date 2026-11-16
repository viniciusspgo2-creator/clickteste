import { redirect } from 'next/navigation'
export default function StudioHome(){
  redirect(process.env.NEXT_PUBLIC_PORTAL_URL || (process.env.NODE_ENV==='production'?'https://clickgruda.com.br':'http://localhost:3000'))
}
