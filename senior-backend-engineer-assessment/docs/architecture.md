# Architecture and design decisions

## Q1 — Third-party KYC integration

- OAuth client-credentials token is cached until 60 seconds before expiry.
- Concurrent refresh calls share one in-flight promise per application process.
- An old token is used only while it remains unexpired if refresh fails.
- Webhook signature verification uses the raw request body; exact signature rules are provider-specific.
- The endpoint persists the event to a durable inbox before returning HTTP 202.
- A worker processes events asynchronously. A unique event ID and idempotent update prevent duplicate effects.
- 429 responses are retried with bounded exponential backoff, jitter, and `Retry-After` support.
- A distributed rate limiter is required to enforce a global 100 requests/minute quota across multiple replicas.

## Q2 — Tenant isolation

- JWT validation must run before tenant-context creation.
- Tenant identity is taken only from verified token claims.
- Every resource query is scoped by both resource ID and tenant ID.
- Client-provided tenant IDs are ignored; DTO allow-lists prevent mass assignment.
- Returning 404 for missing and foreign-tenant IDs can reduce resource enumeration.

## Q3 — Asynchronous custody transactions

- API returns HTTP 202 and an internal transaction ID; it does not wait for blockchain settlement.
- Provider callbacks and reconciliation update the transaction state.
- Idempotency key and stable provider external reference prevent duplicate initiation.
- A timeout after submission is ambiguous; mark `SUBMISSION_UNKNOWN` and reconcile before considering another submission.
- Frontend can poll a status endpoint or receive SSE/WebSocket updates.
- Reconciliation should compare provider status and immutable transfer details, and alert on unresolved mismatches.

## Production hardening still required

- Concrete database adapters, unique indexes, and transaction boundaries.
- Provider-specific signature verification and event schema validation.
- Distributed token cache/lock if shared token coordination is required.
- Global distributed rate limiter.
- Queue retry policy, dead-letter queue, poison-message handling, and observability.
- Authorization/role checks and DTO validation on every endpoint.
- Fireblocks status mapping and external-reference lookup according to the actual API contract.
