# Reporting and Analytics

## Business Intent

Reports are a product feature, not a byproduct. Tenants should pay for trustable visibility: stock, sales, transfers, costs, profit, branch performance, and exceptions.

## Report Families

| Report | Purpose |
| --- | --- |
| Stock balance | Current quantity by tenant, branch, product, SKU, unit |
| Stock movement | Ledger view of every stock change |
| Stock take variance | Count differences, shrinkage, adjustment reasons |
| Branch transfer | Transfer volume, stuck transfers, variance |
| Sales | Orders/items by branch/product/unit/date |
| Profit | Sales minus cost by product/branch/period |
| Platform fees | Fees owed to theFOX |
| Delivery performance | Assignment, pickup, completion, exception timing |
| Tenant health | Operational score for admin review |

## Report Rules

- Reports should be derived from trusted ledgers and snapshots.
- Exports should respect role and tenant scope.
- Admin can see platform-wide data.
- Vendor can see only assigned tenant/branch data.
- Expensive reports should use summary tables or snapshots when needed.

## UX Requirements

- Date range controls.
- Tenant/branch/product filters.
- CSV/XLSX export later.
- Drill-down from summary into ledger rows.
- Clear handling for incomplete or estimated cost data.

## Next Tasks

- Decide which reports are free vs paid/add-on.
- Add report API shape after ledger/order models.
- Add admin report shell.
- Add vendor report shell after inventory workspace.
