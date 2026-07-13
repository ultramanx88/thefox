# Database Performance

## Business Intent

theFOX must stay fast while behaving like a serious inventory and delivery platform. Database work should favor measured query paths, predictable writes, and auditable stock truth over premature complexity.

## Optimization Principles

- Measure production-like query plans before adding indexes.
- Add indexes for real filters, joins, and sort orders, not every column.
- Keep write-heavy tables lean enough for stock, orders, audit, and delivery transitions.
- Use immutable ledgers for truth and read models for fast operational screens.
- Treat report speed as a product feature, not an accidental byproduct of transactional tables.

## Current Index Baseline

The first database performance task adds indexes for:

| Area | Query path |
| --- | --- |
| Admin users | latest users, role-filtered operations |
| Tenants | latest tenants, status review |
| Branches | tenant branch lists and status review |
| Memberships | tenant owner/member list ordered by creation |
| Audit logs | latest events, role filter, action filter, resource type filter |
| Products | active tenant catalog, branch catalog, category browsing |
| Orders | latest orders, customer order history, status queues |
| Order items | order detail joins and product sales joins |

## Inventory Direction

Inventory scale should use two layers:

- `StockLedger`: immutable movement truth for purchase, sale, transfer, adjustment, stock take, waste, and return.
- `BranchStockBalance`: current branch/product/SKU quantity for fast catalog, order, and vendor screens.

Every stock mutation should write ledger and update balance in one database transaction. Reports can later read from daily summaries or snapshots.

## Production Verification

Use `EXPLAIN ANALYZE` for hot queries after deploy:

```bash
ssh root@187.77.158.181 "cd /opt/thefox/app && docker compose --project-name thefox-app --env-file /opt/thefox/.env.thefox.app -f docker-compose.kvm-shared.yml exec -T postgres psql -U thefox -d thefox_app -c 'EXPLAIN ANALYZE SELECT * FROM \"AuditLog\" WHERE \"actorRole\" = ''superadmin'' ORDER BY \"createdAt\" DESC LIMIT 25;'"
```

The query should use an index scan or a small bounded scan. If the planner chooses a sequential scan on a tiny table, record that as acceptable for current size and re-check after data volume grows.

## Next Tasks

- Add stock ledger and branch stock balance models.
- Add report read models for daily sales and stock movement summaries.
- Add API latency measurement around hot admin/vendor endpoints.
- Add retention and partition planning for `AuditLog` and future `StockLedger`.
