const assert=require('node:assert/strict');
const base=process.env.SMOKE_URL||'http://localhost:3000';
async function request(path,options={}){const r=await fetch(base+path,{redirect:'manual',...options,signal:AbortSignal.timeout(90000)});return r;}
(async()=>{
let checks=0;
for(const path of ['/','/shop','/collections','/collections/wedding-edit','/product/gulab-banarasi-silk','/about','/contact','/blog','/blog/caring-for-your-silk','/cart','/checkout','/admin/login','/policies/shipping','/sitemap.xml','/robots.txt']){const r=await request(path);assert.equal(r.status,200,path);const html=await r.text();assert(!html.includes('gsk_')&&!html.includes('sb_secret_'),'No secrets in '+path);console.log('PASS',path);checks++;}
for(const path of ['/admin','/admin/products','/admin/settings']){const r=await request(path);assert([302,307].includes(r.status),path);assert(r.headers.get('location').endsWith('/admin/login'));console.log('PASS protected',path);checks++;}
for(const [path,body] of [['/api/admin/products',{}],['/api/admin/upload',{}]]){const r=await request(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,401);console.log('PASS denied',path);checks++;}
for(const path of ['/api/enquiries','/api/orders','/api/chat','/api/events']){const r=await request(path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,400,path);console.log('PASS validation',path);checks++;}
const missing=await request('/product/no-such-product');assert.equal(missing.status,404);console.log('PASS missing product');checks++;
if(process.env.SMOKE_CHAT==='1'){const r=await request('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_id:crypto.randomUUID(),messages:[{role:'user',content:'This is a development test. Can you explain the difference between silk and linen sarees in two sentences?'}]})});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));assert(d.reply.length>20);console.log('PASS live Groq response; conversation logged:',d.logged);checks++;}
console.log(`${checks} smoke checks passed.`);
})().catch(e=>{console.error(e);process.exit(1)});
