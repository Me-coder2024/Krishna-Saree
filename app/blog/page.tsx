import Link from 'next/link';
import {articles} from '@/lib/catalog';
import {Art} from '@/components/art';
export const metadata={title:'The journal'};
export default function Page(){return <><div className="page-title"><span className="eyebrow">NOTES FROM KRISHNA</span><h1>The fabric of everyday stories</h1><p>Styling notes, care rituals, and inspiration for your next drape.</p></div><section className="container journal-grid section">{articles.map((a,i)=><Link key={a.slug} href={`/blog/${a.slug}`}><Art index={[1,7,4][i]} alt={a.title}/><span className="eyebrow">{a.category}</span><h2>{a.title}</h2><span className="text-link">Read the story ↗</span></Link>)}</section></>;}
