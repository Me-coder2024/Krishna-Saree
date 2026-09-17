import {Suspense} from 'react';
import {Shop} from '@/components/shop';
import {catalog} from '@/lib/data';
export const metadata={title:'Shop sarees'};
export const dynamic='force-dynamic';
export default async function Page(){const data=await catalog();return <Suspense fallback={<p className="container">Opening the collection…</p>}><Shop initialProducts={data.products} demo={data.demo}/></Suspense>;}
