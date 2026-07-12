# theFOX

Mobile-first fresh goods marketplace built on a production monorepo.

The previous backend prototype has been retired from this codebase. Runtime data, auth, and deployment should use the production stack only: Next.js, Expo, Fastify, PostgreSQL, Redis, Prisma, shared Zod contracts, Docker, and Cloudflare/Nginx at the edge.

## Workspaces

- `apps/web`: Next.js PWA/web app
- `apps/api`: Fastify API and Prisma schema
- `apps/mobile`: Expo mobile app
- `packages/shared`: shared Zod contracts and TypeScript types

## Local Start

```bash
npm install
docker compose up -d postgres redis
npm run dev:api
npm run dev:web
npm run dev:mobile
```

## Production

```bash
npm run typecheck
npm run build
npm run deploy:thefox-app
```

Auth direction: Expo AuthSession and web/PWA login flows backed by Fastify auth endpoints. Do not reintroduce legacy client-side backend services.

## Planning

- [Architecture roadmap](docs/architecture-roadmap.md)
- [Product system map](docs/product-system/README.md)
