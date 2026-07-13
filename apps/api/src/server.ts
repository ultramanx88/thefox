import 'dotenv/config';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaClient, type BranchStatus, type Prisma, type TenantStatus, type UserRole } from '@prisma/client';
import { ProductSchema, RoleSchema } from '@thefox/shared';

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

type AdminUpdateUserRoleParams = {
  userId: string;
};

type AdminUpdateUserRoleBody = {
  role?: unknown;
};

type AdminCreateTenantBody = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  ownerUserId?: unknown;
  ownerRole?: unknown;
};

type AdminTenantParams = {
  tenantId: string;
};

type AdminUpdateTenantStatusBody = {
  status?: unknown;
};

type AdminCreateBranchBody = {
  name?: unknown;
  slug?: unknown;
  address?: unknown;
};

type AdminBranchParams = {
  branchId: string;
};

type AdminUpdateBranchStatusBody = {
  status?: unknown;
};

type AdminCreateMembershipBody = {
  userId?: unknown;
  role?: unknown;
};

type AdminAuditLogsQuery = {
  page?: unknown;
  pageSize?: unknown;
  action?: unknown;
  actorRole?: unknown;
  resourceType?: unknown;
  from?: unknown;
  to?: unknown;
};

type AuthSessionPayload = {
  provider: 'line' | 'google';
  providerUserId: string;
  userId: string;
  displayName: string;
  pictureUrl: string | null;
  email: string | null;
  issuedAt: string;
};

type MutationTokenPayload = {
  purpose: 'mutation';
  userId: string;
  role: UserRole;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
};

type AuthProvider = AuthSessionPayload['provider'];
type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;
type AuditContext = {
  action: string;
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  metadata?: Prisma.InputJsonValue | undefined;
};

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info'
  }
});
const prisma = new PrismaClient();

await app.register(helmet);
await app.register(cors, {
  origin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-TheFox-Mutation-Token']
});

app.addHook('onClose', async () => {
  await prisma.$disconnect();
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
  secure: process.env.NODE_ENV === 'production',
  domain: process.env.AUTH_COOKIE_DOMAIN
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
const superadminEmails = [
  ...(process.env.THEFOX_SUPERADMIN_EMAILS?.split(',') ?? []),
  ...(superadminEmail ? [superadminEmail] : [])
]
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const tenantStatuses = new Set<TenantStatus>(['pending', 'active', 'suspended']);
const branchStatuses = new Set<BranchStatus>(['pending', 'active', 'paused', 'closed']);
const vendorMembershipRoles = new Set(['owner', 'admin', 'member']);
const mutationTokenHeader = 'x-thefox-mutation-token';
const mutationTokenTtlMs = 15 * 60 * 1000;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalText(value: unknown) {
  const text = normalizeText(value);
  return text ? text : null;
}

function normalizeSlug(value: unknown) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeOptionalQuery(value: unknown) {
  const text = normalizeText(value);
  return text ? text.slice(0, 120) : '';
}

function parseBoundedInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(normalizeText(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function parseOptionalDate(value: unknown, boundary: 'start' | 'end' = 'start') {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(boundary === 'end' ? `${text}T23:59:59.999Z` : `${text}T00:00:00.000Z`);
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

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

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

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

function parseSignedJson<T>(body: string) {
  try {
    return JSON.parse(base64UrlDecode(body)) as T;
  } catch {
    return null;
  }
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

  return parseSignedJson<AuthSessionPayload>(body);
}

function signMutationToken(user: Pick<AuthenticatedUser, 'id' | 'role'>) {
  if (!sessionSecret) {
    throw new Error('AUTH_SESSION_SECRET is required');
  }

  const now = Date.now();
  const payload: MutationTokenPayload = {
    purpose: 'mutation',
    userId: user.id,
    role: user.role,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + mutationTokenTtlMs).toISOString(),
    nonce: randomBytes(18).toString('base64url')
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac('sha256', sessionSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyMutationToken(token: string | undefined, user: Pick<AuthenticatedUser, 'id' | 'role'>) {
  if (!sessionSecret || !token) {
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

  const payload = parseSignedJson<MutationTokenPayload>(body);

  if (!payload) {
    return null;
  }

  const expiresAt = Date.parse(payload.expiresAt);

  if (payload.purpose !== 'mutation' || payload.userId !== user.id || payload.role !== user.role || Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return payload;
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

function resolveBootstrapRole(email: string | null): UserRole {
  return email && superadminEmails.includes(email.toLowerCase()) ? 'superadmin' : 'customer';
}

function requestIpAddress(request: FastifyRequest) {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() ?? request.ip;
  }

  return request.ip;
}

function requestUserAgent(request: FastifyRequest) {
  const userAgent = request.headers['user-agent'];
  return Array.isArray(userAgent) ? userAgent.join(' ') : userAgent;
}

function mergeAuditMetadata(metadata: Prisma.InputJsonValue | undefined, extra: Record<string, Prisma.InputJsonValue>) {
  return {
    ...(metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {}),
    ...extra
  };
}

function mutationAuditMetadata(input: {
  operation: string;
  target?: Record<string, Prisma.InputJsonValue>;
  before?: Record<string, Prisma.InputJsonValue>;
  after?: Record<string, Prisma.InputJsonValue>;
  security?: Record<string, Prisma.InputJsonValue>;
  input?: Record<string, Prisma.InputJsonValue>;
}) {
  return {
    operation: input.operation,
    target: input.target ?? {},
    before: input.before ?? {},
    after: input.after ?? {},
    security: input.security ?? {},
    input: input.input ?? {}
  } satisfies Prisma.InputJsonObject;
}

function rateLimitKey(request: FastifyRequest, scope: string, user?: Pick<AuthenticatedUser, 'id'> | null) {
  return [scope, user?.id ?? 'anonymous', requestIpAddress(request)].join(':');
}

async function enforceRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  context: AuditContext & { actor?: Pick<AuthenticatedUser, 'id' | 'role'> | null; scope: string; limit: number; windowMs: number }
) {
  const now = Date.now();
  const key = rateLimitKey(request, context.scope, context.actor);
  const bucket = rateLimitBuckets.get(key);
  const nextBucket = !bucket || bucket.resetAt <= now ? { count: 1, resetAt: now + context.windowMs } : { count: bucket.count + 1, resetAt: bucket.resetAt };

  rateLimitBuckets.set(key, nextBucket);

  if (nextBucket.count <= context.limit) {
    reply.header('X-RateLimit-Limit', context.limit.toString());
    reply.header('X-RateLimit-Remaining', Math.max(context.limit - nextBucket.count, 0).toString());
    reply.header('X-RateLimit-Reset', Math.ceil(nextBucket.resetAt / 1000).toString());
    return true;
  }

  const retryAfter = Math.ceil((nextBucket.resetAt - now) / 1000);
  reply.header('Retry-After', retryAfter.toString());
  reply.header('X-RateLimit-Limit', context.limit.toString());
  reply.header('X-RateLimit-Remaining', '0');
  reply.header('X-RateLimit-Reset', Math.ceil(nextBucket.resetAt / 1000).toString());

  await writeAuditLog(request, {
    actor: context.actor,
    action: `${context.action}.rate_limited`,
    resourceType: context.resourceType,
    resourceId: context.resourceId,
    metadata: mergeAuditMetadata(context.metadata, {
      security: {
        control: 'rate_limit',
        scope: context.scope,
        limit: context.limit,
        windowMs: context.windowMs,
        retryAfter
      }
    })
  });

  reply.code(429).send({ error: 'RATE_LIMITED', retryAfter });
  return false;
}

async function writeAuditLog(request: FastifyRequest, context: AuditContext & { actor?: Pick<AuthenticatedUser, 'id' | 'role'> | null | undefined }) {
  try {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      action: context.action,
      route: request.url,
      method: request.method,
      ipAddress: requestIpAddress(request)
    };
    const userAgent = requestUserAgent(request);

    if (context.actor?.id) {
      data.actorUserId = context.actor.id;
      data.actorRole = context.actor.role;
    }

    if (context.resourceType) {
      data.resourceType = context.resourceType;
    }

    if (context.resourceId) {
      data.resourceId = context.resourceId;
    }

    if (userAgent) {
      data.userAgent = userAgent;
    }

    if (context.metadata) {
      data.metadata = context.metadata;
    }

    await prisma.auditLog.create({
      data
    });
  } catch (error) {
    request.log.warn({ error, action: context.action }, 'Failed to write audit log');
  }
}

async function upsertAuthenticatedUser(input: {
  provider: AuthProvider;
  providerUserId: string;
  displayName: string;
  pictureUrl: string | null;
  email: string | null;
}) {
  const bootstrapRole = resolveBootstrapRole(input.email);

  return prisma.$transaction(async (tx) => {
    const existingAccount = await tx.authAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: input.provider,
          providerUserId: input.providerUserId
        }
      },
      include: {
        user: true
      }
    });

    if (existingAccount) {
      return tx.user.update({
        where: {
          id: existingAccount.userId
        },
        data: {
          email: input.email ?? existingAccount.user.email,
          displayName: input.displayName,
          photoUrl: input.pictureUrl,
          role: existingAccount.user.role === 'superadmin' || bootstrapRole === 'superadmin' ? 'superadmin' : existingAccount.user.role
        }
      });
    }

    const existingUser = input.email
      ? await tx.user.findUnique({
          where: {
            email: input.email
          }
        })
      : null;

    const user = existingUser
      ? await tx.user.update({
          where: {
            id: existingUser.id
          },
          data: {
            displayName: input.displayName,
            photoUrl: input.pictureUrl,
            role: existingUser.role === 'superadmin' || bootstrapRole === 'superadmin' ? 'superadmin' : existingUser.role
          }
        })
      : await tx.user.create({
          data: {
            email: input.email,
            displayName: input.displayName,
            photoUrl: input.pictureUrl,
            role: bootstrapRole
          }
        });

    await tx.authAccount.create({
      data: {
        provider: input.provider,
        providerUserId: input.providerUserId,
        userId: user.id
      }
    });

    return user;
  });
}

async function getAuthenticatedUser(request: FastifyRequest) {
  const cookies = parseCookies(request.headers.cookie);
  const session = cookies.thefox_auth_session ? verifyPayload(cookies.thefox_auth_session) : null;

  if (!session?.userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.userId
    },
    include: {
      vendorMemberships: {
        select: {
          tenantId: true,
          role: true
        }
      },
      driverProfile: {
        select: {
          id: true,
          status: true,
          serviceArea: true
        }
      }
    }
  });
}

function userCanAccessRole(user: AuthenticatedUser, allowedRoles: UserRole[]) {
  return allowedRoles.includes(user.role);
}

async function requireRole(request: FastifyRequest, reply: FastifyReply, allowedRoles: UserRole[], auditContext?: AuditContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    if (auditContext) {
      await writeAuditLog(request, {
        ...auditContext,
        action: `${auditContext.action}.unauthenticated`,
        metadata: mergeAuditMetadata(auditContext.metadata, {
          requiredRoles: allowedRoles
        })
      });
    }

    reply.code(401).send({ error: 'UNAUTHENTICATED' });
    return null;
  }

  if (!userCanAccessRole(user, allowedRoles)) {
    if (auditContext) {
      await writeAuditLog(request, {
        ...auditContext,
        actor: user,
        action: `${auditContext.action}.forbidden`,
        metadata: mergeAuditMetadata(auditContext.metadata, {
          requiredRoles: allowedRoles,
          actualRole: user.role
        })
      });
    }

    reply.code(403).send({ error: 'FORBIDDEN', requiredRoles: allowedRoles });
    return null;
  }

  if (auditContext) {
    await writeAuditLog(request, {
      ...auditContext,
      actor: user,
      metadata: mergeAuditMetadata(auditContext.metadata, {
        requiredRoles: allowedRoles
      })
    });
  }

  return user;
}

async function requireMutationProtection(
  request: FastifyRequest,
  reply: FastifyReply,
  user: Pick<AuthenticatedUser, 'id' | 'role'>,
  context: AuditContext & {
    scope: string;
    rateLimit?: {
      limit: number;
      windowMs: number;
    };
  }
) {
  const rateLimit = context.rateLimit ?? {
    limit: 30,
    windowMs: 60_000
  };
  const underLimit = await enforceRateLimit(request, reply, {
    actor: user,
    action: context.action,
    resourceType: context.resourceType,
    resourceId: context.resourceId,
    metadata: context.metadata,
    scope: context.scope,
    limit: rateLimit.limit,
    windowMs: rateLimit.windowMs
  });

  if (!underLimit) {
    return null;
  }

  const tokenHeader = request.headers[mutationTokenHeader];
  const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  const payload = verifyMutationToken(token, user);

  if (!payload) {
    await writeAuditLog(request, {
      actor: user,
      action: `${context.action}.csrf_rejected`,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      metadata: mergeAuditMetadata(context.metadata, {
        security: {
          control: 'signed_mutation_token',
          outcome: 'rejected',
          hasToken: Boolean(token)
        }
      })
    });

    reply.code(403).send({
      error: 'MUTATION_TOKEN_REQUIRED',
      message: `Mutation requests require a valid ${mutationTokenHeader} header`
    });
    return null;
  }

  return payload;
}

function serializeApiUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    displayName: user.displayName ?? 'theFOX user',
    pictureUrl: user.photoUrl,
    email: user.email,
    role: user.role,
    scopes: {
      tenantMemberships: user.vendorMemberships,
      driverProfile: user.driverProfile
    }
  };
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
  const user = await upsertAuthenticatedUser({
    provider: 'line',
    providerUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? null,
    email
  });
  const session = signPayload({
    provider: 'line',
    providerUserId: profile.userId,
    userId: user.id,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? null,
    email,
    issuedAt: new Date().toISOString()
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'auth.login',
    resourceType: 'auth_session',
    resourceId: user.id,
    metadata: {
      provider: 'line',
      providerUserId: profile.userId,
      email
    }
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
  const displayName = profile.name ?? profile.email ?? 'Google user';
  const user = await upsertAuthenticatedUser({
    provider: 'google',
    providerUserId: profile.sub,
    displayName,
    pictureUrl: profile.picture ?? null,
    email
  });
  const session = signPayload({
    provider: 'google',
    providerUserId: profile.sub,
    userId: user.id,
    displayName,
    pictureUrl: profile.picture ?? null,
    email,
    issuedAt: new Date().toISOString()
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'auth.login',
    resourceType: 'auth_session',
    resourceId: user.id,
    metadata: {
      provider: 'google',
      providerUserId: profile.sub,
      email
    }
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
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return reply.code(401).send({ error: 'UNAUTHENTICATED' });
  }

  return {
    user: serializeApiUser(user),
    mutationToken: signMutationToken(user)
  };
});

app.post('/v1/auth/logout', async (request, reply) => {
  const user = await getAuthenticatedUser(request);

  if (user) {
    const mutation = await requireMutationProtection(request, reply, user, {
      action: 'auth.logout',
      resourceType: 'auth_session',
      resourceId: user.id,
      scope: 'auth.logout',
      rateLimit: {
        limit: 10,
        windowMs: 60_000
      }
    });

    if (!mutation) {
      return;
    }
  }

  await writeAuditLog(request, {
    actor: user,
    action: 'auth.logout',
    resourceType: 'auth_session',
    resourceId: user?.id,
    metadata: mutationAuditMetadata({
      operation: 'auth.logout',
      target: {
        userId: user?.id ?? 'anonymous'
      },
      security: {
        signedMutationToken: Boolean(user)
      }
    })
  });

  reply.header('Set-Cookie', serializeCookie('thefox_auth_session', '', { ...cookieOptions, maxAge: 1 }));
  return { ok: true };
});

app.get('/v1/admin/me', async (request, reply) => {
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.workspace.access',
    resourceType: 'admin_workspace'
  });

  if (!user) {
    return;
  }

  return {
    user: serializeApiUser(user),
    mutationToken: signMutationToken(user),
    permissions: {
      canReviewTenants: true,
      canInspectOrders: true,
      canManageRoles: user.role === 'superadmin'
    }
  };
});

app.get('/v1/admin/audit-logs', async (request, reply) => {
  const query = request.query as AdminAuditLogsQuery;
  const requestedPage = parseBoundedInt(query.page, 1, 1, 10_000);
  const pageSize = parseBoundedInt(query.pageSize, 25, 5, 100);
  const action = normalizeOptionalQuery(query.action);
  const resourceType = normalizeOptionalQuery(query.resourceType);
  const actorRoleText = normalizeOptionalQuery(query.actorRole);
  const actorRole = actorRoleText ? RoleSchema.safeParse(actorRoleText) : null;
  const from = parseOptionalDate(query.from);
  const to = parseOptionalDate(query.to, 'end');
  const filters = {
    action: action || '',
    actorRole: actorRole?.success ? actorRole.data : '',
    resourceType: resourceType || '',
    from: from?.toISOString() ?? '',
    to: to?.toISOString() ?? ''
  };

  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.audit_logs.list',
    resourceType: 'audit_log',
    metadata: {
      page: requestedPage,
      pageSize,
      filters
    }
  });

  if (!user) {
    return;
  }

  if (actorRoleText && !actorRole?.success) {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.audit_logs.list.invalid_filter',
      resourceType: 'audit_log',
      metadata: {
        page: requestedPage,
        pageSize,
        filters: {
          ...filters,
          actorRole: actorRoleText
        },
        validation: {
          field: 'actorRole',
          allowedValues: ['customer', 'vendor', 'driver', 'admin', 'superadmin']
        }
      }
    });

    return reply.code(400).send({
      error: 'INVALID_ACTOR_ROLE',
      message: 'actorRole must be customer, vendor, driver, admin, or superadmin'
    });
  }

  const where: Prisma.AuditLogWhereInput = {};

  if (action) {
    where.action = {
      contains: action,
      mode: 'insensitive'
    };
  }

  if (resourceType) {
    where.resourceType = {
      contains: resourceType,
      mode: 'insensitive'
    };
  }

  if (actorRole?.success) {
    where.actorRole = actorRole.data;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    };
  }

  const total = await prisma.auditLog.count({
    where
  });
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(requestedPage, totalPages);

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      actorUserId: true,
      actorRole: true,
      action: true,
      resourceType: true,
      resourceId: true,
      route: true,
      method: true,
      ipAddress: true,
      userAgent: true,
      metadata: true,
      createdAt: true,
      actorUser: {
        select: {
          email: true,
          displayName: true
        }
      }
    }
  });

  if (page !== requestedPage) {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.audit_logs.list.page_clamped',
      resourceType: 'audit_log',
      metadata: {
        requestedPage,
        page,
        pageSize,
        total,
        totalPages,
        filters
      }
    });
  }

  return {
    data: logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    }
  };
});

app.get('/v1/admin/users', async (request, reply) => {
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.users.list',
    resourceType: 'user'
  });

  if (!user) {
    return;
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 100,
    select: {
      id: true,
      email: true,
      displayName: true,
      photoUrl: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      authAccounts: {
        select: {
          provider: true,
          providerUserId: true
        }
      },
      vendorMemberships: {
        select: {
          tenantId: true,
          role: true,
          tenant: {
            select: {
              name: true,
              slug: true,
              status: true
            }
          }
        }
      },
      driverProfile: {
        select: {
          id: true,
          status: true,
          serviceArea: true
        }
      }
    }
  });

  return {
    data: users
  };
});

app.get('/v1/admin/tenants', async (request, reply) => {
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.tenants.list',
    resourceType: 'tenant'
  });

  if (!user) {
    return;
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true
            }
          }
        }
      },
      branches: {
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          address: true,
          createdAt: true,
          updatedAt: true
        }
      },
      _count: {
        select: {
          branches: true,
          memberships: true,
          products: true
        }
      }
    }
  });

  return {
    data: tenants
  };
});

app.post('/v1/admin/tenants', async (request, reply) => {
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.tenant.create.attempt',
    resourceType: 'tenant'
  });

  if (!user) {
    return;
  }

  const mutation = await requireMutationProtection(request, reply, user, {
    action: 'admin.tenant.create',
    resourceType: 'tenant',
    scope: 'admin.tenant.create',
    rateLimit: {
      limit: 12,
      windowMs: 60_000
    }
  });

  if (!mutation) {
    return;
  }

  const body = request.body as AdminCreateTenantBody;
  const name = normalizeText(body.name);
  const slug = normalizeSlug(body.slug || body.name);
  const description = normalizeOptionalText(body.description);
  const ownerUserId = normalizeText(body.ownerUserId);
  const ownerRole = normalizeText(body.ownerRole) || 'owner';

  if (!name || !slug) {
    return reply.code(400).send({
      error: 'INVALID_TENANT',
      message: 'Tenant name and slug are required'
    });
  }

  if (ownerUserId && !vendorMembershipRoles.has(ownerRole)) {
    return reply.code(400).send({
      error: 'INVALID_MEMBERSHIP_ROLE',
      message: 'Owner role must be owner, admin, or member'
    });
  }

  const ownerUser = ownerUserId
    ? await prisma.user.findUnique({
        where: {
          id: ownerUserId
        },
        select: {
          id: true,
          role: true
        }
      })
    : null;

  if (ownerUserId && !ownerUser) {
    return reply.code(404).send({ error: 'OWNER_NOT_FOUND' });
  }

  const tenant = await prisma.$transaction(async (tx) => {
    const createdTenant = await tx.tenant.create({
      data: {
        name,
        slug,
        description,
        status: 'pending'
      }
    });

    if (ownerUser) {
      await tx.vendorMembership.create({
        data: {
          tenantId: createdTenant.id,
          userId: ownerUser.id,
          role: ownerRole
        }
      });

      if (ownerUser.role === 'customer') {
        await tx.user.update({
          where: {
            id: ownerUser.id
          },
          data: {
            role: 'vendor'
          }
        });
      }
    }

    return tx.tenant.findUniqueOrThrow({
      where: {
        id: createdTenant.id
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                role: true
              }
            }
          }
        },
        branches: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            address: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            branches: true,
            memberships: true,
            products: true
          }
        }
      }
    });
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'admin.tenant.create',
    resourceType: 'tenant',
    resourceId: tenant.id,
    metadata: mutationAuditMetadata({
      operation: 'admin.tenant.create',
      target: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      },
      after: {
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        ownerUserId: ownerUserId || '',
        ownerRole: ownerUserId ? ownerRole : ''
      },
      security: {
        signedMutationToken: true,
        tokenIssuedAt: mutation.issuedAt,
        tokenExpiresAt: mutation.expiresAt
      }
    })
  });

  return reply.code(201).send({
    tenant
  });
});

app.patch('/v1/admin/tenants/:tenantId/status', async (request, reply) => {
  const params = request.params as AdminTenantParams;
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.tenant_status.update.attempt',
    resourceType: 'tenant',
    resourceId: params.tenantId
  });

  if (!user) {
    return;
  }

  const body = request.body as AdminUpdateTenantStatusBody;
  const nextStatus = normalizeText(body.status) as TenantStatus;

  if (!tenantStatuses.has(nextStatus)) {
    return reply.code(400).send({
      error: 'INVALID_TENANT_STATUS',
      message: 'Tenant status must be pending, active, or suspended'
    });
  }

  const mutation = await requireMutationProtection(request, reply, user, {
    action: 'admin.tenant_status.update',
    resourceType: 'tenant',
    resourceId: params.tenantId,
    scope: 'admin.tenant_status.update',
    rateLimit: {
      limit: 30,
      windowMs: 60_000
    }
  });

  if (!mutation) {
    return;
  }

  if (nextStatus === 'suspended' && user.role !== 'superadmin') {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.tenant_status.update.destructive_forbidden',
      resourceType: 'tenant',
      resourceId: params.tenantId,
      metadata: mutationAuditMetadata({
        operation: 'admin.tenant_status.update',
        target: {
          tenantId: params.tenantId
        },
        after: {
          nextStatus
        },
        security: {
          destructiveAction: true,
          requiredRole: 'superadmin',
          actualRole: user.role,
          signedMutationToken: true
        }
      })
    });

    return reply.code(403).send({
      error: 'SUPERADMIN_REQUIRED',
      message: 'Suspending a tenant requires superadmin'
    });
  }

  const existingTenant = await prisma.tenant.findUnique({
    where: {
      id: params.tenantId
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true
    }
  });

  if (!existingTenant) {
    return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
  }

  const tenant = await prisma.tenant.update({
    where: {
      id: existingTenant.id
    },
    data: {
      status: nextStatus
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true
    }
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'admin.tenant_status.update',
    resourceType: 'tenant',
    resourceId: tenant.id,
    metadata: mutationAuditMetadata({
      operation: 'admin.tenant_status.update',
      target: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      },
      before: {
        status: existingTenant.status
      },
      after: {
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status
      },
      security: {
        destructiveAction: tenant.status === 'suspended',
        signedMutationToken: true,
        tokenIssuedAt: mutation.issuedAt,
        tokenExpiresAt: mutation.expiresAt
      }
    })
  });

  return {
    tenant
  };
});

app.post('/v1/admin/tenants/:tenantId/memberships', async (request, reply) => {
  const params = request.params as AdminTenantParams;
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.tenant_membership.create.attempt',
    resourceType: 'tenant',
    resourceId: params.tenantId
  });

  if (!user) {
    return;
  }

  const mutation = await requireMutationProtection(request, reply, user, {
    action: 'admin.tenant_membership.upsert',
    resourceType: 'tenant',
    resourceId: params.tenantId,
    scope: 'admin.tenant_membership.upsert',
    rateLimit: {
      limit: 24,
      windowMs: 60_000
    }
  });

  if (!mutation) {
    return;
  }

  const body = request.body as AdminCreateMembershipBody;
  const targetUserId = normalizeText(body.userId);
  const role = normalizeText(body.role) || 'member';

  if (!targetUserId || !vendorMembershipRoles.has(role)) {
    return reply.code(400).send({
      error: 'INVALID_MEMBERSHIP',
      message: 'Membership requires userId and role owner, admin, or member'
    });
  }

  const [tenant, targetUser] = await Promise.all([
    prisma.tenant.findUnique({
      where: {
        id: params.tenantId
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    }),
    prisma.user.findUnique({
      where: {
        id: targetUserId
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true
      }
    })
  ]);

  if (!tenant) {
    return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
  }

  if (!targetUser) {
    return reply.code(404).send({ error: 'USER_NOT_FOUND' });
  }

  const membership = await prisma.$transaction(async (tx) => {
    await tx.vendorMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: targetUser.id
        }
      },
      create: {
        tenantId: tenant.id,
        userId: targetUser.id,
        role
      },
      update: {
        role
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true
          }
        }
      }
    });

    if (targetUser.role === 'customer') {
      await tx.user.update({
        where: {
          id: targetUser.id
        },
        data: {
          role: 'vendor'
        }
      });
    }

    return tx.vendorMembership.findUniqueOrThrow({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: targetUser.id
        }
      },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true
          }
        }
      }
    });
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'admin.tenant_membership.upsert',
    resourceType: 'tenant',
    resourceId: tenant.id,
    metadata: mutationAuditMetadata({
      operation: 'admin.tenant_membership.upsert',
      target: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        memberUserId: targetUser.id
      },
      before: {
        userRole: targetUser.role
      },
      after: {
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        memberEmail: targetUser.email ?? '',
        membershipRole: role,
        userRole: membership.user.role
      },
      security: {
        signedMutationToken: true,
        tokenIssuedAt: mutation.issuedAt,
        tokenExpiresAt: mutation.expiresAt
      }
    })
  });

  return reply.code(201).send({
    membership
  });
});

app.post('/v1/admin/tenants/:tenantId/branches', async (request, reply) => {
  const params = request.params as AdminTenantParams;
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.branch.create.attempt',
    resourceType: 'tenant',
    resourceId: params.tenantId
  });

  if (!user) {
    return;
  }

  const mutation = await requireMutationProtection(request, reply, user, {
    action: 'admin.branch.create',
    resourceType: 'tenant',
    resourceId: params.tenantId,
    scope: 'admin.branch.create',
    rateLimit: {
      limit: 24,
      windowMs: 60_000
    }
  });

  if (!mutation) {
    return;
  }

  const body = request.body as AdminCreateBranchBody;
  const name = normalizeText(body.name);
  const slug = normalizeSlug(body.slug || body.name);
  const address = normalizeOptionalText(body.address);

  if (!name || !slug) {
    return reply.code(400).send({
      error: 'INVALID_BRANCH',
      message: 'Branch name and slug are required'
    });
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: params.tenantId
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  if (!tenant) {
    return reply.code(404).send({ error: 'TENANT_NOT_FOUND' });
  }

  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name,
      slug,
      address,
      status: 'pending'
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      slug: true,
      status: true,
      address: true,
      createdAt: true,
      updatedAt: true
    }
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'admin.branch.create',
    resourceType: 'branch',
    resourceId: branch.id,
    metadata: mutationAuditMetadata({
      operation: 'admin.branch.create',
      target: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        branchId: branch.id,
        branchSlug: branch.slug
      },
      after: {
        tenantName: tenant.name,
        name: branch.name,
        slug: branch.slug,
        status: branch.status
      },
      security: {
        signedMutationToken: true,
        tokenIssuedAt: mutation.issuedAt,
        tokenExpiresAt: mutation.expiresAt
      }
    })
  });

  return reply.code(201).send({
    branch
  });
});

app.patch('/v1/admin/branches/:branchId/status', async (request, reply) => {
  const params = request.params as AdminBranchParams;
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.branch_status.update.attempt',
    resourceType: 'branch',
    resourceId: params.branchId
  });

  if (!user) {
    return;
  }

  const body = request.body as AdminUpdateBranchStatusBody;
  const nextStatus = normalizeText(body.status) as BranchStatus;

  if (!branchStatuses.has(nextStatus)) {
    return reply.code(400).send({
      error: 'INVALID_BRANCH_STATUS',
      message: 'Branch status must be pending, active, paused, or closed'
    });
  }

  const mutation = await requireMutationProtection(request, reply, user, {
    action: 'admin.branch_status.update',
    resourceType: 'branch',
    resourceId: params.branchId,
    scope: 'admin.branch_status.update',
    rateLimit: {
      limit: 45,
      windowMs: 60_000
    }
  });

  if (!mutation) {
    return;
  }

  if (nextStatus === 'closed' && user.role !== 'superadmin') {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.branch_status.update.destructive_forbidden',
      resourceType: 'branch',
      resourceId: params.branchId,
      metadata: mutationAuditMetadata({
        operation: 'admin.branch_status.update',
        target: {
          branchId: params.branchId
        },
        after: {
          nextStatus
        },
        security: {
          destructiveAction: true,
          requiredRole: 'superadmin',
          actualRole: user.role,
          signedMutationToken: true
        }
      })
    });

    return reply.code(403).send({
      error: 'SUPERADMIN_REQUIRED',
      message: 'Closing a branch requires superadmin'
    });
  }

  const existingBranch = await prisma.branch.findUnique({
    where: {
      id: params.branchId
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      slug: true,
      status: true,
      tenant: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  if (!existingBranch) {
    return reply.code(404).send({ error: 'BRANCH_NOT_FOUND' });
  }

  const branch = await prisma.branch.update({
    where: {
      id: existingBranch.id
    },
    data: {
      status: nextStatus
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      slug: true,
      status: true,
      address: true,
      updatedAt: true
    }
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'admin.branch_status.update',
    resourceType: 'branch',
    resourceId: branch.id,
    metadata: mutationAuditMetadata({
      operation: 'admin.branch_status.update',
      target: {
        tenantId: existingBranch.tenantId,
        tenantSlug: existingBranch.tenant.slug,
        branchId: branch.id,
        branchSlug: branch.slug
      },
      before: {
        status: existingBranch.status
      },
      after: {
        tenantName: existingBranch.tenant.name,
        name: branch.name,
        slug: branch.slug,
        status: branch.status
      },
      security: {
        destructiveAction: branch.status === 'closed',
        signedMutationToken: true,
        tokenIssuedAt: mutation.issuedAt,
        tokenExpiresAt: mutation.expiresAt
      }
    })
  });

  return {
    branch
  };
});

app.patch('/v1/admin/users/:userId/role', async (request, reply) => {
  const user = await requireRole(request, reply, ['superadmin'], {
    action: 'admin.user_role.update.attempt',
    resourceType: 'user',
    resourceId: (request.params as AdminUpdateUserRoleParams).userId
  });

  if (!user) {
    return;
  }

  const params = request.params as AdminUpdateUserRoleParams;
  const mutation = await requireMutationProtection(request, reply, user, {
    action: 'admin.user_role.update',
    resourceType: 'user',
    resourceId: params.userId,
    scope: 'admin.user_role.update',
    rateLimit: {
      limit: 18,
      windowMs: 60_000
    }
  });

  if (!mutation) {
    return;
  }

  const body = request.body as AdminUpdateUserRoleBody;
  const parsedRole = RoleSchema.safeParse(body.role);

  if (!parsedRole.success) {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.user_role.update.invalid',
      resourceType: 'user',
      resourceId: params.userId,
      metadata: mutationAuditMetadata({
        operation: 'admin.user_role.update',
        target: {
          userId: params.userId
        },
        input: {
          receivedRole: typeof body.role === 'string' ? body.role : ''
        },
        security: {
          signedMutationToken: true
        }
      })
    });

    return reply.code(400).send({
      error: 'INVALID_ROLE',
      message: 'Role must be one of customer, vendor, driver, admin, or superadmin'
    });
  }

  const target = await prisma.user.findUnique({
    where: {
      id: params.userId
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true
    }
  });

  if (!target) {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.user_role.update.missing_target',
      resourceType: 'user',
      resourceId: params.userId,
      metadata: mutationAuditMetadata({
        operation: 'admin.user_role.update',
        target: {
          userId: params.userId
        },
        after: {
          nextRole: parsedRole.data
        },
        security: {
          signedMutationToken: true
        }
      })
    });

    return reply.code(404).send({ error: 'USER_NOT_FOUND' });
  }

  if (target.id === user.id && target.role === 'superadmin' && parsedRole.data !== 'superadmin') {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.user_role.update.self_demote_blocked',
      resourceType: 'user',
      resourceId: target.id,
      metadata: mutationAuditMetadata({
        operation: 'admin.user_role.update',
        target: {
          userId: target.id
        },
        before: {
          role: target.role
        },
        after: {
          role: parsedRole.data
        },
        security: {
          destructiveAction: true,
          signedMutationToken: true,
          reason: 'self_demote_blocked'
        }
      })
    });

    return reply.code(409).send({
      error: 'SELF_DEMOTE_BLOCKED',
      message: 'Superadmin cannot remove their own superadmin role'
    });
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: target.id
    },
    data: {
      role: parsedRole.data
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      updatedAt: true
    }
  });

  await writeAuditLog(request, {
    actor: user,
    action: 'admin.user_role.update',
    resourceType: 'user',
    resourceId: updatedUser.id,
    metadata: mutationAuditMetadata({
      operation: 'admin.user_role.update',
      target: {
        userId: updatedUser.id,
        targetEmail: updatedUser.email ?? '',
        targetDisplayName: updatedUser.displayName ?? ''
      },
      before: {
        role: target.role
      },
      after: {
        role: updatedUser.role
      },
      security: {
        destructiveAction: target.role === 'superadmin' || updatedUser.role === 'superadmin',
        signedMutationToken: true,
        tokenIssuedAt: mutation.issuedAt,
        tokenExpiresAt: mutation.expiresAt
      }
    })
  });

  return {
    user: updatedUser
  };
});

app.get('/v1/vendor/me', async (request, reply) => {
  const user = await requireRole(request, reply, ['vendor', 'admin', 'superadmin'], {
    action: 'vendor.workspace.access',
    resourceType: 'vendor_workspace'
  });

  if (!user) {
    return;
  }

  return {
    user: serializeApiUser(user),
    memberships: user.vendorMemberships
  };
});

app.get('/v1/driver/me', async (request, reply) => {
  const user = await requireRole(request, reply, ['driver', 'admin', 'superadmin'], {
    action: 'driver.workspace.access',
    resourceType: 'driver_workspace'
  });

  if (!user) {
    return;
  }

  return {
    user: serializeApiUser(user),
    driverProfile: user.driverProfile
  };
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
