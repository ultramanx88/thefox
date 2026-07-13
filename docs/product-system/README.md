# theFOX Product System Map

This folder is the working map for theFOX business logic, implementation scope, UX scope, and task order. Update these files whenever the team discovers a new rule, risk, edge case, or opportunity.

The goal is to make the system professional before screens are built. UX should follow the domain model, not invent hidden business rules inside components.

## Core Positioning

theFOX is not a generic delivery clone. It is an inventory-first delivery platform:

- SaaS stock and inventory for tenants.
- Tenant-defined units, main units, sub units, and conversion rules.
- Branch-level stock, transfers, stock takes, and stock movement reports.
- Delivery marketplace with system drivers, tenant self-delivery, and operational audit.
- Accounting logic for cost, profit, platform fees, settlement, and payout.

## Subsystem Files

| File | Purpose |
| --- | --- |
| [identity-access.md](identity-access.md) | Roles, route guards, admin access, audit trail, security boundary |
| [tenant-branch.md](tenant-branch.md) | Tenant structure, branch ownership, membership, centralized management |
| [inventory-stock.md](inventory-stock.md) | Units, SKU/product structure, stock ledger, stock take, transfers |
| [orders-delivery.md](orders-delivery.md) | Customer order flow, dispatch modes, rider/driver jobs, delivery proof |
| [accounting-settlement.md](accounting-settlement.md) | Cost, margin, fees, commission, tenant settlement, platform receivables |
| [reporting-analytics.md](reporting-analytics.md) | Stock reports, sales reports, operational analytics, export needs |
| [database-performance.md](database-performance.md) | Index strategy, query baselines, stock/report read model direction |
| [security-performance-readiness.md](security-performance-readiness.md) | Pentest, route/auth hardening, performance budgets, mutation readiness |
| [ux-workflow-roadmap.md](ux-workflow-roadmap.md) | Screen order, swipe-card workflows, admin/vendor/customer/driver UX sequence |

## Planning Rule

For every feature, keep these four layers connected:

1. Business rule: what the platform must guarantee.
2. Data model: what must be stored and audited.
3. API contract: who can do it and under which role/scope.
4. UX workflow: where the user sees, confirms, corrects, or reviews it.

No critical financial, stock, role, or delivery action should exist only as frontend state.

## Current Build Order

1. Harden identity access: admin/superadmin guards and audit for important actions.
2. Define tenant, branch, unit, SKU, stock ledger, and branch transfer model.
3. Build admin tenant and branch management.
4. Build vendor inventory workspace with swipe-card operational flows.
5. Build order and delivery modes around stock availability.
6. Add accounting, settlement, and reports once stock/order ledgers are trustworthy.

## Open Decision Log

| Topic | Current direction |
| --- | --- |
| Tenant self-delivery | Allowed, but must be a first-class fulfillment mode with stock ledger and audit |
| Inter-branch transfer | Allowed only through recorded transfer workflow, not informal stock edits |
| Vendor centralization | Tenant owner/admin can manage products and branch stock based on permissions |
| Admin console | Web-first, dense, audited, superadmin-only for role changes |
| Driver app | Mobile-first later; web fallback can exist for onboarding/status |
