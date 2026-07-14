const defaultTargets = [
  {
    name: 'api_health',
    url: process.env.THEFOX_API_HEALTH_URL ?? 'https://api.thefox.app/health',
    expectedStatus: 200,
    maxTotalMs: 1500,
    maxBytes: 512
  },
  {
    name: 'auth_me_unauth',
    url: process.env.THEFOX_AUTH_ME_URL ?? 'https://api.thefox.app/v1/auth/me',
    expectedStatus: 401,
    maxTotalMs: 1500,
    maxBytes: 1024
  },
  {
    name: 'admin_page',
    url: process.env.THEFOX_ADMIN_URL ?? 'https://admin.thefox.app',
    expectedStatus: 200,
    maxTotalMs: 2000,
    maxBytes: 160000,
    expectedHeader: {
      name: 'x-nextjs-cache',
      values: ['HIT', 'STALE']
    }
  }
];

const authenticatedTargets = process.env.THEFOX_AUTH_SESSION
  ? [
      {
        name: 'admin_me',
        url: process.env.THEFOX_ADMIN_ME_URL ?? 'https://api.thefox.app/v1/admin/me',
        expectedStatus: 200,
        maxTotalMs: 1500,
        maxBytes: 4096,
        cookie: `thefox_auth_session=${process.env.THEFOX_AUTH_SESSION}`
      },
      {
        name: 'admin_users',
        url: process.env.THEFOX_ADMIN_USERS_URL ?? 'https://api.thefox.app/v1/admin/users',
        expectedStatus: 200,
        maxTotalMs: 1500,
        maxBytes: 20000,
        cookie: `thefox_auth_session=${process.env.THEFOX_AUTH_SESSION}`
      },
      {
        name: 'admin_audit_logs',
        url: process.env.THEFOX_ADMIN_AUDIT_URL ?? 'https://api.thefox.app/v1/admin/audit-logs?page=1&pageSize=25',
        expectedStatus: 200,
        maxTotalMs: 2000,
        maxBytes: 60000,
        cookie: `thefox_auth_session=${process.env.THEFOX_AUTH_SESSION}`
      }
    ]
  : [];

async function measure(target) {
  const start = performance.now();
  const response = await fetch(target.url, {
    headers: target.cookie
      ? {
          Cookie: target.cookie
        }
      : undefined,
    redirect: 'manual'
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  const totalMs = performance.now() - start;
  const headerValue = target.expectedHeader ? response.headers.get(target.expectedHeader.name) : null;
  const failures = [];

  if (response.status !== target.expectedStatus) {
    failures.push(`status ${response.status} != ${target.expectedStatus}`);
  }

  if (totalMs > target.maxTotalMs) {
    failures.push(`total ${totalMs.toFixed(1)}ms > ${target.maxTotalMs}ms`);
  }

  if (buffer.byteLength > target.maxBytes) {
    failures.push(`bytes ${buffer.byteLength} > ${target.maxBytes}`);
  }

  if (target.expectedHeader && !target.expectedHeader.values.includes(headerValue ?? '')) {
    failures.push(`${target.expectedHeader.name} ${headerValue ?? '<missing>'} not in ${target.expectedHeader.values.join(',')}`);
  }

  return {
    name: target.name,
    status: response.status,
    totalMs,
    bytes: buffer.byteLength,
    headerName: target.expectedHeader?.name,
    headerValue,
    failures
  };
}

const targets = [...defaultTargets, ...authenticatedTargets];
const results = [];

for (const target of targets) {
  results.push(await measure(target));
}

for (const result of results) {
  const header = result.headerName ? ` ${result.headerName}=${result.headerValue ?? '<missing>'}` : '';
  const state = result.failures.length ? 'FAIL' : 'PASS';
  console.log(`${state} ${result.name} status=${result.status} total=${result.totalMs.toFixed(1)}ms bytes=${result.bytes}${header}`);

  for (const failure of result.failures) {
    console.log(`  - ${failure}`);
  }
}

if (!authenticatedTargets.length) {
  console.log('SKIP authenticated admin budgets: set THEFOX_AUTH_SESSION to include admin/me, admin/users, and admin/audit-logs.');
}

if (results.some((result) => result.failures.length)) {
  process.exitCode = 1;
}
