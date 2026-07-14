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

## Latest Operational Acceptance Verification

Recorded on July 14, 2026. The admin task board was checked for acceptance completeness before continuing UX/business-flow work.

| Check | Result |
| --- | --- |
| Readiness task cards | 7 cards checked; every card has `status`, `expectedState`, `errorState`, `auditEvent`, `rollbackNote`, `verificationCommand`, and `prompt`. |
| System program cards | 20 cards checked; every program card has `status`, `expectedState`, `errorState`, `auditEvent`, `rollbackNote`, `verificationCommand`, and `prompt`. |
| Latest readiness status | Tenant/branch approval, workspace route/auth, admin API/page budget, mutation protection, audit filters, database performance, operational acceptance, security pentest, and performance optimization are `Verified`. |
| Production safety rule | Verification/deploy commands remain scoped to `thefox-app` web/API/database paths and keep unrelated VPS services isolated. |

## Pentest Task Cards

| Task | Expected state | Error state | Audit event | Rollback note | Production verification command | Prompt |
| --- | --- | --- | --- | --- | --- | --- |
| Route isolation | Customer/lower roles cannot access admin, vendor, or driver data by URL guessing. | Unauthenticated requests return `401`; forbidden roles return `403`; forged cookies fail session verification. | `admin.workspace.access.unauthenticated`, `vendor.workspace.access.forbidden`, `driver.workspace.access.forbidden` | Revert route/auth guard changes and redeploy only `thefox-app` web/api containers. | `curl -i https://api.thefox.app/v1/admin/me` | `ทำ task Route isolation ต่อ: ทดสอบ URL guessing, unauth, forbidden roles, forged cookie และ audit events` |
| Subdomain redirects | `thefox.app/admin`, `/vendor`, and `/driver` redirect to canonical workspace subdomains. | Missing/incorrect redirect, internal port exposure, or workspace content served from root path. | No DB audit expected; edge/proxy behavior is verified through response headers. | Revert `apps/web/proxy.ts` and redeploy web container. | `curl -fsSI https://thefox.app/admin` | `ทำ task Subdomain redirects ต่อ: ตรวจ root workspace redirects ไป admin/vendor/driver subdomains และ update card status` |
| Cookie scope | Auth and OAuth cookies work across `.thefox.app` and remain `HttpOnly`, `Secure`, `SameSite=Lax`. | Cookie missing secure flags, wrong domain, or workspace cannot read authenticated session via API. | `auth.login`, `auth.logout` | Revert cookie domain/env change and redeploy API with previous `AUTH_COOKIE_DOMAIN`. | `curl -i https://api.thefox.app/v1/auth/google/start` | `ทำ task Cookie scope ต่อ: ตรวจ cookie domain, Secure, HttpOnly, SameSite และ workspace session behavior` |
| CORS | API allows only approved workspace origins and permits mutation token headers. | Unexpected origin gets no `Access-Control-Allow-Origin`; browser preflight for mutation fails if methods/headers are incomplete. | No DB audit expected for preflight; failed mutation requests audit at route level. | Revert CORS config in API and redeploy API container. | `curl -i -X OPTIONS https://api.thefox.app/v1/admin/users/example/role -H 'Origin: https://admin.thefox.app' -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type,x-thefox-mutation-token'` | `ทำ task CORS ต่อ: ตรวจ allowed origins, mutation token headers, preflight และ failed mutation audit` |
| Role bypass | Admin-only APIs reject customer/vendor/driver; superadmin-only APIs reject admin/lower roles. | Lower role gets `403`; self-demote is blocked; missing target returns `404`. | `*.forbidden`, `admin.user_role.update.self_demote_blocked`, `admin.user_role.update.missing_target` | Revert role guard change and redeploy API; never manually edit production roles except emergency break-glass. | `curl -i https://api.thefox.app/v1/admin/users` | `ทำ task Role bypass ต่อ: ทดสอบ admin-only/superadmin-only APIs, self-demote block, missing target และ audit` |
| Tenant ownership bypass | Vendor-scoped users can only see their own tenant membership surface and cannot call admin tenant APIs. | Vendor/customer/driver get `403` on `/v1/admin/tenants`; future vendor tenant APIs must filter by `VendorMembership.tenantId`. | `admin.tenants.list.forbidden`, `vendor.workspace.access`, future `vendor.scope_denied` | Disable the leaking tenant route, preserve audit evidence, and redeploy only theFOX API/web. | `curl -i https://api.thefox.app/v1/admin/tenants -H 'Cookie: thefox_auth_session=<vendor-session>'` | `ทำ task Tenant ownership bypass ต่อ: ทดสอบ vendor/customer/driver ไม่เห็น admin tenant data, vendor scope เฉพาะ tenant ตัวเอง และ audit` |
| Audit trail | Forbidden access, login/logout, role change, tenant/branch actions, CSRF rejection, and rate limit events write rows. | Expected action missing, metadata is unstructured, or actor/resource fields are empty when they should be populated. | `auth.login`, `auth.logout`, `admin.user_role.update`, `admin.tenant_status.update`, `admin.user_role.update.csrf_rejected`, `*.rate_limited` | Keep audit rows; rollback only code that failed to emit them and redeploy API. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -P pager=off -c 'SELECT action, \"actorRole\", \"resourceType\", \"createdAt\" FROM \"AuditLog\" ORDER BY \"createdAt\" DESC LIMIT 10;'"` | `ทำ task Audit trail ต่อ: ตรวจ forbidden/login/logout/role/tenant/branch/CSRF/rate-limit audit rows และ metadata` |
| Mutation protection | Every state-changing admin request requires a valid signed mutation token bound to current user and role. | Missing/expired/wrong-role token returns `403 MUTATION_TOKEN_REQUIRED`. | `admin.*.csrf_rejected` | Revert mutation guard commit and redeploy API/web together; do not remove audit evidence. | `curl -i https://api.thefox.app/v1/admin/tenants -X POST -H 'Content-Type: application/json' --data '{"name":"csrf-test","slug":"csrf-test"}'` | `ทำ task Mutation protection ต่อ: ตรวจ signed mutation token, rate limit, destructive superadmin guard และ structured audit` |
| Rate limit | Sensitive mutation routes enforce per-scope/user/IP windows and return rate-limit headers. | Burst requests return `429 RATE_LIMITED` with `Retry-After`. | `admin.user_role.update.rate_limited`, future `admin.*.rate_limited` | Restart API to clear in-memory buckets if misconfigured; then tune limits in code and redeploy. | `curl -i https://api.thefox.app/v1/admin/me` | `ทำ task Rate limit ต่อ: ทดสอบ sensitive mutation burst, Retry-After, audit row และ rollback note` |
| Session integrity | Forged or malformed auth cookies are rejected and OAuth state cookies are scoped, secure, and short-lived. | Forged cookie authenticates, OAuth state lacks `HttpOnly`/`Secure`/`SameSite=Lax`, or cookie domain is not `.thefox.app`. | `admin.workspace.access.unauthenticated`, `auth.login`, `auth.logout` | Rotate `AUTH_SESSION_SECRET`, revert cookie config, and redeploy API; invalidate active sessions if forgery is suspected. | `curl -i https://api.thefox.app/v1/admin/me -H 'Cookie: thefox_auth_session=forged.invalid'` | `ทำ task Session integrity ต่อ: ตรวจ forged cookie, OAuth state cookie flags, session domain และ auth audit` |
| Secrets exposure | Runtime secrets stay server-only; public bundles and repository examples do not contain live secret values. | Client HTML includes secret names/values, env file is world-readable, or repo contains a live secret instead of placeholders. | No app audit expected; evidence is file permission, bundle scan, and repository scan output. | Rotate exposed secret, purge public artifact/history as needed, and redeploy only affected service. | `curl -fsS https://admin.thefox.app | rg 'AUTH_SESSION_SECRET|DATABASE_URL|GOOGLE_CLIENT_SECRET|LINE_CHANNEL_SECRET'` | `ทำ task Secrets exposure ต่อ: ตรวจ client bundle, repo scan, VPS env permission, redacted env presence และ rotation note` |

## Latest Security Pentest Verification

Recorded on July 14, 2026. Production pentest used temporary `pentest-security-*` users and tenant data, then cleaned up those rows immediately. Audit rows were preserved as evidence.

| Control | Production result |
| --- | --- |
| Route isolation | Unauthenticated and forged-cookie `/v1/admin/me` returned `401`; customer/vendor/driver sessions returned `403`. |
| Role bypass | Customer, vendor, and driver were blocked from admin workspace; vendor and driver could access only their own workspace role surface. |
| Tenant ownership bypass | Temporary vendor session received `403` from `/v1/admin/tenants`; vendor workspace returned only the vendor membership surface. |
| CSRF/signed mutation token | Superadmin session without `X-TheFox-Mutation-Token` on tenant create returned `403 MUTATION_TOKEN_REQUIRED`. |
| Rate limit | Burst against `admin.user_role.update` ended with `429 RATE_LIMITED` and `Retry-After`. |
| CORS | `https://admin.thefox.app` preflight returned `204` with matching allow-origin; `https://evil.example` had no `Access-Control-Allow-Origin`. |
| Cookie/session | Google OAuth state cookie returned `Domain=.thefox.app`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=600`; forged session cookie stayed unauthenticated. |
| Subdomain routing | `https://thefox.app/admin` returned `308` to `https://admin.thefox.app/`. |
| Secrets exposure | Production admin HTML did not include `AUTH_SESSION_SECRET`, `DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, `LINE_CHANNEL_SECRET`, or `THEFOX_POSTGRES_PASSWORD`; `/opt/thefox/.env.thefox.app` is `600 root:root`; runtime env presence was checked with values redacted. |
| Cleanup | Temporary pentest users and tenants were removed: `remainingUsers=0`, `remainingTenants=0`. |
| Audit evidence | Recent audit rows included `admin.workspace.access.unauthenticated`, `admin.workspace.access.forbidden`, `vendor.workspace.access`, `driver.workspace.access`, `admin.tenant.create.csrf_rejected`, and `admin.user_role.update.rate_limited`. |

## Latest Mutation Protection Verification

Recorded on July 14, 2026. Mutation token parsing now fails closed: malformed signed-token payloads return the normal mutation rejection path instead of throwing during JSON decode.

| Control | Expected production result |
| --- | --- |
| Signed mutation token | Admin `POST`/`PATCH` routes require `X-TheFox-Mutation-Token` bound to the authenticated user id and role. |
| Malformed token hardening | Bad token bodies resolve to `403 MUTATION_TOKEN_REQUIRED` and write `admin.*.csrf_rejected`. |
| Rate limit | Sensitive mutation scopes emit `429 RATE_LIMITED`, `Retry-After`, and `*.rate_limited` audit metadata when burst limits are exceeded. |
| Destructive guard | Tenant `suspended`, branch `closed`, and superadmin role changes require superadmin and emit structured denial events when blocked. |
| Structured metadata | Mutation audit rows include `operation`, `target`, `before`, `after`, `security`, and `input` objects where applicable. |

Production smoke results:
- CORS preflight for `PATCH` with `content-type,x-thefox-mutation-token` returned `204` with `Access-Control-Allow-Origin: https://admin.thefox.app`.
- Missing mutation token returned `403`; malformed but correctly signed non-JSON token returned `403`.
- Burst test against `admin.user_role.update` returned `429` after the mutation scope limit and wrote `admin.user_role.update.rate_limited`.
- Audit evidence included `admin.user_role.update.csrf_rejected` with `security.hasToken` false and true cases.
- Destructive lower-admin runtime denial is code-covered, but production currently has only one `superadmin` and no separate `admin` account for a no-data-change live denial test.

## Performance Task Cards

| Task | Expected state | Error state | Audit event | Rollback note | Production verification command | Prompt |
| --- | --- | --- | --- | --- | --- | --- |
| Admin API baseline | `auth/me`, `admin/users`, and `admin/audit-logs` stay within the current post-deploy latency budget. | TTFB/regression spike, `5xx`, or payload growth that slows admin console load. | `admin.workspace.access`, `admin.users.list`, `admin.audit_logs.list` | Revert API/query change and redeploy; no schema rollback unless migration caused the regression. | `curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total}\n' https://api.thefox.app/v1/auth/me` | `ทำ task Admin API baseline ต่อ: วัด auth/me, admin/users, admin/audit-logs latency และ payload growth หลัง deploy` |
| Page budget | Admin/vendor pages remain responsive on mobile and avoid unnecessary heavy client bundles. | Static JS grows unexpectedly, page TTFB regresses, or mobile layout overlaps. | No DB audit expected; verification is route/static asset based. | Revert UI bundle-heavy change and redeploy web container. | `curl -sS -o /dev/null -w 'ttfb=%{time_starttransfer} total=%{time_total} bytes=%{size_download}\n' https://admin.thefox.app` | `ทำ task Page budget ต่อ: ตรวจ admin/vendor page TTFB, bytes, bundle growth, mobile layout และ cache behavior` |
| Audit query plan | Audit log list uses bounded `page/pageSize` plus filters for `action`, `actorRole`, `resourceType`, `from`, and `to`. | Invalid `actorRole` returns `400`, page/pageSize are clamped, and empty result uses a clear empty state. | `admin.audit_logs.list` with `metadata.page`, `metadata.pageSize`, and `metadata.filters` | Revert audit API/UI query change and redeploy; keep existing audit rows intact. | `curl -i "https://api.thefox.app/v1/admin/audit-logs?page=1&pageSize=25&actorRole=superadmin"` | `ทำ task Audit query plan ต่อ: ตรวจ audit filters, pagination, invalid actorRole, empty state, audit metadata และ query plan` |
| Database performance baseline & index plan | Prisma schema has indexes for current admin, audit, tenant, product, and order hot paths, with production query plans checked before larger inventory ledger work. | Migration fails, expected index is missing, query plan still scans more than needed, or write paths regress. | No DB audit expected for index creation; runtime endpoints still emit `admin.users.list`, `admin.tenants.list`, and `admin.audit_logs.list`. | Drop only the indexes introduced by this task or revert the migration before production deploy; never remove business rows. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -c 'EXPLAIN ANALYZE SELECT * FROM \"AuditLog\" WHERE \"actorRole\" = ''superadmin'' ORDER BY \"createdAt\" DESC LIMIT 25;'"` | `ทำ task Database performance baseline & index plan ต่อ: วัด EXPLAIN ANALYZE, migrate status, index presence, latency baseline และ update status การ์ด` |
| Route cold start | Public workspace routes and API health return healthy status after container recreate. | Web/API container starts but first response fails or exceeds cold budget. | No DB audit expected for health/static route checks. | Restart only `thefox-app-web-1`/`thefox-app-api-1`; rollback last deploy if cold failure persists. | `curl -fsS https://api.thefox.app/health && curl -fsSI https://admin.thefox.app` | `ทำ task Route cold start ต่อ: recreate/restart เฉพาะ thefox web/api แล้ววัด first response และ rollback path` |
| DB connection safety | API startup, migrations, and Prisma client behavior stay stable during deploy. | Migrate fails, connection pool error, or app starts with schema mismatch. | Migration failures appear in deploy logs; runtime audit may be unavailable if DB is down. | Resolve failed migration carefully, or redeploy previous image without touching other VPS services. | `ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml run --rm api npx prisma migrate status --schema apps/api/prisma/schema.prisma"` | `ทำ task DB connection safety ต่อ: ตรวจ migrate status, Prisma startup, connection pool behavior และ schema mismatch risk` |

## Latest Production Baselines

Recorded on July 14, 2026 after restarting only `thefox-app-web-1` and `thefox-app-api-1`.

| Surface | Result |
| --- | --- |
| Public `auth/me` unauthenticated | `401`, TTFB `0.167s`, `27` bytes |
| Admin page warm | `200`, TTFB `0.174s`, total `0.185s`, HTML `55482` bytes, `x-nextjs-cache: HIT` |
| Admin page cold after restart | `200`, TTFB `0.357s`, total `0.367s`, HTML `55482` bytes |
| API health cold after restart | `200`, TTFB `0.655s`, total `0.655s`, `52` bytes |
| Authenticated `admin/me` after restart | `200`, `98.68ms`, `825` bytes |
| Authenticated `admin/users` after restart | `200`, `23.69ms`, `578` bytes |
| Authenticated `admin/audit-logs?page=1&pageSize=25` after restart | `200`, `49.24ms`, `12213` bytes |
| Admin static assets | 1 CSS `44589` bytes; 8 JS chunks totaling about `655KB` downloaded |

## Latest Performance Optimization Verification

Recorded on July 14, 2026. A repeatable budget gate is available as `npm run performance:budget`; authenticated admin checks run when `THEFOX_AUTH_SESSION` is set.

| Check | Production result |
| --- | --- |
| Budget gate, public | `api_health` `200` total `479.7ms`, `52` bytes; `auth_me_unauth` `401` total `93.0ms`, `27` bytes; `admin_page` `200` total `334.9ms`, `89980` bytes, `x-nextjs-cache=HIT`. |
| Budget gate, authenticated | `admin_me` `200` total `117.1ms`, `825` bytes; `admin_users` `200` total `101.7ms`, `578` bytes; `admin_audit_logs` `200` total `132.0ms`, `13502` bytes. |
| VPS loopback API warm | `health` total `0.001864s`; `admin/me` total `0.010342s`; `admin/users` total `0.008207s`; `admin/tenants` total `0.008408s`; `admin/audit-logs` total `0.010236s`. |
| Page/cache warm | Admin page loopback returned `200`, `x-nextjs-cache: HIT`, `Cache-Control: s-maxage=31536000`, and `Content-Length: 89980`. |
| DB query plan | Latest audit feed used `Index Scan Backward using "AuditLog_createdAt_idx"`; planning `1.763ms`, execution `0.067ms`. |
| Cold readiness | Immediate request during restart can reset while the container socket opens; first ready loop passed on attempt `1`, then `health` total `0.002140s` and admin page total `0.007151s` with cache `HIT`. |
| Payload budgets | Public admin HTML is below the `160KB` budget; authenticated admin JSON payloads are below their route budgets. |

## Latest Database Performance Verification

Recorded on July 14, 2026. Production migrations are current, all expected hot-path indexes are present, and the current sparse production dataset has sub-millisecond DB execution for the checked admin/audit/tenant/product/order paths.

| Check | Production result |
| --- | --- |
| Prisma migrate status | `Database schema is up to date!`; 5 migrations found. |
| Index presence | 17 expected indexes present across `User`, `Tenant`, `Branch`, `VendorMembership`, `AuditLog`, `Product`, `Order`, and `OrderItem`. |
| `AuditLog` actor-role feed | `Index Scan Backward using "AuditLog_createdAt_idx"`; execution `0.106ms` for latest 25 superadmin rows. |
| Admin user list | Planner used sequential scan on the current 1-row table; execution `0.069ms`; `User_createdAt_idx` and `User_role_createdAt_idx` are present for scale. |
| Tenant status list | `Bitmap Index Scan on "Tenant_status_createdAt_idx"`; execution `0.052ms`. |
| Product tenant active list | Used `Product_tenantId_idx`; execution `0.045ms`; composite tenant/category/active indexes are present for populated tenants. |
| Order status list | `Bitmap Index Scan on "Order_status_createdAt_idx"`; execution `0.052ms`. |
| Production row counts | `User:1`, `Tenant:0`, `Branch:0`, `Product:0`, `Order:0`, `AuditLog:246`. |
| Local VPS API baseline | `admin/me` `200` total `0.007079s`; `admin/users` `200` total `0.005474s`; `admin/tenants` `200` total `0.006153s`; filtered `admin/audit-logs` `200` total `0.007478s`. |

## Latest Audit Filter Verification

Recorded on July 14, 2026. Audit log filters and pagination are now verified as a bounded admin-only workflow.

| Control | Expected production result |
| --- | --- |
| Admin-only guard | `/v1/admin/audit-logs` requires `admin` or `superadmin`; unauthenticated requests return `401`. |
| Filter metadata | Successful reads write `admin.audit_logs.list` with `metadata.page`, `metadata.pageSize`, and `metadata.filters`. |
| Invalid role filter | Bad `actorRole` returns `400 INVALID_ACTOR_ROLE` and writes `admin.audit_logs.list.invalid_filter`. |
| Pagination bounds | `pageSize` is clamped to `5..100`; over-large requested pages clamp to the last available page and write `admin.audit_logs.list.page_clamped`. |
| Admin UX | Filters support action, actor role, resource, date range, page size, empty state, previous/next, first/last, and visible result range. |

## System Program Cards

These cards are recurring program tracks. They are not one-off feature tasks; use them to choose the next concrete task and keep security, optimization, business logic, reliability, compliance, reporting, and QA moving together.

| Program | Expected state | Error state | Audit event | Rollback note | Production verification command | Prompt |
| --- | --- | --- | --- | --- | --- | --- |
| Security pentest program | Every protected surface has a pentest checklist, production command, audit expectation, and latest result. | Route bypass, tenant data leak, forged session acceptance, unexpected CORS allow-origin, or important mutation without guard. | `admin.workspace.access.*`, `vendor.workspace.access.*`, `admin.*.forbidden`, `admin.*.csrf_rejected`, `admin.*.rate_limited` | Stop risky workflow, revert only guard/CORS/session change, then redeploy only theFOX web/API. | `rg -n 'requireRole|requireMutationProtection|cors|cookieOptions|writeAuditLog' apps/api/src/server.ts` | `ทำ program Security pentest ต่อ: แตก task route isolation, role bypass, tenant ownership bypass, CSRF, rate limit, cookie/CORS/session, secrets exposure พร้อม verify production` |
| Multi-tenant isolation program | Tenant data boundary, branch scope, owner/member permissions, query-level guard, and cross-tenant leak tests are explicit. | User sees another tenant, owner/member scope is wrong, branch transfer bypasses scope, or reports merge tenant data incorrectly. | Future `tenant_scope.*`, `vendor.scope_denied`, `admin.cross_tenant_review.*`, `report.scope_guard.*` | Stop leaking workflow, preserve audit evidence, revert guard/query change, and redeploy only theFOX web/API. | `rg -n 'tenantId|branchId|vendorMembership|requireRole|owner|member' apps/api/src apps/api/prisma/schema.prisma` | `ทำ program Multi-tenant isolation ต่อ: ตรวจ tenant data boundary, branch scope, owner/member permission, query guard และ cross-tenant leak tests` |
| Performance optimization program | Baseline p50/p95, endpoint/page budgets, important query plans, and regression gate exist before and after deploy. | TTFB spike, bundle growth, heavy scans, connection pool errors, cold start failure, or oversized payloads. | No DB audit expected for measurement; runtime endpoints still emit their normal audit events. | Revert latency/bundle/query regression and redeploy; schema rollback only when migration caused the regression. | `npm run performance:budget` | `ทำ program Performance optimization ต่อ: วัด API/page/DB/cache/cold start/payload baseline, เพิ่ม budget gate และอัปเดตการ์ดตามผล production` |
| Business logic integrity program | Every business transition has a state machine, permission rule, transaction boundary, audit event, and rollback note. | Stock leaves ledger, order does not reserve stock, owner/member scope is wrong, transfer variance disappears, or settlement cannot be traced. | `admin.tenant_status.update`, `admin.branch_status.update`, future `stock.*`, `order.*`, `settlement.*` | Disable broken mutation path, preserve audit/ledger evidence, and use compensating adjustments instead of deleting history. | `rg -n 'TenantStatus|BranchStatus|StockLedger|BranchStockBalance|settlement|order' apps/api/prisma/schema.prisma docs/product-system` | `ทำ program Business logic integrity ต่อ: วาง state/permission/transaction/audit สำหรับ tenant, branch, inventory, transfer, order และ settlement` |
| Inventory truth & ledger program | Unit conversion, SKU, stock ledger, reserved stock, transfer, stock take, and adjustments are the stock source of truth. | Stock on hand disagrees with ledger, reserved stock goes negative, transfer does not balance, or unit conversion corrupts cost/profit. | Future `stock.ledger.write`, `stock.reserve`, `stock.release`, `stock.transfer`, `stock.adjustment`, `stock_take.close` | Never edit stock numbers directly; use compensating ledger entries and keep adjustment evidence. | `rg -n 'StockLedger|BranchStockBalance|reserved|unit|SKU|stock_take|transfer' docs/product-system apps/api/prisma/schema.prisma` | `ทำ program Inventory truth & ledger ต่อ: วาง unit/SKU/ledger/reserved/transfer/stock take/adjustment พร้อม audit และ reconciliation` |
| Settlement & payout integrity program | Cost, profit, platform fee, tenant payable, rider payout, refund, adjustment, and dispute calculations are replayable. | Profit/cost mismatch, duplicate payout, refund hits the wrong account, fee version is unclear, or disputes cannot close cleanly. | Future `settlement.calculate`, `settlement.adjust`, `payout.schedule`, `payout.release`, `refund.issue`, `dispute.close` | Use settlement adjustments instead of deleting history; rollback rule versions while keeping ledger evidence. | `rg -n 'settlement|payout|platform fee|profit|cost|refund|dispute' docs/product-system apps/api/prisma/schema.prisma` | `ทำ program Settlement & payout integrity ต่อ: วาง cost/profit/platform fee/tenant payable/rider payout/refund/dispute พร้อม audit` |
| Algorithm engine program | Algorithm work starts after business state rules are explicit; inventory truth, delivery assignment, tenant health, ranking, risk, margin guard, and recommendations are explainable and deterministic. | Score/ranking cannot be explained, stock truth is wrong, assignment ignores capacity/SLA/cost, margin guard is bypassed, or recommendation crosses tenant/permission boundaries. | Future `algorithm.inventory_truth.*`, `algorithm.delivery_assignment.*`, `algorithm.tenant_health.*`, `algorithm.ranking.*`, `algorithm.risk.*` | Disable the algorithm flag or revert rule version, fall back to deterministic manual/business rules, and keep score/audit evidence for review. | `rg -n 'algorithm|ranking|score|assignment|reserved|margin|recommendation' docs/product-system apps/api/prisma/schema.prisma apps/api/src` | `ทำ program Algorithm engine ต่อ: วาง inventory truth, delivery assignment, tenant health score, ranking, risk scoring, margin guard และ recommendation rules พร้อม audit/rollback/verification` |
| Marketplace intelligence program | Demand/supply matching, product/vendor ranking, freshness score, near-expiry handling, and out-of-stock substitution are explainable. | Sold-out products are recommended, ranking pushes negative-margin items, freshness is ignored, or substitution corrupts order/stock. | Future `marketplace.rank`, `marketplace.substitute`, `marketplace.freshness_score`, `marketplace.supply_match` | Disable ranking/substitution rule and fall back to deterministic stock-readiness and distance sorting. | `rg -n 'ranking|freshness|substitution|out-of-stock|demand|supply|margin' docs/product-system apps/api/src` | `ทำ program Marketplace intelligence ต่อ: วาง demand/supply matching, product/vendor ranking, freshness score, near-expiry และ substitution rules` |
| Freshness & cold-chain program | Freshness grade, expiry window, cold-chain evidence, quality check, and reject/claim paths exist for fresh goods. | Expired goods sell, cold-chain evidence is missing, quality reject does not fix stock/payment, or freshness score is not explainable. | Future `freshness.grade`, `cold_chain.evidence`, `quality_check.pass`, `quality_check.reject`, `claim.freshness` | Pause risky lot/branch, preserve evidence, and use stock adjustment/refund/dispute instead of deleting history. | `rg -n 'freshness|expiry|cold|quality|claim|lot|temperature' docs/product-system apps/api/prisma/schema.prisma` | `ทำ program Freshness & cold-chain ต่อ: วาง freshness grade, expiry window, cold-chain evidence, quality check และ claim path` |
| Trust score & risk engine program | Customer, vendor, driver, tenant, payment/refund abuse, and role/audit anomaly risk scores are explainable. | Risk score is opaque, false positives are high, refund abuse is missed, role anomaly is not alerted, or blocks cannot be rolled back. | Future `risk.customer_score`, `risk.vendor_score`, `risk.driver_score`, `risk.refund_abuse`, `risk.role_anomaly` | Reduce threshold or disable rule version, route to manual review, and keep score evidence. | `rg -n 'risk|fraud|abuse|anomaly|score|refund|role' docs/product-system apps/api/src apps/api/prisma/schema.prisma` | `ทำ program Trust score & risk engine ต่อ: วาง customer/vendor/driver/tenant risk, refund abuse, role anomaly และ review workflow` |
| Operations reliability program | Production runbook names service/port, health command, rollback command, migration safety, and VPS isolation rules. | Deploy touches wrong service, rollback is unclear, health checks are insufficient, or migration fails without recovery path. | No app audit expected for deploy operations; evidence comes from deploy logs, `docker ps`, health checks, and migration status. | Roll back only theFOX web/API image or related migration; do not restart/drop unrelated VPS services. | `ssh root@187.77.158.181 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"` | `ทำ program Operations reliability ต่อ: สร้าง/ตรวจ runbook deploy, rollback, health, logs, migration safety และ VPS service isolation` |
| Vendor operations excellence program | Vendor onboarding, branch readiness, product completeness, stock discipline, fulfillment SLA, and vendor health coaching are trackable. | Branch opens before ready, product data is incomplete, stock updates are inconsistent, or fulfillment SLA drops without action. | Future `vendor.readiness.update`, `vendor.coaching.note`, `branch.readiness.approve`, `product.completeness.review` | Move branch/tenant status back to pending/paused and keep coaching/audit notes. | `rg -n 'vendor|tenant|branch|readiness|SLA|product completeness|stock discipline' docs/product-system apps/api/src` | `ทำ program Vendor operations excellence ต่อ: วาง onboarding/readiness/product completeness/stock discipline/SLA/vendor health coaching` |
| Driver/rider dispatch reliability program | Driver availability, batching, assignment, ETA, proof of pickup/dropoff, failed delivery, and handoff are reliable. | Unavailable driver is assigned, ETA is wrong, batching harms fresh goods, proof is missing, or failed delivery does not compensate order/stock. | Future `dispatch.assign`, `dispatch.reassign`, `delivery.pickup_proof`, `delivery.dropoff_proof`, `delivery.failed` | Disable auto-dispatch rule, return to manual assignment, preserve proof, and write compensating delivery/order events. | `rg -n 'driver|rider|dispatch|assignment|ETA|pickup|dropoff|delivery' docs/product-system apps/api/prisma/schema.prisma` | `ทำ program Driver/rider dispatch reliability ต่อ: วาง availability/batching/assignment/ETA/proof/failed delivery/handoff` |
| Customer trust & issue resolution program | Refund, spoiled-goods claim, evidence photo, SLA, complaint, dispute timeline, and customer communication are trackable. | Claim lacks evidence, refund breaks settlement, complaint disappears, SLA misses escalation, or dispute cannot close completely. | Future `issue.create`, `issue.evidence.add`, `issue.escalate`, `refund.approve`, `dispute.resolve` | Never delete issue timeline; use adjustment/refund reversal and compensating audit note when fixing mistakes. | `rg -n 'issue|claim|refund|complaint|dispute|SLA|evidence' docs/product-system apps/api/src apps/api/prisma/schema.prisma` | `ทำ program Customer trust & issue resolution ต่อ: วาง refund/claim/evidence/SLA/complaint/dispute timeline และ escalation` |
| Observability & incident command program | Critical paths have health, logs, metrics, alerts, error budget, incident timeline, postmortem, and rollback drill. | Outage is invisible, alert noise is high, logs lack correlation id, rollback drill is untested, or postmortem does not create tasks. | No app audit expected for observability setup; incident evidence comes from logs, metrics, deploy records, and postmortems. | Roll back only monitoring config/agent/dashboard changes that harm performance; do not touch business data. | `rg -n 'health|log|metric|alert|incident|postmortem|rollback|correlation' docs scripts apps/api/src` | `ทำ program Observability & incident command ต่อ: วาง health/logs/metrics/alerts/error budget/incident timeline/postmortem/rollback drill` |
| Compliance audit program | Critical actions have searchable audit events with actor/resource/route/method/metadata and retention direction. | Important action lacks audit, metadata is unstructured, permission history is hard to trace, or audit growth has no retention plan. | `auth.*`, `admin.*`, `vendor.*`, `driver.*`, future `stock.*`, `order.*`, `settlement.*` | Never delete audit rows; rollback only code that emitted wrong audit and add compensating audit note if required. | `curl -i "https://api.thefox.app/v1/admin/audit-logs?page=1&pageSize=25"` | `ทำ program Compliance audit ต่อ: ตรวจ audit coverage, structured metadata, permission history, retention/archive และ export traceability` |
| Data governance & retention program | Audit retention, PII, export, deletion policy, access logs, backup/restore verification, and lineage are defined. | PII export has no audit, backup restore is unverified, retention is unclear, access log is missing, or deletion harms ledger/audit. | Future `data.export`, `data.retention.apply`, `data.deletion.request`, `data.access_review`, `backup.restore_verify` | Never delete audit/ledger to satisfy policy; use legal hold, archive, anonymize, or compensating notes as appropriate. | `rg -n 'PII|retention|backup|restore|export|deletion|access log|audit' docs apps/api/src scripts` | `ทำ program Data governance & retention ต่อ: วาง audit retention, PII, export/deletion, access logs, backup/restore และ lineage` |
| Data reporting accuracy program | Important reports have source of truth, reconciliation rule, indexed query/read model, and production verification command. | Stock/sales/profit disagrees with ledger, report query is heavy, summary cannot rebuild, or tenant health misses required data. | No audit expected for read-only reports; adjustments and rebuild actions must emit future `report.*` or `stock.*` events. | Revert report query/read model change; rebuild summaries from source of truth instead of manually editing numbers. | `rg -n 'StockLedger|BranchStockBalance|daily|summary|report|profit|cost' docs/product-system apps/api/prisma/schema.prisma` | `ทำ program Data reporting accuracy ต่อ: วาง stock/sales/profit reports, daily summaries, read models, reconciliation และ slow report prevention` |
| Promotion & growth economics program | Coupon, campaign, funded discount, referral, CAC/LTV, margin guard, and abuse protection are measurable. | Discount creates negative margin, coupon stacks incorrectly, referral abuse passes, campaign owner is unclear, or settlement misses discount impact. | Future `promotion.create`, `promotion.redeem`, `promotion.abuse_blocked`, `referral.reward`, `campaign.settlement` | Disable campaign/promo code, preserve redemption evidence, and use settlement adjustment instead of direct historical edits. | `rg -n 'promotion|coupon|campaign|discount|referral|CAC|LTV|margin' docs/product-system apps/api/src apps/api/prisma/schema.prisma` | `ทำ program Promotion & growth economics ต่อ: วาง coupon/campaign/funded discount/referral/CAC/LTV/margin guard/abuse protection` |
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
