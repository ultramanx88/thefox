import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const locales = new Set(['th', 'en', 'zh', 'ja', 'ko']);

export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return NextResponse.next();

  // If path starts with a locale (or multiple locale segments), redirect to root
  if (locales.has(segments[0])) {
    if (segments.length === 1) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    // e.g. /th/en/... or /en/th
    if (segments.slice(0, 2).every((s) => locales.has(s))) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)'],
};


