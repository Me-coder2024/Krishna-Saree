import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {collections} from '@/lib/catalog';
import {catalog} from '@/lib/data';
import {Shop} from '@/components/shop';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:collections.find(c=>c.slug===slug)?.name||'Collection'};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!collections.some(c=>c.slug===slug))notFound();const data=await catalog();return <Suspense><Shop initialProducts={data.products} demo={data.demo} collection={slug}/></Suspense>;}
