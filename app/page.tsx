import {Home} from '@/components/home';
import {catalog,settings} from '@/lib/data';
export const dynamic='force-dynamic';
export default async function Page(){const [data,store]=await Promise.all([catalog(),settings()]);return <Home products={data.products} demo={data.demo} settings={store}/>;}
