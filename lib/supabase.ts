import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

const adminCache = new Map<string, number>();

export function markAdminCache(userId: string) {
  adminCache.set(userId, Date.now() + 5 * 60 * 1000);
}

export function isCachedAdmin(userId: string): boolean {
  const expires = adminCache.get(userId);
  if (expires && expires > Date.now()) return true;
  if (expires) adminCache.delete(userId);
  return false;
}

export function parseJwtFromCookies(jar: { getAll: () => { name: string; value: string }[] }): { sub?: string; exp?: number } | null {
  try {
    const all = jar.getAll();
    const authCookie = all.find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
    if (!authCookie) return null;
    let str = authCookie.value;
    if (str.startsWith('base64-')) {
      str = Buffer.from(str.slice(7), 'base64').toString('utf8');
    }
    const parsed = JSON.parse(str);
    const token = typeof parsed === 'string' ? parsed : (parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null));
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return payload;
  } catch {
    return null;
  }
}

export function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function sessionClient() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {}
      }
    }
  });
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const jwt = parseJwtFromCookies(jar);
  if (jwt?.sub && jwt.exp && jwt.exp * 1000 > Date.now()) {
    if (isCachedAdmin(jwt.sub)) return true;
  }

  const client = await sessionClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;

  if (isCachedAdmin(user.id)) return true;

  const { data } = await client.from('admin_profiles').select('role').eq('id', user.id).single();
  if (data?.role === 'admin') {
    markAdminCache(user.id);
    return true;
  }
  return false;
}
