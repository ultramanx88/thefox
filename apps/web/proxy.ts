import { NextResponse, type NextRequest } from 'next/server';

const subdomainRoutes: Record<string, string> = {
  'admin.thefox.app': '/admin',
  'vendor.thefox.app': '/vendor',
  'driver.thefox.app': '/driver'
};

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  const workspaceRoute = host ? subdomainRoutes[host] : undefined;

  if (!workspaceRoute) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = workspaceRoute;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|brand/).*)']
};
