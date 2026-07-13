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
- Copy/paste prompt for starting or resuming the task in Codex.

## Pentest Task Cards

| Task | Expected state | Error state | Audit event | Rollback note | Production verification command | Prompt |
| --- | --- | --- | --- | --- | --- | --- |
| Route isolation | Customer/lower roles cannot access admin, vendor, or driver data by URL guessing. | Unauthenticated requests return `401`; forbidden roles return `403`; forged cookies fail session verification. | `admin.workspace.access.unauthenticated`, `vendor.workspace.access.forbidden`, `driver.workspace.access.forbidden` | Revert route/auth guard changes and redeploy only `thefox-app` web/api containers. | `curl -i https://api.thefox.app/v1/admin/me` | `ทำ task Route isolation ต่อ: ทดสอบ URL guessing, unauth, forbidden roles, forged cookie และ audit events` |
| Subdomain redirects | `thefox.app/admin`, `/vendor`, and `/driver` redirect to canonical workspace subdomains. | Missing/incorrect redirect, internal port exposure, or workspace content served from root path. | No DB audit expected; edge/proxy behavior is verified through response headers. | Revert `apps/web/proxy.ts` and redeploy web container. | `curl -fsSI https://thefox.app/admin` | `ทำ task Subdomain redirects ต่อ: ตรวจ root workspace redirects ไป admin/vendor/driver subdomains และ update card status` |
| Cookie scope | Auth and OAuth cookies work across `.thefox.app` and remain `HttpOnly`, `Secure`, `SameSite=Lax`. | Cookie missing secure flags, wrong domain, or workspace cannot read authenticated session via API. | `auth.login`, `auth.logout` | Revert cookie domain/env change and redeploy API with previous `AUTH_COOKIE_DOMAIN`. | `curl -i https://api.thefox.app/v1/auth/google/start` | `ทำ task Cookie scope ต่อ: ตรวจ cookie domain, Secure, HttpOnly, SameSite และ workspace session behavior` |
| CORS | API allows only approved workspace origins and permits mutation token headers. | Unexpected origin gets no `Access-Control-Allow-Origin`; browser preflight for mutation fails if methods/headers are incomplete. | No DB audit expected for preflight; failed mutation requests audit at route level. | Revert CORS config in API and redeploy API container. | `curl -i -X OPTIONS https://api.thefox.app/v1/admin/users/example/role -H 'Origin: https://admin.thefox.app' -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type,x-thefox-mutation-token'` | `ทำ task CORS ต่อ: ตรวจ allowed origins, mutation token headers, preflight และ failed mutation audit` |
| Role bypass | Admin-only APIs reject customer/vendor/driver; superadmin-only APIs reject admin/lower roles. | Lower role gets `403`; self-demote is blocked; missing target returns `404`. | `*.forbidden`, `admin.user_role.update.self_demote_blocked`, `admin.user_role.update.missing_target` | Revert role guard change and redeploy API; never manually edit production roles except emergency break-glass. | `curl -i https://api.thefox.app/v1/admin/users` | `ทำ task Role bypass ต่อ: ทดสอบ admin-only/superadmin-only APIs, self-demote block, missing target และ audit` |
| Audit trail | Forbidden access, login/logout, role change, tenant/branch actions, CSRF rejection, and rate limit events write rows. | Expected action missing, metadata is unstructured, or actor/resource fields are empty when they should be populated. | `auth.login`, `auth.logout`, `admin.user_role.update`, `admin.tenant_status.update`, `admin.user_role.update.csrf_rejected`, `*.rate_limited` | Keep audit rows; rollback only code that failed to emit them and redeploy API. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -P pager=off -c 'SELECT action, \"actorRole\", \"resourceType\", \"createdAt\" FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 10;'"` | `ทำ task Audit trail ต่อ: ตรวจ forbidden/login/logout/role/tenant/branch/CSRF/rate-limit audit rows และ metadata` |
| Mutation protection | Every state-changing admin request requires a valid signed mutation token bound to current user and role. | Missing/expired/wrong-role token returns `403 MUTATION_TOKEN_REQUIRED`. | `admin.*.csrf_rejected` | Revert mutation guard commit and redeploy API/web together; do not remove audit evidence. | `curl -i https://api.thefox.app/v1/admin/tenants -X POST -H 'Content-Type: application/json' --data '{"name":"csrf-test","slug":"csrf-test"}'` | `ทำ task Mutation protection ต่อ: ตรวจ signed mutation token, rate limit, destructive superadmin guard และ structured audit` |
| Rate limit | Sensitive mutation routes enforce per-scope/user/IP windows and return rate-limit headers. | Burst requests return `429 RATE_LIMITED` with `Retry-After`. | `admin.user_role.update.rate_limited`, future `admin.*.rate_limited` | Restart API to clear in-memory buckets if misconfigured; then tune limits in code and redeploy. | `curl -i https://api.thefox.app/v1/admin/me` | `ทำ task Rate limit ต่อ: ทดสอบ sensitive mutation burst, Retry-After, audit row และ rollback note` |

## Performance Task Cards

| Task | Expected state | Error state | Audit event | Rollback note | Production verification command | Prompt |
| --- | --- | --- | --- | --- | --- | --- |
| Admin API baseline | `auth/me`, `admin/users`, and `admin/audit-logs` stay within the current post-deploy latency budget. | TTFB/regression spike, `5xx`, or payload growth that slows admin console load. | `admin.workspace.access`, `admin.users.list`, `admin.audit_logs.list` | Revert API/query change and redeploy; no schema rollback unless migration caused the regression. | `curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://api.thefox.app/v1/auth/me` | `ทำ task Admin API baseline ต่อ: วัด auth/me, admin/users, admin/audit-logs latency และ payload growth หลัง deploy` |
| Page budget | Admin/vendor pages remain responsive on mobile and avoid unnecessary heavy client bundles. | Static JS grows unexpectedly, page TTFB regresses, or mobile layout overlaps. | No DB audit expected; verification is route/static asset based. | Revert UI bundle-heavy change and redeploy web container. | `curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total} bytes=%{size_download}\n' https://admin.thefox.app` | `ทำ task Page budget ต่อ: ตรวจ admin/vendor page TTFB, bytes, bundle growth, mobile layout และ cache behavior` |
| Audit query plan | Audit log list uses bounded `page/pageSize` plus filters for `action`, `actorRole`, `resourceType`, `from`, and `to`. | Invalid `actorRole` returns `400`, page/pageSize are clamped, and empty result uses a clear empty state. | `admin.audit_logs.list` with `metadata.page`, `metadata.pageSize`, and `metadata.filters` | Revert audit API/UI query change and redeploy; keep existing audit rows intact. | `curl -i "https://api.thefox.app/v1/admin/audit-logs?page=1&pageSize=25&actorRole=superadmin"` | `ทำ task Audit query plan ต่อ: ตรวจ audit filters, pagination, invalid actorRole, empty state, audit metadata และ query plan` |
| Database performance baseline & index plan | Prisma schema has indexes for current admin, audit, tenant, product, and order hot paths, with production query plans checked before larger inventory ledger work. | Migration fails, expected index is missing, query plan still scans more than needed, or write paths regress. | No DB audit expected for index creation; runtime endpoints still emit `admin.users.list`, `admin.tenants.list`, and `admin.audit_logs.list`. | Drop only the indexes introduced by this task or revert the migration before production deploy; never remove business rows. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -c 'EXPLAIN ANALYZE SELECT * FROM \"AuditLog\" WHERE \"actorRole\" = ''superadmin'' ORDER BY \"createdAt\" DESC LIMIT 25;'"` | `ทำ task Database performance baseline & index plan ต่อ: วัด EXPLAIN ANALYZE, migrate status, index presence, latency baseline และ update status การ์ด` |
| Route cold start | Public workspace routes and API health return healthy status after container recreate. | Web/API container starts but first response fails or exceeds cold budget. | No DB audit expected for health/static route checks. | Restart only `thefox-app-web-1`/`thefox-app-api-1`; rollback last deploy if cold failure persists. | `curl -fsS https://api.thefox.app/health && curl -fsSI https://admin.thefox.app` | `ทำ task Route cold start ต่อ: recreate/restart เฉพาะ thefox web/api แล้ววัด first response และ rollback path` |
| DB connection safety | API startup, migrations, and Prisma client behavior stay stable during deploy. | Migrate fails, connection pool error, or app starts with schema mismatch. | Migration failures appear in deploy logs; runtime audit may be unavailable if DB is down. | Resolve failed migration carefully, or redeploy previous image without touching other VPS services. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml run --rm api npx prisma migrate status --schema apps/api/prisma/schema.prisma"` | `ทำ task DB connection safety ต่อ: ตรวจ migrate status, Prisma startup, connection pool behavior และ schema mismatch risk` |

## System Program Cards

These cards are recurring program tracks. They are not one-off feature tasks; use them to choose the next concrete task and keep security, optimization, business logic, reliability, compliance, reporting, and QA moving together.

| Program | Expected state | Error state | Audit event | Rollback note | Production verification command | Prompt |
| --- | --- | --- | --- | --- | --- | --- |
| Security pentest program | Every protected surface has a pentest checklist, production command, audit expectation, and latest result. | Route bypass, tenant data leak, forged session acceptance, unexpected CORS allow-origin, or important mutation without guard. | `admin.workspace.access.*`, `vendor.workspace.access.*`, `admin.*.forbidden`, `admin.*.csrf_rejected`, `admin.*.rate_limited` | Stop risky workflow, revert only guard/CORS/session change, then redeploy only theFOX web/API. | `rg -n 'requireRole|requireMutationProtection|cors|cookieOptions|writeAuditLog' apps/api/src/server.ts` | `ทำ program Security pentest ต่อ: แตก task route isolation, role bypass, tenant ownership bypass, CSRF, rate limit, cookie/CORS/session, secrets exposure พร้อม verify production` |
| Performance optimization program | Baseline p50/p95, endpoint/page budgets, important query plans, and regression gate exist before and after deploy. | TTFB spike, bundle growth, heavy scans, connection pool errors, cold start failure, or oversized payloads. | No DB audit expected for measurement; runtime endpoints still emit their normal audit events. | Revert latency/bundle/query regression and redeploy; schema rollback only when migration caused the regression. | `curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total} bytes=%{size_download}\n' https://admin.thefox.app` | `ทำ program Performance optimization ต่อ: วัด API/page/DB/cache/cold start/payload baseline, เพิ่ม budget gate และอัปเดตการ์ดตามผล production` |
| Business logic integrity program | Every business transition has a state machine, permission rule, transaction boundary, audit event, and rollback note. | Stock leaves ledger, order does not reserve stock, owner/member scope is wrong, transfer variance disappears, or settlement cannot be traced. | `admin.tenant_status.update`, `admin.branch_status.update`, future `stock.*`, `order.*`, `settlement.*` | Disable broken mutation path, preserve audit/ledger evidence, and use compensating adjustments instead of deleting history. | `rg -n 'TenantStatus|BranchStatus|StockLedger|BranchStockBalance|settlement|order' apps/api/prisma/schema.prisma docs/product-system` | `ทำ program Business logic integrity ต่อ: วาง state/permission/transaction/audit สำหรับ tenant, branch, inventory, transfer, order และ settlement` |
| Operations reliability program | Production runbook names service/port, health command, rollback command, migration safety, and VPS isolation rules. | Deploy touches wrong service, rollback is unclear, health checks are insufficient, or migration fails without recovery path. | No app audit expected for deploy operations; evidence comes from deploy logs, `docker ps`, health checks, and migration status. | Roll back only theFOX web/API image or related migration; do not restart/drop unrelated VPS services. | `ssh root@187.77.158.181 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"` | `ทำ program Operations reliability ต่อ: สร้าง/ตรวจ runbook deploy, rollback, health, logs, migration safety และ VPS service isolation` |
| Compliance audit program | Critical actions have searchable audit events with actor/resource/route/method/metadata and retention direction. | Important action lacks audit, metadata is unstructured, permission history is hard to trace, or audit growth has no retention plan. | `auth.*`, `admin.*`, `vendor.*`, `driver.*`, future `stock.*`, `order.*`, `settlement.*` | Never delete audit rows; rollback only code that emitted wrong audit and add compensating audit note if required. | `curl -i "https://api.thefox.app/v1/admin/audit-logs?page=1&pageSize=25"` | `ทำ program Compliance audit ต่อ: ตรวจ audit coverage, structured metadata, permission history, retention/archive และ export traceability` |
| Data reporting accuracy program | Important reports have source of truth, reconciliation rule, indexed query/read model, and production verification command. | Stock/sales/profit disagrees with ledger, report query is heavy, summary cannot rebuild, or tenant health misses required data. | No audit expected for read-only reports; adjustments and rebuild actions must emit future `report.*` or `stock.*` events. | Revert report query/read model change; rebuild summaries from source of truth instead of manually editing numbers. | `rg -n 'StockLedger|BranchStockBalance|daily|summary|report|profit|cost' docs/product-system apps/api/prisma/schema.prisma` | `ทำ program Data reporting accuracy ต่อ: วาง stock/sales/profit reports, daily summaries, read models, reconciliation และ slow report prevention` |
| QA regression program | Every deploy has local verification, production smoke, task card status update, and repeatable regression checklist. | Guard has no test, deploy passes but smoke fails, card status is stale, or production behavior diverges from docs. | No DB audit expected for test runs; failed protected requests should still emit route-specific audit events. | Roll back last theFOX deploy if production regresses, then open/update task card with command evidence. | `npm run typecheck` | `ทำ program QA regression ต่อ: วาง auth/role/API/mutation/migration/production smoke/visual responsive checklist และ update card status ทุก task` |

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

1. Use the System Track Board to choose the next concrete task.
2. Keep every task card updated with status, expected, error, audit, rollback, verify, and prompt.
3. Build tenant and branch admin UX with empty/loading/error states.
4. Add vendor inventory data model for units, SKU, stock ledger, and branch transfer.
5. Run route/auth/CORS pentest and performance checks against production after every deploy milestone.
