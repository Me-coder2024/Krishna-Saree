import {notFound} from 'next/navigation';
import {articles} from '@/lib/catalog';
import Link from 'next/link';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:articles.find(a=>a.slug===slug)?.title};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const a=articles.find(a=>a.slug===slug);if(!a)notFound();return <article className="article section"><Link href="/blog" className="text-link">← The journal</Link><span className="eyebrow">{a.category}</span><h1>{a.title}</h1><p>{a.body}</p><Link href="/shop" className="button">DISCOVER THE COLLECTION ↗</Link></article>;}
