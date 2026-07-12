# Inventory and Stock System

## Business Intent

Inventory is the core strength of theFOX. The system must behave like a serious stock platform first, then expose delivery and ordering on top of trustworthy availability.

This is the main difference from generic delivery systems.

## Core Concepts

| Concept | Meaning |
| --- | --- |
| Unit | Tenant-defined measurement, such as kg, g, pack, tray, bottle, piece |
| Main unit | Primary accounting/reporting unit for stock |
| Sub unit | Sellable or operational unit derived from a main unit |
| Conversion | Rule for converting between units |
| Product | Tenant-level product identity |
| SKU | Sellable stock keeping unit with unit, price, and availability rules |
| Stock ledger | Immutable movement record |
| Stock balance | Current quantity derived from ledger or maintained with ledger checks |
| Stock take | Count and reconcile workflow |
| Branch transfer | Movement from one branch to another |

## Unit Rules

- Units are tenant-defined.
- A product should have a main unit.
- SKUs may sell in main unit or sub unit.
- Conversions must be explicit and versioned or audited.
- Unit conversion changes should not silently rewrite historical stock movements.

Example:

```txt
Product: Pork belly
Main unit: kg
Sub units:
  - 100 g = 0.1 kg
  - 500 g = 0.5 kg
  - pack = tenant-defined net weight
```

## Stock Ledger Movement Types

| Type | Meaning |
| --- | --- |
| `opening` | Initial stock |
| `purchase` | Stock received from supplier |
| `sale` | Stock consumed by customer order |
| `adjustment` | Manual correction |
| `stock_take_gain` | Count found more than system |
| `stock_take_loss` | Count found less than system |
| `transfer_out` | Branch sends stock |
| `transfer_in` | Branch receives stock |
| `waste` | Spoiled or discarded stock |
| `return` | Returned stock |

## Branch Transfer Rules

Branch-to-branch transfer is allowed, including tenant self-delivery. It is safe only when it is recorded as a workflow:

1. Source branch creates transfer request.
2. System reserves or marks stock pending transfer.
3. Fulfillment mode is selected: system driver, tenant self-delivery, third party, or manual receive.
4. Source branch confirms send.
5. Destination branch confirms receive.
6. Ledger writes `transfer_out` and `transfer_in`.
7. Differences are recorded as variance, loss, or adjustment.

The dangerous case is not self-delivery. The dangerous case is stock moving outside the ledger.

## UX Requirements

Vendor inventory:

- Swipe cards for operational stock tasks.
- Product/SKU list with stock by branch.
- Unit conversion editor.
- Stock adjust with reason required.
- Stock take flow optimized for mobile.
- Branch transfer create/send/receive flow.

Admin:

- Tenant inventory visibility for support.
- Stock movement audit.
- Transfer exceptions and stuck transfers.

## Data Model Direction

```txt
Unit
UnitConversion
Product
Sku
BranchStockBalance
StockLedger
StockTake
StockTakeItem
BranchTransfer
BranchTransferItem
```

## Next Tasks

- Add Prisma models for units, SKU, stock ledger, and branch transfers.
- Add shared Zod contracts for units and stock movements.
- Add vendor inventory API.
- Add first vendor inventory UX shell.
- Add stock movement audit hooks.
