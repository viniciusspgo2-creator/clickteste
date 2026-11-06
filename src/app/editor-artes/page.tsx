import type {Metadata} from 'next';
import {PremiumGate} from '@/components/site/premium-gate';
import {EditorWelcome} from '@/components/creative/editor-welcome';
export const metadata:Metadata={title:'Comece por aqui | Studio Click',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const query=new URLSearchParams();
 for(const [key,value] of Object.entries(await searchParams)){
  if(Array.isArray(value))value.forEach(v=>query.append(key,v));else if(value!==undefined)query.set(key,value);
 }
 const suffix=query.toString();
 return <PremiumGate title="Editor de Artes"><EditorWelcome editorHref={`/editor-artes/editor${suffix?'?'+suffix:''}`}/></PremiumGate>;
}
