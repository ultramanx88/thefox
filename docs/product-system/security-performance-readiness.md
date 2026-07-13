# Security and Performance Readiness

## Business Intent

theFOX admin, vendor, driver, tenant, stock, and settlement workflows must be secure and fast before they mutate production business data. UX work should continue, but every new workflow needs a security and performance acceptance gate.

## Current Route Surface

| Surface | Canonical host | Internal route |
| --- | --- | --- |
| Admin | `admin.thefox.app` | `/admin` |
| Vendor | `vendor.thefox.app` | `/vendor` |
| Driver fallback | `driver.thefox.app` | `/driver` |
| API | `api.thefox.app` | `/v1/*` |

Root-domain workspace paths should redirect to the canonical workspace host:

- `thefox.app/admin` -> `admin.thefox.app`
- `thefox.app/vendor` -> `vendor.thefox.app`
- `thefox.app/driver` -> `driver.thefox.app`

## Operational Acceptance Contract

Every task card must include:

- Expected state.
- Error state.
- Audit event.
- Rollback note.
- Production verification command.

## Pentest Task Cards

| Task | Expected state | Error state | Audit event | Rollback note | Production verification command |
| --- | --- | --- | --- | --- | --- |
| Route isolation | Customer/lower roles cannot access admin, vendor, or driver data by URL guessing. | Unauthenticated requests return `401`; forbidden roles return `403`; forged cookies fail session verification. | `admin.workspace.access.unauthenticated`, `vendor.workspace.access.forbidden`, `driver.workspace.access.forbidden` | Revert route/auth guard changes and redeploy only `thefox-app` web/api containers. | `curl -i https://api.thefox.app/v1/admin/me` |
| Subdomain redirects | `thefox.app/admin`, `/vendor`, and `/driver` redirect to canonical workspace subdomains. | Missing/incorrect redirect, internal port exposure, or workspace content served from root path. | No DB audit expected; edge/proxy behavior is verified through response headers. | Revert `apps/web/proxy.ts` and redeploy web container. | `curl -fsSI https://thefox.app/admin` |
| Cookie scope | Auth and OAuth cookies work across `.thefox.app` and remain `HttpOnly`, `Secure`, `SameSite=Lax`. | Cookie missing secure flags, wrong domain, or workspace cannot read authenticated session via API. | `auth.login`, `auth.logout` | Revert cookie domain/env change and redeploy API with previous `AUTH_COOKIE_DOMAIN`. | `curl -i https://api.thefox.app/v1/auth/google/start` |
| CORS | API allows only approved workspace origins and permits mutation token headers. | Unexpected origin gets no `Access-Control-Allow-Origin`; browser preflight for mutation fails if methods/headers are incomplete. | No DB audit expected for preflight; failed mutation requests audit at route level. | Revert CORS config in API and redeploy API container. | `curl -i -X OPTIONS https://api.thefox.app/v1/admin/users/example/role -H 'Origin: https://admin.thefox.app' -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type,x-thefox-mutation-token'` |
| Role bypass | Admin-only APIs reject customer/vendor/driver; superadmin-only APIs reject admin/lower roles. | Lower role gets `403`; self-demote is blocked; missing target returns `404`. | `*.forbidden`, `admin.user_role.update.self_demote_blocked`, `admin.user_role.update.missing_target` | Revert role guard change and redeploy API; never manually edit production roles except emergency break-glass. | `curl -i https://api.thefox.app/v1/admin/users` |
| Audit trail | Forbidden access, login/logout, role change, tenant/branch actions, CSRF rejection, and rate limit events write rows. | Expected action missing, metadata is unstructured, or actor/resource fields are empty when they should be populated. | `auth.login`, `auth.logout`, `admin.user_role.update`, `admin.tenant_status.update`, `admin.user_role.update.csrf_rejected`, `*.rate_limited` | Keep audit rows; rollback only code that failed to emit them and redeploy API. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -P pager=off -c 'SELECT action, \"actorRole\", \"resourceType\", \"createdAt\" FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 10;'"` |
| Mutation protection | Every state-changing admin request requires a valid signed mutation token bound to current user and role. | Missing/expired/wrong-role token returns `403 MUTATION_TOKEN_REQUIRED`. | `admin.*.csrf_rejected` | Revert mutation guard commit and redeploy API/web together; do not remove audit evidence. | `curl -i https://api.thefox.app/v1/admin/tenants -X POST -H 'Content-Type: application/json' --data '{"name":"csrf-test","slug":"csrf-test"}'` |
| Rate limit | Sensitive mutation routes enforce per-scope/user/IP windows and return rate-limit headers. | Burst requests return `429 RATE_LIMITED` with `Retry-After`. | `admin.user_role.update.rate_limited`, future `admin.*.rate_limited` | Restart API to clear in-memory buckets if misconfigured; then tune limits in code and redeploy. | `curl -i https://api.thefox.app/v1/admin/me` |

## Performance Task Cards

| Task | Expected state | Error state | Audit event | Rollback note | Production verification command |
| --- | --- | --- | --- | --- | --- |
| Admin API baseline | `auth/me`, `admin/users`, and `admin/audit-logs` stay within the current post-deploy latency budget. | TTFB/regression spike, `5xx`, or payload growth that slows admin console load. | `admin.workspace.access`, `admin.users.list`, `admin.audit_logs.list` | Revert API/query change and redeploy; no schema rollback unless migration caused the regression. | `curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://api.thefox.app/v1/auth/me` |
| Page budget | Admin/vendor pages remain responsive on mobile and avoid unnecessary heavy client bundles. | Static JS grows unexpectedly, page TTFB regresses, or mobile layout overlaps. | No DB audit expected; verification is route/static asset based. | Revert UI bundle-heavy change and redeploy web container. | `curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total} bytes=%{size_download}\n' https://admin.thefox.app` |
| Audit query plan | Audit log list is bounded and ready for pagination/filtering before table growth. | Unbounded audit query, slow admin load, or missing pagination path. | `admin.audit_logs.list` | Revert query change or add pagination guard; redeploy API only. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -P pager=off -c 'EXPLAIN SELECT id FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 50;'"` |
| Route cold start | Public workspace routes and API health return healthy status after container recreate. | Web/API container starts but first response fails or exceeds cold budget. | No DB audit expected for health/static route checks. | Restart only `thefox-app-web-1`/`thefox-app-api-1`; rollback last deploy if cold failure persists. | `curl -fsS https://api.thefox.app/health && curl -fsSI https://admin.thefox.app` |
| DB connection safety | API startup, migrations, and Prisma client behavior stay stable during deploy. | Migrate fails, connection pool error, or app starts with schema mismatch. | Migration failures appear in deploy logs; runtime audit may be unavailable if DB is down. | Resolve failed migration carefully, or redeploy previous image without touching other VPS services. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml run --rm api npx prisma migrate status --schema apps/api/prisma/schema.prisma"` |

## Business Logic Readiness

Before implementing tenant/branch mutations, define:

- Required fields for tenant creation.
- Required fields for branch creation.
- Owner/member permission levels.
- Status transition rules.
- Audit event names.
- Error states and rollback behavior.
- Admin vs superadmin responsibility split.

## Next Tasks

1. Build tenant and branch admin UX with empty/loading/error states.
2. Add admin tenant and branch APIs after mutation protection is decided.
3. Add audit filters and pagination.
4. Run route/auth/CORS pentest checklist against production.
5. Record performance baselines in this document after every deploy milestone.
