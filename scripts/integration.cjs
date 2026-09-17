const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');

const env = {
  ...process.env,
  ...(fs.existsSync('.env.local') ? Object.fromEntries(fs.readFileSync('.env.local','utf8').replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')).trim(),x.slice(x.indexOf('=')+1).trim()])) : {})
};

const adminEmail = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
  console.log('Skipping integration test: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY not set.');
  process.exit(0);
}

const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const jar = new Map();
const session = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: items => items.forEach(c => jar.set(c.name, c.value))
  }
});

async function call(path, options = {}) {
  const r = await fetch('http://localhost:3000' + path, {
    ...options,
    headers: {
      Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
      ...options.headers
    },
    signal: AbortSignal.timeout(90000)
  });
  const d = await r.json();
  if (!r.ok) throw Error(path + ': ' + r.status + ' ' + JSON.stringify(d));
  return d;
}

(async () => {
  try {
    const { data, error } = await service.auth.admin.generateLink({
      type: 'magiclink',
      email: adminEmail
    });
    if (error) throw error;
    const verified = await session.auth.verifyOtp({
      token_hash: data.properties.hashed_token,
      type: 'magiclink'
    });
    if (verified.error) throw verified.error;

    for (const resource of ['products', 'categories', 'enquiries', 'settings', 'chats', 'events']) {
      const data = await call('/api/admin/' + resource);
      console.log('PASS authenticated read', resource, 'rows:', data.length);
    }
    const products = await call('/api/admin/products');
    if (products[0]) {
      await call('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products[0])
      });
      console.log('PASS product save (same archived draft)');
    }
    const categories = await call('/api/admin/categories');
    if (categories[0]) {
      await call('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categories[0])
      });
      console.log('PASS category save');
    }
    const form = new FormData();
    form.set('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'upload-verification.png');
    const uploaded = await call('/api/admin/upload', { method: 'POST', body: form });
    console.log('PASS signed Cloudinary image upload');

    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = crypto.createHash('sha1').update(`public_id=${uploaded.public_id}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`).digest('hex');
    const cleanup = new FormData();
    cleanup.set('public_id', uploaded.public_id);
    cleanup.set('timestamp', timestamp);
    cleanup.set('api_key', env.CLOUDINARY_API_KEY);
    cleanup.set('signature', signature);
    const removed = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body: cleanup
    });
    console.log('Temporary upload cleaned:', removed.ok);

    const marker = 'Development verification ' + crypto.randomUUID();
    const r = await fetch('http://localhost:3000/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: 'Development verification', email: 'qa@example.invalid', message: marker })
    });
    if (!r.ok) throw Error('Enquiry insert ' + r.status);
    const { data: lead, error: readError } = await service.from('enquiries').select('id').eq('message', marker).single();
    if (readError) throw readError;
    await call('/api/admin/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lead.id, status: 'closed' })
    });
    console.log('PASS enquiry persistence and admin status update (test lead marked closed)');
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await session.auth.signOut({ scope: 'local' });
  }
})();
