const fs = require('fs');
const crypto = require('crypto');
const env = {
  ...process.env,
  ...(fs.existsSync('.env.local') ? Object.fromEntries(fs.readFileSync('.env.local','utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')).trim(),x.slice(x.indexOf('=')+1).trim()])) : {})
};

(async () => {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SECRET_KEY) {
    for (const table of ['products', 'store_settings', 'admin_profiles']) {
      try {
        const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
          headers: { apikey: env.SUPABASE_SECRET_KEY },
          signal: AbortSignal.timeout(15000)
        });
        const d = await r.json();
        console.log('Supabase', table, r.status, r.ok ? `rows: ${d.length}` : (d.message || d.error));
      } catch (e) {
        console.log('Supabase', table, e.message);
      }
    }
  } else {
    console.log('Supabase credentials not configured in environment.');
  }

  if (env.GROQ_API_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
        signal: AbortSignal.timeout(15000)
      });
      console.log('Groq credentials', r.status);
    } catch (e) {
      console.log('Groq', e.message);
    }
  } else {
    console.log('GROQ_API_KEY not configured in environment.');
  }

  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try {
      const r = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/ping`, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString('base64') },
        signal: AbortSignal.timeout(15000)
      });
      const d = await r.json();
      console.log('Cloudinary', r.status, d.status || d.error?.message);
    } catch (e) {
      console.log('Cloudinary', e.message);
    }
  } else {
    console.log('Cloudinary credentials not configured in environment.');
  }
})();
