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
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'Reply with hello.' }],
      max_tokens: 15
    })
  });
  const d = await r.json();
  console.log(r.status, JSON.stringify(d.error || d.choices?.[0]?.message));
})();
