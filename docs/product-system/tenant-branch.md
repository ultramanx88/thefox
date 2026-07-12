# Tenant and Branch System

## Business Intent

Tenants are the real business operators on theFOX. A tenant may own one or many branches. The platform must let a tenant centralize catalog and product rules while still controlling branch-level stock, availability, pricing exceptions, and fulfillment.

## Concepts

| Concept | Meaning |
| --- | --- |
| Tenant | Vendor business or organization operating on the platform |
| Branch | Physical shop, warehouse, dark store, or dispatch location |
| Membership | User-to-tenant relationship with permissions |
| Branch assignment | Optional user-to-branch operating scope |
| Central catalog | Tenant-level product and unit master data |
| Branch stock | Real stock available at each branch |

## Business Rules

- One tenant can have many branches.
- Products should belong to a tenant, not only one branch.
- Stock belongs to a branch.
- Tenant owners/admins can manage central product definitions.
- Branch operators can manage stock and orders only for allowed branches.
- Platform admins can review and support tenants but should not casually override business data.
- Status changes must be audited.

## Tenant Statuses

| Status | Meaning |
| --- | --- |
| `pending` | Submitted but not approved |
| `active` | Can operate |
| `suspended` | Temporarily blocked |
| `archived` | No longer active, retained for records |

## Branch Statuses

| Status | Meaning |
| --- | --- |
| `pending` | Created but not operational |
| `active` | Can sell/fulfill |
| `paused` | Temporarily unavailable |
| `closed` | Permanently closed |

## UX Requirements

Admin console:

- Tenant list, status, owner, branch count, risk flags.
- Tenant detail with branches, memberships, audit, recent operations.
- Create/approve/suspend tenant.
- Create/pause/close branch.

Vendor workspace:

- Tenant dashboard.
- Branch switcher.
- Central product management.
- Branch stock and order queue.
- Branch transfer workflow.

## API Direction

```txt
/v1/admin/tenants
/v1/admin/tenants/:tenantId
/v1/admin/tenants/:tenantId/branches
/v1/vendor/me
/v1/vendor/tenant
/v1/vendor/branches
```

## Next Tasks

- Add tenant and branch admin APIs.
- Add tenant/branch admin UX to the admin console.
- Add vendor membership permission model beyond plain role.
- Add branch switcher in vendor workspace.
- Define tenant onboarding and approval checklist.
