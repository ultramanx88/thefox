import 'dotenv/config';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaClient, type Prisma, type UserRole } from '@prisma/client';
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

type AuthSessionPayload = {
  provider: 'line' | 'google';
  providerUserId: string;
  userId: string;
  displayName: string;
  pictureUrl: string | null;
  email: string | null;
  issuedAt: string;
};

type AuthProvider = AuthSessionPayload['provider'];
type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;
type AuditContext = {
  action: string;
  resourceType?: string;
  resourceId?: string | undefined;
  metadata?: Prisma.InputJsonValue;
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
  credentials: true
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

async function writeAuditLog(request: FastifyRequest, context: AuditContext & { actor?: Pick<AuthenticatedUser, 'id' | 'role'> | null }) {
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
    user: serializeApiUser(user)
  };
});

app.post('/v1/auth/logout', async (request, reply) => {
  const user = await getAuthenticatedUser(request);

  await writeAuditLog(request, {
    actor: user,
    action: 'auth.logout',
    resourceType: 'auth_session',
    resourceId: user?.id
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
    permissions: {
      canReviewTenants: true,
      canInspectOrders: true,
      canManageRoles: user.role === 'superadmin'
    }
  };
});

app.get('/v1/admin/audit-logs', async (request, reply) => {
  const user = await requireRole(request, reply, ['admin', 'superadmin'], {
    action: 'admin.audit_logs.list',
    resourceType: 'audit_log'
  });

  if (!user) {
    return;
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 50,
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

  return {
    data: logs
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
  const body = request.body as AdminUpdateUserRoleBody;
  const parsedRole = RoleSchema.safeParse(body.role);

  if (!parsedRole.success) {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.user_role.update.invalid',
      resourceType: 'user',
      resourceId: params.userId,
      metadata: {
        receivedRole: typeof body.role === 'string' ? body.role : null
      }
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
      metadata: {
        nextRole: parsedRole.data
      }
    });

    return reply.code(404).send({ error: 'USER_NOT_FOUND' });
  }

  if (target.id === user.id && target.role === 'superadmin' && parsedRole.data !== 'superadmin') {
    await writeAuditLog(request, {
      actor: user,
      action: 'admin.user_role.update.self_demote_blocked',
      resourceType: 'user',
      resourceId: target.id,
      metadata: {
        previousRole: target.role,
        nextRole: parsedRole.data
      }
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
    metadata: {
      previousRole: target.role,
      nextRole: updatedUser.role,
      targetEmail: updatedUser.email,
      targetDisplayName: updatedUser.displayName
    }
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
