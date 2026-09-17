import {notFound} from 'next/navigation';
import {settings} from '@/lib/data';
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!['shipping','returns'].includes(slug))notFound();const s=await settings();return <article className="article section"><span className="eyebrow">HERE TO HELP</span><h1>{slug==='shipping'?'Shipping & delivery':'Returns & exchanges'}</h1><p>{slug==='shipping'?s.shipping_policy:s.returns_policy}</p></article>;}
