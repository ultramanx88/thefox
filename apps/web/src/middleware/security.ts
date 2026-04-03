import { NextRequest, NextResponse } from 'next/server';

export async function securityMiddleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

  // Security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000');

  // Rate limiting (simple implementation)
  const rateLimitKey = `${ip}:${pathname}`;
  // In production, use Redis or similar for rate limiting

  // Block suspicious patterns
  const suspiciousPatterns = [
    /script/i, /javascript/i, /eval/i, /union.*select/i, /\.\.\//g
  ];
  
  const url = request.url.toLowerCase();
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    return new NextResponse('Blocked', { status: 403 });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};