# UX Workflow Roadmap

## Product UX Principle

UX must reveal the system's real strengths: stock truth, unit clarity, branch operations, delivery choices, and financial visibility.

Do not build decorative screens before the business workflows are anchored.

## Surface Order

1. Admin console: access, audit, users, tenants, branches.
2. Vendor workspace: branch switcher, inventory, units, stock actions.
3. Vendor operations: swipe-card stock tasks, transfers, order queue.
4. Customer ordering: catalog, unit clarity, cart, order status.
5. Driver workflow: jobs, pickup/dropoff proof, completion.
6. Accounting/reporting: settlements, payouts, sales/stock reports.

## Swipe-Card Workflows

Swipe cards should be used for fast operational decisions, similar to the SROS pattern:

- New order review.
- Stock low/empty action.
- Transfer request.
- Receive transfer.
- Stock variance approval.
- Delivery handoff.
- Driver job accept/decline.

Swipe action must always map to an audited backend action. No swipe should silently mutate important state without a server decision.

## Admin UX

Priority:

- Role-safe admin landing.
- User management.
- Audit log.
- Tenant and branch management.
- Exception monitor.

Design tone:

- Dense, calm, searchable.
- No playful visuals.
- Clear risk/status indicators.
- Superadmin-only actions visibly separated.

## Vendor UX

Priority:

- Tenant/branch context.
- Product and SKU master.
- Unit conversion.
- Branch stock.
- Transfer/send/receive.
- Order queue.
- Reports.

Design tone:

- Operational, quick, mobile-friendly.
- Strong status and quantity readability.
- Avoid hiding unit/cost/stock data behind decorative cards.

## Customer UX

Priority:

- Actual products first.
- Branch availability and delivery ETA.
- Unit/price clarity.
- Cart and checkout.
- Order tracking.

Design tone:

- Premium black/silver brand.
- Fresh goods are concrete and visible.
- Green only for success status, not brand identity.

## Driver UX

Priority:

- Job list.
- Active delivery.
- Navigation handoff.
- Pickup proof.
- Dropoff proof.
- Problem reporting.

Design tone:

- Large touch targets.
- Fast status updates.
- Minimal typing while moving.

## Next Tasks

- Convert this roadmap into GitHub/Linear-style task cards when issue tracking is selected.
- Build admin tenant/branch UX next.
- Build vendor inventory UX after inventory models are added.
- Keep adding business rules to subsystem docs before implementing complex screens.
