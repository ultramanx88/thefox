# Security Specification for theFOX

## 1. Data Invariants
- A `User` profile must be created by the authenticated owner.
- `Products` are immutable by customers; only vendors or admins can manage them.
- `Orders` must be linked to the `uid` of the creator and cannot be changed once `completed`.
- All `amounts` and `prices` must be positive numbers.

## 2. The Dirty Dozen (Test Payloads)

1. **Identity Spoofing**: Attempt to create a user profile with a different `uid` in the path.
2. **Role Escalation**: Authenticated user trying to set their own `role` to `admin`.
3. **Ghost Fields**: Adding `isVerified: true` to a user profile to bypass system verification.
4. **Price Poisoning**: Updating a product price to a negative value or a string.
5. **Admin Access**: Unauthenticated access to the `orders` list.
6. **State Shortcut**: Changing an order status from `pending` directly to `completed` without payment validation (simulated).
7. **Resource Exhaustion**: Sending a 1MB string as a product name.
8. **PII Leak**: Non-owner trying to 'get' another user's email.
9. **Orphaned Write**: Creating an order without checking if products exist in the catalog.
10. **Query Scraping**: Listing all users without a `where` clause on `uid`.
11. **Timestamp Spoof**: Providing a client-side `createdAt` date.
12. **Foreign ID Poisoning**: Using a `productId` that contains invalid characters like `../../../secrets`.

## 3. Security Goals
- Every write must be validated by a schema helper.
- All roles must be checked against a trusted `/users/{uid}` document.
- `affectedKeys().hasOnly()` gates for all updates.
