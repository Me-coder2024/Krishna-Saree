import 'server-only';
const buckets=new Map<string,{n:number;until:number}>();
export function limited(key:string,max=20){const now=Date.now();if(buckets.size>10000)for(const [k,v]of buckets)if(v.until<now)buckets.delete(k);const b=buckets.get(key);if(!b||b.until<now){buckets.set(key,{n:1,until:now+60000});return false;}return ++b.n>max;}
