import {createServerClient} from '@supabase/ssr';
import {NextResponse, type NextRequest} from 'next/server';

const middlewareAdminCache = new Map<string, number>();

function extractJwtSub(req: NextRequest): { sub?: string; exp?: number } | null {
  try {
    const cookies = req.cookies.getAll();
    const authCookie = cookies.find(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
    if (!authCookie) return null;
    let str = authCookie.value;
    if (str.startsWith('base64-')) {
      str = atob(str.slice(7));
    }
    const parsed = JSON.parse(str);
    const token = typeof parsed === 'string' ? parsed : (parsed.access_token || (Array.isArray(parsed) ? parsed[0] : null));
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  // 1. Immediately bypass /admin/login - zero latency
  if (req.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 2. Fast-path: check in-memory verified admin cache using JWT
  const jwt = extractJwtSub(req);
  if (jwt?.sub && jwt.exp && jwt.exp * 1000 > Date.now()) {
    const cachedExpires = middlewareAdminCache.get(jwt.sub);
    if (cachedExpires && cachedExpires > Date.now()) {
      return NextResponse.next({ request: req });
    }
  }

  // 3. Fallback: verify with Supabase and cache result
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: items => {
          items.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          items.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        }
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  let allowed = false;

  if (user) {
    const cachedExpires = middlewareAdminCache.get(user.id);
    if (cachedExpires && cachedExpires > Date.now()) {
      allowed = true;
    } else {
      const { data } = await supabase.from('admin_profiles').select('role').eq('id', user.id).single();
      allowed = data?.role === 'admin';
      if (allowed) {
        middlewareAdminCache.set(user.id, Date.now() + 5 * 60 * 1000);
      }
    }
  }

  if (!allowed) {
    if (req.nextUrl.pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Administrator access required.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return res;
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
