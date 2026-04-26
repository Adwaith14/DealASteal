import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { tryGetNextPublicSupabaseConfig } from '@/lib/supabase/next-public-env';

export async function middleware(request: NextRequest) {
  const config = tryGetNextPublicSupabaseConfig();
  if (!config) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      login.search = '';
      const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
      login.searchParams.set('next', nextPath.startsWith('/') ? nextPath : '/admin');
      return NextResponse.redirect(login);
    }
  }

  const country =
    request.headers.get('x-vercel-ip-country')?.trim().toUpperCase().slice(0, 2) ||
    request.headers.get('cf-ipcountry')?.trim().toUpperCase().slice(0, 2) ||
    '';
  if (country.length === 2) {
    supabaseResponse.cookies.set('das_country', country, {
      path: '/',
      maxAge: 60 * 60 * 24,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image optimization.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
