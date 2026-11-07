import type {Metadata} from 'next';
import {PremiumGate} from '@/components/site/premium-gate';
import {GuruDetails} from '@/components/creative/guru-details';

export const metadata:Metadata={title:'Ferramentas Guru | Studio Click',robots:{index:false,follow:false}};

export default function Page(){return <PremiumGate title="Ferramentas Guru" backHref="/editor-artes"><GuruDetails/></PremiumGate>;}
