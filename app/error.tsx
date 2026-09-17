'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="empty-state"><h1>A small snag in the weave.</h1><p>Please try opening this page again.</p><button onClick={reset} className="button">TRY AGAIN</button></div>;}
