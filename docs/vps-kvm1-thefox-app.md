# theFOX VPS KVM1 Deploy

Target host: `srv1771159.hstgr.cloud`
Current SSH endpoint from note: `root@187.77.158.181`
Project domain: `thefox.app`

Use this guide when deploying theFOX on the same KVM as ONEFLOW and other
temporary instances. The key rule is that theFOX owns its Docker project,
internal database/cache, and local web/API ports.

## Recommended Port Allocation

| Service | Public route | Local target |
| --- | --- | --- |
| Web | `https://thefox.app` | `127.0.0.1:3120` |
| Web alias | `https://www.thefox.app` | `127.0.0.1:3120` |
| API | `https://api.thefox.app` | `127.0.0.1:4120` |
| PostgreSQL | none | Docker network only |
| Redis | none | Docker network only |

These ports are intentionally not the container ports. Containers still use
`3000` for web, `4000` for API, `5432` for PostgreSQL, and `6379` for Redis.

## Server Packages

Install or confirm these on the VPS:

- Docker Engine with the Compose plugin
- Git
- A reverse proxy: Caddy is simplest, Nginx plus Certbot is also fine
- UFW or equivalent firewall
- Fail2ban for SSH hardening
- A backup path for Docker volumes or PostgreSQL dumps

Suggested Ubuntu baseline:

```bash
apt update
apt install -y ca-certificates curl git ufw fail2ban
```

Install Docker from Docker's official repository if it is not already present.
After install, confirm:

```bash
docker --version
docker compose version
```

## DNS

Point these records to `187.77.158.181`:

- `A thefox.app`
- `A www.thefox.app`
- `A api.thefox.app`

If Cloudflare is used, keep proxying consistent with the other projects on the
same KVM.

## Preflight Port Check

Before starting theFOX, check that the selected ports are free:

```bash
ss -ltnp | grep -E ':(3120|4120)\b' || true
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

If either port is already taken, change `THEFOX_WEB_PORT` and
`THEFOX_API_PORT` in the env file before deploy.

## Env File

Create `/opt/thefox/.env.thefox.app` from
`deploy/thefox.app.env.example` and replace the database password:

```bash
COMPOSE_PROJECT_NAME=thefox-app
THEFOX_POSTGRES_DB=thefox_app
THEFOX_POSTGRES_USER=thefox
THEFOX_POSTGRES_PASSWORD=replace-with-strong-password
THEFOX_WEB_BIND=127.0.0.1
THEFOX_WEB_PORT=3120
THEFOX_API_BIND=127.0.0.1
THEFOX_API_PORT=4120
WEB_ORIGIN=https://thefox.app,https://www.thefox.app
NEXT_PUBLIC_API_URL=https://api.thefox.app
LOG_LEVEL=info
```

Do not reuse credentials from ONEFLOW. If an SSH password is stored there, use
it only to log in, then keep theFOX secrets in theFOX's own env file.

## Deploy

From your local checkout, use the repeatable deploy script:

```bash
bash scripts/deploy-thefox-app.sh
```

or:

```bash
npm run deploy:thefox-app
```

The script connects to `root@187.77.158.181`, prepares `/opt/thefox`, creates
`/opt/thefox/.env.thefox.app` on first deploy, checks ports `3120` and `4120`,
starts Docker Compose, runs migrations, and checks local web/API health.

Recommended server path:

```bash
mkdir -p /opt/thefox
cd /opt/thefox
```

Clone or copy this repository into `/opt/thefox/app`, then run:

```bash
cd /opt/thefox/app
docker compose --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml up -d --build
```

Run database migrations separately:

```bash
docker compose --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml run --rm api npm run db:migrate --workspace @thefox/api
```

Health checks:

```bash
curl -fsS http://127.0.0.1:4120/health
curl -I http://127.0.0.1:3120
docker compose --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml ps
```

## Caddy Example

Use this if KVM already uses Caddy:

```caddyfile
thefox.app, www.thefox.app {
	reverse_proxy 127.0.0.1:3120
}

api.thefox.app {
	reverse_proxy 127.0.0.1:4120
}
```

Reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

## Nginx Example

Use this if KVM already uses Nginx:

```nginx
server {
    listen 80;
    server_name thefox.app www.thefox.app;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.thefox.app;

    location / {
        proxy_pass http://127.0.0.1:4120;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then issue TLS certificates with the same Certbot pattern used by the other
sites on the server.

## Firewall

Allow only the public edge ports and SSH:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

Do not open `3120`, `4120`, `5432`, or `6379` publicly.

## Backup Notes

Minimum database backup command:

```bash
docker compose --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec postgres pg_dump -U thefox thefox_app > /opt/thefox/thefox_app_$(date +%F).sql
```

For production, move backups off the VPS as soon as possible.
