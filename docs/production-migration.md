# theFOX Production Migration

This migration retires the previous prototype backend and moves the product onto a single production stack. Legacy client-side backend services are no longer part of the runtime, auth, data, or deployment path.

## Target Stack

- Web: Next.js, React, TypeScript, Tailwind CSS
- API: Fastify, TypeScript, Zod contracts
- Data: PostgreSQL with Prisma
- Cache and queues: Redis
- Auth: Expo AuthSession and web/PWA login flows backed by Fastify auth endpoints
- Mobile: Expo workspace in `apps/mobile`, consuming the shared API/auth contract
- Deploy: Docker-first, with Cloudflare in front

## Migration Steps

1. Establish the monorepo baseline: `apps/web`, `apps/api`, `packages/shared`.
2. Move product catalog UI into `apps/web` and keep all production web code there.
3. Remove legacy client reads, rules, config, and prototype entrypoints.
4. Add authentication, user roles, vendors, products, carts, and orders in PostgreSQL.
5. Add CI checks for typecheck, build, Prisma migration validation, and audit.
6. Add production deploy compose files, backups, monitoring, and rollback notes.
7. Continue mobile features in `apps/mobile` after each API contract is stable.

## Local Start

```bash
npm install
docker compose up -d postgres redis
npm run dev:api
npm run dev:web
npm run dev:mobile
```

Run Metro in Docker when a consistent Node environment is preferred:

```bash
npm run mobile:docker
```

The iOS Simulator itself still runs on macOS. Docker hosts Metro only; native iOS
compilation cannot run inside a Linux container.

For a physical phone, set `REACT_NATIVE_PACKAGER_HOSTNAME` and
`EXPO_PUBLIC_API_URL` to the Mac's LAN IP before starting the mobile container.

## Production Notes

- Keep database backups outside the application server.
- Put Cloudflare in front of web/API domains.
- Run Prisma migrations as a separate deploy step.
- Use a managed PostgreSQL service when traffic or operational risk increases.
