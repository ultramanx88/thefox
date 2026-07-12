# Accounting and Settlement

## Business Intent

theFOX must know cost, margin, platform fees, delivery fees, tenant receivables, platform receivables, and payout status. This is where the system becomes more than marketplace UI.

## Financial Concepts

| Concept | Meaning |
| --- | --- |
| Cost | Tenant cost basis for stock/product |
| Sale amount | Customer-facing item total |
| Gross margin | Sale amount minus cost |
| Platform fee | Fee charged by theFOX |
| Delivery fee | Customer or tenant delivery charge |
| Driver payout | Amount payable to driver |
| Tenant payout | Amount payable to tenant |
| Platform receivable | Amount owed to theFOX |
| Settlement | Periodic calculated financial statement |

## Rules

- Historical orders must keep financial snapshots.
- Cost updates should not rewrite past order margins.
- Fees should be versioned or snapshotted at order time.
- Manual adjustments require reason and audit.
- Payout approval should be superadmin/admin guarded.
- Settlement reports should be reproducible from ledger/order data.

## Revenue Streams To Track

- SaaS subscription.
- Branch fee.
- Inventory transaction fee.
- Advanced reports add-on.
- Accounting/settlement fee.
- Marketplace commission.
- Rider delivery fee.
- Internal transfer workflow fee.
- Payment/payout processing fee.
- API/integration fee.

## UX Requirements

Admin:

- Settlement list by tenant/date/status.
- Fee configuration.
- Payout approval.
- Adjustment workflow.

Vendor:

- Sales summary.
- Cost/profit view.
- Fees owed to platform.
- Payout status.

## Next Tasks

- Define fee configuration model.
- Define settlement period and settlement line models.
- Snapshot order financials.
- Add reports after order and stock ledger are reliable.
