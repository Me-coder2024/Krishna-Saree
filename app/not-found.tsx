import Link from 'next/link';
export default function NotFound(){return <div className="empty-state"><span className="ornament">✽</span><h1>A little off the beaten path.</h1><p>We couldn’t find this page.</p><Link href="/shop" className="button">BACK TO THE COLLECTION</Link></div>;}
