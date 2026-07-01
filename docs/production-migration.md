# theFOX Production Migration

This migration keeps the current Expo/Firebase prototype in place while a production stack is introduced beside it.

## Target Stack

- Web: Next.js, React, TypeScript, Tailwind CSS
- API: Fastify, TypeScript, Zod contracts
- Data: PostgreSQL with Prisma
- Cache and queues: Redis
- Mobile: Expo workspace in `apps/mobile`, consuming the shared API contract
- Deploy: Docker-first, with Cloudflare in front

## Migration Steps

1. Establish the monorepo baseline: `apps/web`, `apps/api`, `packages/shared`.
2. Move product catalog UI from the prototype into `apps/web`.
3. Replace Firebase client reads with API endpoints.
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
