import {catalog} from '@/lib/data';
import {collections,articles} from '@/lib/catalog';
export default async function sitemap(){const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';const {products}=await catalog();return ['','/shop','/collections','/about','/contact','/blog',...collections.map(c=>`/collections/${c.slug}`),...articles.map(a=>`/blog/${a.slug}`),...products.map(p=>`/product/${p.slug}`)].map(path=>({url:base+path,lastModified:new Date()}));}
