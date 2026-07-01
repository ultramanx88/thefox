# KVM Shared Instances

Use this setup when the KVM tier is being upgraded, but several websites or
temporary instances still need to run on the same machine before the final
split-out.

## Operating Model

- One upgraded KVM can host multiple app stacks during the transition.
- Each stack uses its own Compose project name, ports, environment file, and
  volumes.
- PostgreSQL and Redis stay private inside each stack network.
- A shared reverse proxy owns public `80/443` and routes domains to local app
  ports.
- Moving an instance to another KVM should require DNS/proxy/env changes, not
  application code changes.

## Isolation Rules

- Set a unique `COMPOSE_PROJECT_NAME` for every instance.
- Bind web/API ports to `127.0.0.1` unless a load balancer needs direct access.
- Do not publish PostgreSQL `5432` or Redis `6379` to the host.
- Keep one `.env` file per instance and do not commit secrets.
- Rebuild web after changing `NEXT_PUBLIC_API_URL`, because public Next.js
  values can be embedded during build.

## Example Port Plan

| Instance | Web bind | API bind |
| --- | --- | --- |
| `thefox-dev` | `127.0.0.1:3100` | `127.0.0.1:4100` |
| `thefox-test` | `127.0.0.1:3101` | `127.0.0.1:4101` |
| `thefox-demo` | `127.0.0.1:3102` | `127.0.0.1:4102` |

ONEFLOW, Seoulmate, and SROS should follow the same pattern with their own
port ranges, project names, and proxy routes.

## Example `.env.thefox-dev`

```bash
COMPOSE_PROJECT_NAME=thefox-dev
THEFOX_POSTGRES_DB=thefox_dev
THEFOX_POSTGRES_USER=thefox
THEFOX_POSTGRES_PASSWORD=replace-with-strong-password
THEFOX_WEB_BIND=127.0.0.1
THEFOX_WEB_PORT=3100
THEFOX_API_BIND=127.0.0.1
THEFOX_API_PORT=4100
WEB_ORIGIN=https://thefox-dev.example.com
NEXT_PUBLIC_API_URL=https://thefox-api-dev.example.com
LOG_LEVEL=info
```

## Start One Instance

```bash
docker compose --env-file .env.thefox-dev -f docker-compose.kvm-shared.yml up -d --build
```

Run database migrations separately:

```bash
docker compose --env-file .env.thefox-dev -f docker-compose.kvm-shared.yml run --rm api npm run db:migrate --workspace @thefox/api
```

## Start Another Instance

Create another env file with a different `COMPOSE_PROJECT_NAME`, database name,
and host ports:

```bash
COMPOSE_PROJECT_NAME=thefox-test
THEFOX_POSTGRES_DB=thefox_test
THEFOX_WEB_PORT=3101
THEFOX_API_PORT=4101
WEB_ORIGIN=https://thefox-test.example.com
NEXT_PUBLIC_API_URL=https://thefox-api-test.example.com
```

Then run:

```bash
docker compose --env-file .env.thefox-test -f docker-compose.kvm-shared.yml up -d --build
```

## Reverse Proxy

Route each domain to the instance-specific local ports:

- `thefox-dev.example.com` -> `http://127.0.0.1:3100`
- `thefox-api-dev.example.com` -> `http://127.0.0.1:4100`
- `thefox-test.example.com` -> `http://127.0.0.1:3101`
- `thefox-api-test.example.com` -> `http://127.0.0.1:4101`

Set `WEB_ORIGIN` per instance so API CORS accepts the matching frontend.
