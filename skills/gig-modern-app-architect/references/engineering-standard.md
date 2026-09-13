# Engineering Standard

## Repository shape

Prefer one repository and one deployable modular application until evidence supports separation.

```text
src/
  app/                 framework routes and composition
  modules/             domain-owned UI, application, and data code
  shared/              stable cross-domain primitives only
  infrastructure/      database, queue, storage, email, external adapters
tests/
  unit/
  integration/
  e2e/
docs/
  architecture/
```

Keep framework transport, business rules, and infrastructure adapters separable. Avoid a generic `utils` dumping ground and avoid speculative abstractions.

## API and data

- Validate every external boundary with schemas; normalize once.
- Use database constraints for invariants, transactions for multi-write correctness, and migrations reviewed in CI.
- Define ownership of tables and events by domain module.
- Use cursor pagination for large or mutable datasets.
- Specify idempotency keys for retryable commands and webhooks.
- Cache only with an owner, TTL/invalidation rule, and acceptable staleness.

## Security and privacy

- Authentication establishes identity; authorization checks the requested action and resource.
- Keep secrets server-side, rotate them, and separate environments.
- Treat uploads as hostile: restrict type/size, use randomized keys, scan when risk warrants, and serve safely.
- Minimize personal data; define retention, export, and deletion.
- Audit privileged and financially meaningful operations with actor, target, action, result, and correlation ID.

## Reliability and observability

- Define SLO-relevant user journeys and instrument traces, metrics, structured logs, errors, and business counters.
- Every dependency call has timeout behavior; retry only safe/transient operations with backoff and jitter.
- Workers expose job state, attempts, terminal failure, and replay/recovery procedures.
- Use health checks that distinguish process health from dependency degradation.

## Testing and delivery

- Unit-test domain rules; integration-test database/adapters; E2E-test critical journeys.
- Add concurrency tests for inventory/reservations and authorization tests for tenant boundaries.
- CI runs type checks, lint, tests, migration validation, dependency/security checks, and build.
- Use preview/staging for meaningful changes; prefer reversible migrations and phased rollout.
- Record architecture decisions that are costly to reverse, including rejected alternatives and triggers to revisit.

