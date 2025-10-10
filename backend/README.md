### theFOX Backend (Rust + Axum)

This service provides the backend API for the theFOX monorepo. It is built with Rust, Axum, and Tokio. The initial scaffold includes CORS, health checks, and an example endpoint.

### Stack
- Rust 1.75+ (Edition 2021)
- Axum 0.7, Tokio 1.x
- tower-http (CORS, tracing)
- serde/serde_json for JSON

Planned additions:
- SQLx + Postgres
- Redis (caching, rate limiting)
- JWT auth (access/refresh tokens)
- OpenTelemetry tracing and Prometheus metrics

### Project structure
```
backend/
  Cargo.toml
  src/
    main.rs          # App entry, routes, CORS, healthz, echo
```

### Environment variables
- PORT: server port (default 3000)
- RUST_LOG: log level (e.g., info, debug)

Web/Expo clients should point to this service via:
- Web: NEXT_PUBLIC_API_BASE_URL
- Mobile (Expo): extra.API_BASE_URL in apps/mobile/app.json

### Run locally
```bash
# From repository root
npm run dev:backend

# Or directly
cargo run --manifest-path backend/Cargo.toml
```

Test endpoints:
```bash
curl -s http://localhost:3000/healthz

curl -s -X POST http://localhost:3000/echo \
  -H 'Content-Type: application/json' \
  -d '{"message":"hello"}'
```

### API (initial)
- GET /healthz → { status: "ok" }
- POST /echo → echoes { message }

Conventions (for future endpoints):
- JSON only; snake_case in DB, camelCase in API
- Errors: RFC 7807 style problem+json (planned)
- Authentication: Bearer JWT in Authorization header (planned)

### CORS
Current: permissive CORS to unblock development. Before production, restrict origins to your web domain(s) and mobile schemes.

### Deployment
You can deploy this as a single binary or a Docker container.

VPS + systemd (example):
```ini
[Unit]
Description=theFOX API
After=network.target

[Service]
Environment=PORT=3000
Environment=RUST_LOG=info
ExecStart=/usr/local/bin/thefox-backend
Restart=always
User=www-data
WorkingDirectory=/srv/thefox

[Install]
WantedBy=multi-user.target
```

Reverse proxy (Nginx example):
```nginx
server {
  listen 80;
  server_name api.example.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
  }
}
```

### Roadmap
- Add Postgres via SQLx and database migrations
- Implement auth (register/login, JWT, refresh)
- Domain modules: markets, products, orders
- Observability: tracing, metrics (/metrics), structured logs
- Rate limiting and input validation

### Notes for clients
- packages/api reads base URL from:
  - process.env.NEXT_PUBLIC_API_BASE_URL (web)
  - window.__API_BASE_URL__ (optional override)
  - default http://localhost:3000
- Store token in localStorage under key auth_token (temporary). Switch to secure storage on mobile.


