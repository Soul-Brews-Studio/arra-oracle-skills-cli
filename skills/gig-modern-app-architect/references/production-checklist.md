# Production Checklist

Use this as a risk review, not a claim that every checkbox applies.

## Correctness

- [ ] Source of truth and consistency boundaries are explicit.
- [ ] Database constraints protect critical invariants.
- [ ] Retried writes, jobs, and webhooks are idempotent.
- [ ] Concurrency behavior is tested for scarce capacity or money.
- [ ] Time zones, currency precision, and state transitions are defined.

## Security and privacy

- [ ] Authentication and resource-level authorization are tested.
- [ ] Cross-tenant access is denied by construction and regression tests.
- [ ] Secrets, encryption, upload safety, CSRF/CORS, headers, and dependency risk are addressed.
- [ ] Rate limits and abuse/bot controls match exposed surfaces.
- [ ] Personal data collection, retention, export, deletion, and audit meet obligations.

## Reliability

- [ ] Timeouts, retries, circuit/degraded behavior, and terminal failures are defined.
- [ ] Queue backlog, dead jobs, cache failure, provider outage, and duplicate delivery are observable.
- [ ] Backup restoration is tested; RPO/RTO are stated where material.
- [ ] Capacity assumptions and load-test targets match launch traffic.

## Operations

- [ ] Dev, preview/staging, and production are isolated.
- [ ] CI/CD has quality gates and a rollback or roll-forward path.
- [ ] Logs avoid secrets and unnecessary personal data; correlation IDs connect journeys.
- [ ] Alerts map to user impact and have an owner/runbook.
- [ ] Cost budgets and abnormal usage alarms cover infrastructure and AI usage.

## AI and agents, when applicable

- [ ] Model/prompt/tool versions and quality evaluation are traceable.
- [ ] Retrieved/model-generated content is treated as untrusted.
- [ ] Tools use least privilege, schema validation, and risk-based approval.
- [ ] Token, step, runtime, spend, retry, and concurrency limits exist.
- [ ] Untrusted execution is isolated and network/file permissions are scoped.
- [ ] Long-running work is resumable and cancellation is effective.

## Launch evidence

- [ ] Critical E2E journeys pass in the release environment.
- [ ] Load/security/recovery tests cover the highest-impact failure modes.
- [ ] Known assumptions, deferred decisions, and escalation triggers are documented.
- [ ] Operational owner can see health, diagnose failure, and recover service.

