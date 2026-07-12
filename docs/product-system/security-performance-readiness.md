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

## Pentest Task Cards

| Task | Acceptance |
| --- | --- |
| Route isolation | Customer role cannot access admin/vendor/driver data by URL guessing |
| Subdomain redirects | Root workspace paths redirect to canonical subdomains without leaking internal ports |
| Cookie scope | Session cookie works across `.thefox.app` and remains `HttpOnly`, `Secure`, `SameSite=Lax` |
| CORS | API accepts only approved web origins and rejects unexpected origins |
| Role bypass | Admin-only and superadmin-only APIs reject lower roles server-side |
| Audit trail | Forbidden access, login/logout, role change, and future tenant/stock actions write audit rows |
| Mutation protection | CSRF or signed mutation token exists before tenant/branch/product/stock write APIs expand |
| Rate limit | Auth, admin mutations, and role update endpoints have request limits |

## Performance Task Cards

| Task | Acceptance |
| --- | --- |
| Admin API baseline | Measure `auth/me`, `admin/users`, and `admin/audit-logs` response time after deploy |
| Page budget | Admin/vendor pages remain responsive on mobile and do not ship unnecessary heavy client code |
| Audit query plan | Audit log list uses pagination and filters before the table grows large |
| Route cold start | Public workspace routes return healthy HTTP status after container recreate |
| DB connection safety | API startup, migrations, and Prisma client behavior stay stable during deploy |

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
