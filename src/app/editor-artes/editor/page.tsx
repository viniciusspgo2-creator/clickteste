import type {Metadata} from 'next';
import dynamic from 'next/dynamic';
import './editor-route.css';
import {PremiumGate} from '@/components/site/premium-gate';
export const metadata:Metadata={title:'Editor de Artes | Click & Gruda',robots:{index:false,follow:false}};
const Editor=dynamic(()=>import('@/components/creative/creative-editor').then(x=>x.CreativeEditor));
export default function Page(){return <div className="cr-editor-route"><PremiumGate title="Editor de Artes"><Editor/></PremiumGate></div>}
