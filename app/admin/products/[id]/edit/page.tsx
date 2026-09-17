import {ProductEditor} from '@/components/admin';
export default async function Page({params}:{params:Promise<{id:string}>}){return <ProductEditor id={(await params).id}/>;}
