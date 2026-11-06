# Verification checklist before submission

- [ ] Confirm the assessment permits a public repository; otherwise change it to Private.
- [ ] Review every file and ensure no employer source code or credentials are included.
- [ ] Replace provider-specific assumptions only with details supported by the assessment/provider documentation.
- [ ] Run `npm install` and `npm run build`.
- [ ] Add tests for token refresh coalescing, webhook duplicate delivery, retry exhaustion, tenant-crossing access, and ambiguous transaction submission.
- [ ] Confirm the webhook adapter captures the raw request body.
- [ ] Confirm the database adapter enforces unique event IDs and idempotency keys.
- [ ] Include the GitHub profile/repository URL only where requested by the recruiter.
- [ ] Do not claim exactly-once delivery; describe at-least-once delivery with idempotent processing.
