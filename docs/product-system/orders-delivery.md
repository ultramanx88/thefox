# Orders and Delivery System

## Business Intent

Orders must be connected to real branch stock and real fulfillment modes. Delivery is important, but it should not bypass inventory truth.

## Order Flow

```txt
Customer cart
  -> branch availability check
  -> order created
  -> stock reserved or committed
  -> vendor accepts/prepares
  -> fulfillment assigned
  -> pickup
  -> delivery
  -> completion
  -> settlement/reporting
```

## Fulfillment Modes

| Mode | Meaning | Platform risk |
| --- | --- | --- |
| `system_driver` | theFOX driver/rider handles delivery | Operational quality, driver capacity |
| `tenant_self_delivery` | Tenant handles delivery with own staff | Revenue leakage if not tracked |
| `third_party_delivery` | External service handles delivery | Proof and SLA visibility |
| `pickup` | Customer picks up | Stock/order status accuracy |
| `manual_transfer` | Internal branch movement without customer delivery | Inventory variance risk |

Tenant self-delivery should be supported but measured. The platform can monetize SaaS, reports, stock workflows, and settlement even when a system driver is not used.

## Delivery Job Rules

- Driver jobs must be assigned from trusted order state.
- Driver cannot change financial values.
- Pickup and dropoff proof should be stored.
- Delivery status changes should write audit records.
- Failed delivery requires reason and next action.

## UX Requirements

Customer:

- Browse by available branch/area.
- Clear unit, stock, price, and delivery ETA.
- Order tracking with status clarity.

Vendor:

- Swipe-card order queue.
- Accept/reject/prepare handoff.
- Delivery mode selection.
- Transfer/internal delivery cards.

Driver:

- Available jobs.
- Active job details.
- Pickup/dropoff proof.
- Earnings/status later.

Admin:

- Order monitor.
- Delivery exception list.
- Driver/branch support actions with audit.

## Next Tasks

- Define order/order item/status Prisma models.
- Define stock reservation behavior.
- Define delivery job model.
- Build vendor order queue after inventory ledger exists.
- Build driver job API after delivery assignment rules are stable.
