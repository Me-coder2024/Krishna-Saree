const fs = require('fs');
const env = {
  ...process.env,
  ...(fs.existsSync('.env.local') ? Object.fromEntries(fs.readFileSync('.env.local','utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')).trim(),x.slice(x.indexOf('=')+1).trim()])) : {})
};

const adminEmail = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();

(async () => {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
    process.exit(1);
  }

  const headers = {
    apikey: env.SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
    'Content-Type': 'application/json'
  };

  let user;
  for (let page = 1; page <= 20; page++) {
    const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=100`, { headers });
    if (!r.ok) throw Error('Cannot read Auth users: ' + r.status);
    const data = await r.json();
    user = data.users?.find(u => u.email?.toLowerCase() === adminEmail);
    if (user || !data.users?.length || data.users.length < 100) break;
  }

  if (!user) {
    console.log(`The requested admin email (${adminEmail}) does not exist in Supabase Auth yet.`);
    return;
  }

  const r = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_profiles?on_conflict=id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: user.id, full_name: 'Store administrator', role: 'admin' })
  });

  console.log(`Admin access for ${adminEmail}:`, r.status, r.ok ? 'granted' : 'failed');
})();
