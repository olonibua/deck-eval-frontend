import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'de_session';
const PUBLIC_PATHS = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession && !PUBLIC_PATHS.includes(pathname)) {
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|.*\\.(?:png|svg|ico|webp)$).*)'],
};
