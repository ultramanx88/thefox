# Identity, Access, and Audit

## Business Intent

theFOX must keep role boundaries strict because admin, tenant, inventory, delivery, and settlement actions can affect money, stock, and customer trust.

The first rule is simple: role authority comes from the server, never from the client.

## Roles

| Role | Scope | Allowed surface |
| --- | --- | --- |
| `customer` | Own profile, addresses, orders | Customer web/PWA, future mobile |
| `vendor` | Assigned tenant and branch permissions | Vendor workspace |
| `driver` | Own driver profile and jobs | Driver mobile, web fallback |
| `admin` | Platform operations | Admin console |
| `superadmin` | Platform ownership and critical overrides | Admin console |

## Guard Rules

- `/admin` accepts only `admin` and `superadmin`.
- Superadmin-only actions include role assignment, platform-wide settings, and destructive overrides.
- `/vendor` accepts vendor users with valid tenant membership.
- `/driver` accepts driver users with a valid driver profile.
- Customer accounts must not see admin, vendor, or driver data by route guessing.
- Every protected API route must resolve user, role, and scope server-side.

## Audit Requirements

Audit every important action:

- Login and logout.
- Failed or forbidden protected route/API access.
- Role changes.
- Tenant creation and status changes.
- Branch creation and status changes.
- Product, SKU, and unit changes.
- Stock adjustment, stock take, and branch transfer.
- Order status changes.
- Delivery assignment and proof submission.
- Settlement generation, payout approval, and payment status changes.

Audit records should capture:

- Actor user ID.
- Actor role at the time.
- Action name.
- Target type and target ID.
- Tenant ID and branch ID when relevant.
- Metadata snapshot.
- IP/user agent when available.
- Created timestamp.

## Current Implementation Status

- Session-backed `/v1/auth/me` exists.
- Admin, vendor, and driver role guard shells exist.
- Admin user list and role update API exist.
- Audit log model exists.
- Important admin actions have started writing audit records.

## Next Tasks

- Add CSRF protection or signed mutation token for role/admin mutations.
- Add rate limiting for auth and admin mutation endpoints.
- Expand audit helper usage to tenant, branch, stock, delivery, and settlement actions.
- Add admin audit filters by action, actor, target, tenant, branch, and date range.
- Add superadmin recovery/bootstrap documentation.
