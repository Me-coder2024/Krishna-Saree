const fs = require('fs');
const env = {
  ...process.env,
  ...(fs.existsSync('.env.local') ? Object.fromEntries(fs.readFileSync('.env.local','utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')).trim(),x.slice(x.indexOf('=')+1).trim()])) : {})
};

(async () => {
  if (!env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY not found in environment.');
    process.exit(1);
  }
  const r = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` }
  });
  const d = await r.json();
  console.log(d.data?.filter(x => x.active).map(x => x.id) || d);
})();
