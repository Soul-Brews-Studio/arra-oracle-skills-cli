---
name: gig-modern-app-architect
description: Select, explain, and scaffold a production-ready architecture for modern web applications, including SaaS, MVP, high-traffic transactions, AI-native, realtime, edge, enterprise, multi-tenant, agentic, and content systems. Use when starting, redesigning, or reviewing an application architecture; do not trigger for a narrow isolated code fix.
---

# Gig Modern App Architect

Turn product intent and failure modes into the smallest production-capable architecture. Preserve the user's requested tools unless a concrete incompatibility or material risk requires a change.

## Operating modes

Infer the mode from the request:

- **Recommend:** return a decision-ready architecture and trade-offs.
- **Scaffold:** create an architecture pack and project structure suitable for implementation.
- **Review:** identify the highest-impact architecture risks first, then propose bounded fixes.
- **Migrate:** describe current-to-target stages with rollback and compatibility constraints.

If the user asked to build, do not stop at advice. Produce the requested files or code and verify them.

## Workflow

1. Extract only decision-changing facts: product type, users and tenants, traffic shape, write contention, consistency needs, realtime behavior, AI workloads, sensitive data, integrations, team constraints, budget, deployment target, and delivery horizon.
2. Ask only when a missing answer would change the primary pattern, data isolation, payment correctness, or deployment boundary. Otherwise state a safe assumption and continue.
3. Read [references/decision-tree.md](references/decision-tree.md) to select one primary pattern. Add capabilities as modules; do not blend multiple primary patterns without a demonstrated need.
4. Read only the selected pattern in [references/stack-patterns.md](references/stack-patterns.md). For AI or agentic systems, also read the AI/agent invariants in that file.
5. Apply [references/engineering-standard.md](references/engineering-standard.md). For launch readiness, security reviews, payments, personal data, or high concurrency, also read [references/production-checklist.md](references/production-checklist.md).
6. Verify version-sensitive choices against official documentation when current versions materially affect the answer. Prefer stable/LTS and security-supported versions. Never invent a version; record the verification date and source when web research is used.
7. Deliver the architecture contract below. When scaffolding, use `scripts/create_architecture_pack.py` to generate the baseline pack, then adapt it to the project rather than returning the generic output unchanged.

## Default foundation

For ordinary business applications, start with a modular monolith:

- Next.js App Router + React + TypeScript
- Tailwind CSS + shadcn/ui + accessible primitives
- Zod at trust boundaries; React Hook Form for complex client forms
- Better Auth or Auth.js for authentication (managed: Supabase Auth / Clerk)
- PostgreSQL as system of record; Drizzle ORM unless the project already standardizes elsewhere
- Object storage for files; transactional email provider for notifications
- OpenTelemetry-compatible telemetry, error tracking, Vitest, Playwright, and CI

Add Redis, queues, realtime infrastructure, vector search, payments, or edge state only when a stated workload or failure mode justifies them. PostgreSQL remains the default source of truth; Redis coordinates, queues defer work, and payment webhooks establish payment state.

## Architecture contract

Return or create these artifacts at the depth warranted by the request:

1. **Decision summary:** primary pattern, selected modules, assumptions, and why this is the minimum sufficient architecture.
2. **System boundaries:** clients, application/BFF, domain modules, workers, data stores, external services, and trust boundaries.
3. **Data and consistency:** source of truth, tenant isolation, transactions, idempotency, cache policy, retention, and backup/restore.
4. **Failure model:** likely failures, prevention, detection, recovery, and degraded behavior.
5. **Security baseline:** authentication, authorization, secrets, validation, rate limits, audit, uploads, and privacy obligations.
6. **Delivery plan:** repository structure, environments, CI/CD, observability, testing, rollout, and explicit scale-up triggers.
7. **Decisions deferred:** choices that should wait for evidence, with the metric or condition that will trigger them.

Use a compact table for exact mappings and Mermaid only when topology or event order becomes materially clearer.

## Non-negotiable invariants

- Start with a modular monolith unless independent scaling, isolation, ownership, or regulatory boundaries are already proven.
- Never depend on cache as the only durable record.
- Every retryable mutation needs an idempotency strategy.
- Capacity, inventory, booking, and financial changes require an authoritative atomic commit path.
- Background work must define retry, timeout, dead-letter or terminal failure behavior, and observability.
- Multi-tenant data must carry tenant identity and enforce isolation at the data-access boundary; use database policies when the threat model warrants them.
- AI output is untrusted input. Validate tool arguments, scope permissions, bound cost/time, isolate untrusted execution, and retain auditable traces without leaking secrets.
- Do not claim "production-ready" without naming remaining operational assumptions and verifying the relevant checklist.