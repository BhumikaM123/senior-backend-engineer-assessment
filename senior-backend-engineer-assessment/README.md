# Senior Backend Engineer — Stage 1 Assessment

Node.js / TypeScript reference implementation for the assessment's Q1–Q3.

## Contents

- `src/question-1`: OAuth client-credentials token caching, signed KYC webhook intake, durable inbox abstraction, and bounded 429 retry handling.
- `src/question-2`: JWT-authenticated tenant context guard and tenant-scoped investor service.
- `src/question-3`: asynchronous Fireblocks transaction initiation, webhook state updates, and reconciliation abstraction.
- `docs/`: design notes, assumptions, and manual verification checklist.

## Important implementation notes

This repository is an assessment reference implementation, not a drop-in production service. Provider-specific OAuth fields, webhook signature rules, Fireblocks event payloads, persistence adapters, and deployment configuration must be confirmed against the actual provider documentation and environment.

The persistence interfaces are intentionally separated from business logic. A real deployment must implement them with a durable database and transactions/unique indexes. In-memory state is not suitable for multi-instance production deployment.

The webhook approach is **at-least-once delivery with idempotent processing**, not a claim of exactly-once network delivery. Financial transaction submission timeouts are treated as ambiguous and must be reconciled before any resubmission.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
npm run build
```

The project uses NestJS types/decorators and TypeScript. It is organized as assessment examples rather than a complete runnable HTTP application; provider adapters and persistence implementations are deliberately left as integration boundaries.

## Suggested review order

1. Read `docs/architecture.md`.
2. Review Question 1 integration and webhook code.
3. Review Question 2 tenant isolation code.
4. Review Question 3 asynchronous transaction flow.
5. Review `docs/verification-checklist.md`.

## Security

- Never commit `.env`, API keys, access tokens, private keys, certificates, or real customer data.
- Do not reuse credentials from an employer or any production system.
- Keep provider secrets in a secrets manager such as Vault or a cloud secret manager.
- Configure webhook signature verification using the provider's exact documented algorithm and raw request body.
