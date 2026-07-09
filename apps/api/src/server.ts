import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { ProductSchema } from '@thefox/shared';

type LineTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: 'Bearer';
};

type LineProfileResponse = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: 'Bearer';
};

type GoogleUserInfoResponse = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

type AuthSessionPayload = {
  provider: 'line' | 'google';
  providerUserId: string;
  displayName: string;
  pictureUrl: string | null;
  email: string | null;
  role: 'customer' | 'vendor' | 'driver' | 'admin' | 'superadmin';
  issuedAt: string;
};

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info'
  }
});

await app.register(helmet);
await app.register(cors, {
  origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  credentials: true
});

app.get('/health', async () => ({
  ok: true,
  service: 'thefox-api',
  version: '0.1.0'
}));

const cookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'Lax',
  secure: process.env.NODE_ENV === 'production'
};

const lineConfig = {
  channelId: process.env.LINE_CHANNEL_ID,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  redirectUri: process.env.LINE_REDIRECT_URI ?? 'http://localhost:4000/v1/auth/line/callback',
  webSuccessUrl: process.env.WEB_AUTH_SUCCESS_URL ?? 'http://localhost:3000/auth/continue',
  webFailureUrl: process.env.WEB_AUTH_FAILURE_URL ?? 'http://localhost:3000/?auth=failed'
};

const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/v1/auth/google/callback',
  webSuccessUrl: process.env.WEB_AUTH_SUCCESS_URL ?? 'http://localhost:3000/auth/continue',
  webFailureUrl: process.env.WEB_AUTH_FAILURE_URL ?? 'http://localhost:3000/?auth=failed'
};

const sessionSecret = process.env.AUTH_SESSION_SECRET;
const superadminEmail = process.env.THEFOX_SUPERADMIN_EMAIL;

function parseCookies(cookieHeader: string | undefined) {
  return Object.fromEntries(
    (cookieHeader ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...value] = part.split('=');
        return [decodeURIComponent(name ?? ''), decodeURIComponent(value.join('='))];
      })
  );
}

function serializeCookie(name: string, value: string, options: typeof cookieOptions & { maxAge?: number }) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, `Path=${options.path}`, `SameSite=${options.sameSite}`];

  if (options.httpOnly) {
    parts.push('HttpOnly');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  if (options.maxAge) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  return parts.join('; ');
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: AuthSessionPayload) {
  if (!sessionSecret) {
    throw new Error('AUTH_SESSION_SECRET is required');
  }

  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', sessionSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyPayload(token: string): AuthSessionPayload | null {
  if (!sessionSecret) {
    return null;
  }

  const [body, signature] = token.split('.');

  if (!body || !signature) {
    return null;
  }

  const expected = createHmac('sha256', sessionSecret).update(body).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return JSON.parse(base64UrlDecode(body)) as AuthSessionPayload;
}

function decodeJwtPayload(token: string | undefined) {
  if (!token) {
    return {};
  }

  const [, body] = token.split('.');

  if (!body) {
    return {};
  }

  return JSON.parse(base64UrlDecode(body)) as { email?: string };
}

function resolveRole(email: string | null): AuthSessionPayload['role'] {
  return email && superadminEmail && email.toLowerCase() === superadminEmail.toLowerCase() ? 'superadmin' : 'customer';
}

app.get('/v1/auth/line/start', async (request, reply) => {
  if (!lineConfig.channelId || !lineConfig.channelSecret || !sessionSecret) {
    return reply.code(503).send({
      error: 'LINE_AUTH_NOT_CONFIGURED',
      message: 'LINE auth requires LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, and AUTH_SESSION_SECRET'
    });
  }

  const state = randomBytes(24).toString('base64url');
  const authorizeUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');

  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', lineConfig.channelId);
  authorizeUrl.searchParams.set('redirect_uri', lineConfig.redirectUri);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('scope', 'profile openid email');

  reply.header('Set-Cookie', serializeCookie('thefox_oauth_state', state, { ...cookieOptions, path: '/v1/auth/line', maxAge: 600 }));
  return reply.redirect(authorizeUrl.toString());
});

app.get('/v1/auth/line/callback', async (request, reply) => {
  const query = request.query as { code?: string; state?: string; error?: string; error_description?: string };
  const cookies = parseCookies(request.headers.cookie);

  if (query.error) {
    const failureUrl = new URL(lineConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', query.error);
    return reply.redirect(failureUrl.toString());
  }

  if (!query.code || !query.state || query.state !== cookies.thefox_oauth_state) {
    const failureUrl = new URL(lineConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', 'state_mismatch');
    return reply.redirect(failureUrl.toString());
  }

  if (!lineConfig.channelId || !lineConfig.channelSecret || !sessionSecret) {
    return reply.code(503).send({ error: 'LINE_AUTH_NOT_CONFIGURED' });
  }

  const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: query.code,
      redirect_uri: lineConfig.redirectUri,
      client_id: lineConfig.channelId,
      client_secret: lineConfig.channelSecret
    })
  });

  if (!tokenResponse.ok) {
    request.log.warn({ status: tokenResponse.status }, 'LINE token exchange failed');
    const failureUrl = new URL(lineConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', 'token_exchange_failed');
    return reply.redirect(failureUrl.toString());
  }

  const token = (await tokenResponse.json()) as LineTokenResponse;
  const profileResponse = await fetch('https://api.line.me/v2/profile', {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });

  if (!profileResponse.ok) {
    request.log.warn({ status: profileResponse.status }, 'LINE profile fetch failed');
    const failureUrl = new URL(lineConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', 'profile_fetch_failed');
    return reply.redirect(failureUrl.toString());
  }

  const profile = (await profileResponse.json()) as LineProfileResponse;
  const idTokenPayload = decodeJwtPayload(token.id_token);
  const email = idTokenPayload.email ?? null;
  const session = signPayload({
    provider: 'line',
    providerUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? null,
    email,
    role: resolveRole(email),
    issuedAt: new Date().toISOString()
  });

  reply.headers({
    'Set-Cookie': [
      serializeCookie('thefox_auth_session', session, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 }),
      serializeCookie('thefox_oauth_state', '', { ...cookieOptions, path: '/v1/auth/line', maxAge: 1 })
    ]
  });

  const successUrl = new URL(lineConfig.webSuccessUrl);
  successUrl.searchParams.set('auth', 'line');
  return reply.redirect(successUrl.toString());
});

app.get('/v1/auth/google/start', async (_request, reply) => {
  if (!googleConfig.clientId || !googleConfig.clientSecret || !sessionSecret) {
    return reply.code(503).send({
      error: 'GOOGLE_AUTH_NOT_CONFIGURED',
      message: 'Google auth requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and AUTH_SESSION_SECRET'
    });
  }

  const state = randomBytes(24).toString('base64url');
  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', googleConfig.clientId);
  authorizeUrl.searchParams.set('redirect_uri', googleConfig.redirectUri);
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('access_type', 'offline');
  authorizeUrl.searchParams.set('prompt', 'select_account');

  reply.header('Set-Cookie', serializeCookie('thefox_google_oauth_state', state, { ...cookieOptions, path: '/v1/auth/google', maxAge: 600 }));
  return reply.redirect(authorizeUrl.toString());
});

app.get('/v1/auth/google/callback', async (request, reply) => {
  const query = request.query as { code?: string; state?: string; error?: string; error_description?: string };
  const cookies = parseCookies(request.headers.cookie);

  if (query.error) {
    const failureUrl = new URL(googleConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', query.error);
    return reply.redirect(failureUrl.toString());
  }

  if (!query.code || !query.state || query.state !== cookies.thefox_google_oauth_state) {
    const failureUrl = new URL(googleConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', 'state_mismatch');
    return reply.redirect(failureUrl.toString());
  }

  if (!googleConfig.clientId || !googleConfig.clientSecret || !sessionSecret) {
    return reply.code(503).send({ error: 'GOOGLE_AUTH_NOT_CONFIGURED' });
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: query.code,
      redirect_uri: googleConfig.redirectUri,
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret
    })
  });

  if (!tokenResponse.ok) {
    request.log.warn({ status: tokenResponse.status }, 'Google token exchange failed');
    const failureUrl = new URL(googleConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', 'token_exchange_failed');
    return reply.redirect(failureUrl.toString());
  }

  const token = (await tokenResponse.json()) as GoogleTokenResponse;
  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${token.access_token}`
    }
  });

  if (!profileResponse.ok) {
    request.log.warn({ status: profileResponse.status }, 'Google profile fetch failed');
    const failureUrl = new URL(googleConfig.webFailureUrl);
    failureUrl.searchParams.set('reason', 'profile_fetch_failed');
    return reply.redirect(failureUrl.toString());
  }

  const profile = (await profileResponse.json()) as GoogleUserInfoResponse;
  const email = profile.email ?? null;
  const session = signPayload({
    provider: 'google',
    providerUserId: profile.sub,
    displayName: profile.name ?? profile.email ?? 'Google user',
    pictureUrl: profile.picture ?? null,
    email,
    role: resolveRole(email),
    issuedAt: new Date().toISOString()
  });

  reply.headers({
    'Set-Cookie': [
      serializeCookie('thefox_auth_session', session, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 }),
      serializeCookie('thefox_google_oauth_state', '', { ...cookieOptions, path: '/v1/auth/google', maxAge: 1 })
    ]
  });

  const successUrl = new URL(googleConfig.webSuccessUrl);
  successUrl.searchParams.set('auth', 'google');
  return reply.redirect(successUrl.toString());
});

app.get('/v1/auth/me', async (request, reply) => {
  const cookies = parseCookies(request.headers.cookie);
  const session = cookies.thefox_auth_session ? verifyPayload(cookies.thefox_auth_session) : null;

  if (!session) {
    return reply.code(401).send({ error: 'UNAUTHENTICATED' });
  }

  return {
    user: {
      provider: session.provider,
      providerUserId: session.providerUserId,
      displayName: session.displayName,
      pictureUrl: session.pictureUrl,
      email: session.email,
      role: session.role
    }
  };
});

app.post('/v1/auth/logout', async (_request, reply) => {
  reply.header('Set-Cookie', serializeCookie('thefox_auth_session', '', { ...cookieOptions, maxAge: 1 }));
  return { ok: true };
});

app.get('/v1/products', async () => {
  const products = [
    ProductSchema.parse({
      id: 'morning-glory',
      name: 'ผักบุ้งจีนสด',
      price: 25,
      unit: 'กำ',
      category: 'ผักสด',
      imageUrl: 'https://picsum.photos/seed/veg1/640/480',
      vendorId: 'vendor-local-1',
      stock: 80,
      description: 'คัดจากตลาดเช้า ส่งถึงครัวในวันเดียว'
    })
  ];

  return { data: products };
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
