# theFOX Architecture Roadmap

This document is the shared direction for theFOX before deeper product work begins. It keeps business roles, routes, subdomains, auth, API boundaries, and app strategy aligned while the platform grows slowly and solidly.

## Product Shape

theFOX is an ingredient-first, multi-tenant delivery platform. Vendors and their branches publish catalogs and stock. Customers order fresh goods and cooking ingredients. Drivers accept and complete delivery jobs. Admin and operations teams manage approvals, role boundaries, tenant health, and order flow.

The platform should feel mobile-first and familiar to modern delivery users, but it must not become a green LINE MAN or Grab clone. The product identity is black, silver, restrained, operational, and polished.

## Role Model

| Role | Primary surface | Core responsibility |
| --- | --- | --- |
| `customer` | Web/PWA first, Expo customer app later | Browse products, order, track delivery, manage addresses |
| `vendor` | Vendor web/PWA first | Manage tenant profile, branches, catalog, stock, orders |
| `driver` | Expo driver app first, web fallback later | Accept jobs, navigate, update delivery state, submit proof |
| `admin` | Admin web | Support operations, review vendors/drivers, inspect orders |
| `superadmin` | Admin web | Own platform settings, role assignment, critical overrides |

Principles:

- Users may have multiple future capabilities, but each request must resolve to one trusted server-side role context.
- Role changes must never be accepted from client-provided payloads.
- Admin and superadmin tools stay web-first because they require dense tables, search, review, and audit context.

## Subdomain Plan

| Host | Purpose | Timing |
| --- | --- | --- |
| `thefox.app` | Public landing, customer web/PWA, customer auth entry | Current |
| `api.thefox.app` | Fastify API, auth callbacks, shared backend | Current |
| `admin.thefox.app` | Admin and operations console | Next |
| `vendor.thefox.app` | Vendor partner workspace | Next |
| `driver.thefox.app` | Driver web fallback and onboarding | Later |

Initial implementation can keep one Next.js deployment and route by path. Subdomains should be introduced when auth redirects, cookies, and role guards are stable enough to avoid churn.

Recommended route mapping before subdomains:

```txt
/                 customer/public entry
/auth/continue    post-login role router
/admin            admin and superadmin shell
/vendor           vendor partner shell
/driver           driver fallback shell
/inside           legacy/internal holding route until removed or repurposed
```

## App Strategy

Use one backend and multiple frontends. Do not split the backend into separate services yet.

### Keep Now

- `apps/web`: Next.js web/PWA for landing, customer web ordering, admin, and vendor.
- `apps/api`: Fastify API with PostgreSQL, Redis, Prisma, auth endpoints, and RBAC.
- `apps/mobile`: Expo foundation. This can become the customer mobile app or be split when the driver app begins.
- `packages/shared`: shared Zod contracts and typed role/domain models.

### Recommended Mobile Direction

1. Stabilize auth, role routing, and API contracts.
2. Build customer Expo shell if the first mobile goal is ordering and retention.
3. Build driver Expo shell if the first operational goal is dispatch and delivery proof.
4. Keep vendor on web/PWA until vendor mobile behavior is proven.
5. Keep admin web-only.

Expo should use native navigation and screens for the hot workflows. Web/PWA can cover lower-frequency workflows until they deserve native treatment.

## API Boundary

Keep one API service and split by route domain:

```txt
/v1/public       public catalog, availability, landing data
/v1/auth         provider start/callback, session, logout, current user
/v1/customer     customer profile, addresses, cart, orders
/v1/vendor       tenant, branch, catalog, stock, vendor orders
/v1/driver       driver profile, jobs, availability, proof of delivery
/v1/admin        users, roles, approvals, audit, platform operations
```

Rules:

- Every protected endpoint must authenticate from the server-side session or token.
- Every protected endpoint must check role and tenant/branch ownership.
- Shared request and response contracts should live in `packages/shared`.
- Public catalog endpoints may be unauthenticated, but must not leak private vendor, driver, or customer data.

## Auth Direction

The system direction is Expo AuthSession plus Fastify auth endpoints. Web/PWA and native apps should use the same backend auth providers and session model.

Current providers:

- LINE
- Google
- Apple, planned

Flow:

```txt
User taps provider
  -> /v1/auth/{provider}/start
  -> OAuth provider
  -> /v1/auth/{provider}/callback
  -> server creates or updates trusted user session
  -> /auth/continue
  -> frontend fetches /v1/auth/me
  -> redirect by trusted role
```

Role redirect defaults:

| Role | Destination |
| --- | --- |
| `customer` | `/` |
| `vendor` | `/vendor` |
| `driver` | `/driver` |
| `admin` | `/admin` |
| `superadmin` | `/admin` |

Native apps should later use app-specific redirect URLs and deep links, but the provider callbacks should still terminate at the Fastify API.

## Immediate Build Order

1. Add route and architecture documentation.
2. Add real route guards for `/admin`, `/vendor`, and `/driver`.
3. Complete auth utilities: `/v1/auth/me`, logout, failed login state, and post-login role routing.
4. Add trusted superadmin bootstrap for the first owner account through server-side configuration or seed.
5. Define first data model slice: users, tenants, branches, vendor memberships, driver profiles, products, orders.
6. Start Expo only after auth and role contracts are stable enough to reuse.

## Product System Map

Detailed subsystem planning now lives in [Product system map](product-system/README.md). Use it as the running source of truth for business rules, data models, API boundaries, UX workflow order, and implementation tasks.

When new business logic is discovered, add it to the matching subsystem file before building the screen or API. This keeps the platform's inventory, delivery, accounting, role, and audit behavior aligned.

## Non-goals For Now

- Do not split the backend into microservices.
- Do not build four native apps at the same time.
- Do not make driver workflows depend on desktop web.
- Do not reintroduce Firebase or client-side backend ownership.
- Do not make green a brand color; reserve it for semantic success only.
