# Question 2 — Multi-tenant authorization

Apply guards in this order:

```ts
@UseGuards(JwtAuthGuard, TenantIsolationGuard)
```

`JwtAuthGuard` validates the token and populates `request.user`. `TenantIsolationGuard` derives a trusted tenant context only from those verified claims. Controllers pass that context to services; repositories scope every operation by both resource ID and tenant ID.

Apply the same tenant filter to reads, updates, deletes, exports, bulk operations, background jobs, and transaction lookups. Never trust a tenant ID supplied in a request body or query string. Use DTO allow-lists to prevent mass assignment.

For cross-tenant resource IDs, returning 404 for both nonexistent and foreign-tenant resources avoids confirming that another tenant's record exists. Log authorization failures with safe metadata; never log bearer tokens or sensitive personal data.
