import type {Metadata} from 'next';
import { PremiumGate } from '@/components/site/premium-gate';
import { TemplateGallery } from '@/components/creative/template-gallery';
export const metadata:Metadata={title:'Studio Templates | Click & Gruda',robots:{index:false,follow:false}};
export default function Page(){return <PremiumGate title="Studio Templates"><TemplateGallery/></PremiumGate>}
