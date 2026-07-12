import { NextResponse, type NextRequest } from 'next/server';

const subdomainRoutes: Record<string, string> = {
  'admin.thefox.app': '/admin',
  'vendor.thefox.app': '/vendor',
  'driver.thefox.app': '/driver'
};

const workspaceSubdomains: Record<string, string> = {
  '/admin': 'admin.thefox.app',
  '/vendor': 'vendor.thefox.app',
  '/driver': 'driver.thefox.app'
};

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  const workspaceRoute = host ? subdomainRoutes[host] : undefined;
  const canonicalWorkspaceHost = workspaceSubdomains[request.nextUrl.pathname];

  if ((host === 'thefox.app' || host === 'www.thefox.app') && canonicalWorkspaceHost) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = canonicalWorkspaceHost;
    url.port = '';
    url.pathname = '/';
    return NextResponse.redirect(url, 308);
  }

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
