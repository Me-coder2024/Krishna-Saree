const fs = require('fs'), ts = require('typescript'), Module = require('module');
const env = {
  ...process.env,
  ...(fs.existsSync('.env.local') ? Object.fromEntries(fs.readFileSync('.env.local','utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')).trim(),x.slice(x.indexOf('=')+1).trim()])) : {})
};

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY not found in environment.');
  process.exit(1);
}

const compiled = new Module('catalog');
compiled._compile(ts.transpileModule(fs.readFileSync('lib/catalog.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, 'catalog.js');

(async () => {
  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/products?on_conflict=slug`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(compiled.exports.samples.map(p => ({ ...p, is_active: false }))),
    signal: AbortSignal.timeout(20000)
  });
  console.log('Seed archived samples:', r.status);
  if (!r.ok) console.log(await r.text());
})();
