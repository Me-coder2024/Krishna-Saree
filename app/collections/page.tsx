import Link from 'next/link';
import {collections} from '@/lib/catalog';
import {Art} from '@/components/art';
export const metadata={title:'Our collections'};
export default function Page(){return <><div className="page-title"><span className="eyebrow">A WORLD OF BEAUTIFUL DRAPES</span><h1>The Krishna collections</h1><p>For your celebrations, your traditions, and your everyday.</p></div><div className="container collection-grid section">{collections.map(c=><Link key={c.slug} href={`/collections/${c.slug}`} className="collection-card"><Art index={c.art} alt={c.name}/><div className="collection-copy"><small>{c.tag}</small><h3>{c.name}</h3><span>EXPLORE THE EDIT ↗</span></div></Link>)}</div></>;}
