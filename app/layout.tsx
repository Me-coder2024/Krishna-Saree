import type {Metadata} from 'next';
import './globals.css';
import {Providers} from '@/components/providers';
import {Chrome} from '@/components/chrome';
import {settings} from '@/lib/data';
import {brand} from '@/lib/catalog';
export const dynamic='force-dynamic';
export async function generateMetadata():Promise<Metadata>{const s=await settings();return {metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:{default:`${brand} | Tradition, beautifully yours`,template:`%s | ${brand}`},description:'Discover thoughtfully selected sarees, timeless silk drapes and readymade favourites at Krishna Sarees And Readymade.',icons:{icon:s.favicon_url||'/favicon.svg'},openGraph:{title:brand,description:'Woven with tradition. Worn with love.',type:'website'}};}
export default async function RootLayout({children}:{children:React.ReactNode}){const store=await settings();return <html lang="en"><body><a href="#main-content" className="skip-link">Skip to content</a><Providers><Chrome settings={store}>{children}</Chrome></Providers></body></html>;}
