# Stack Patterns

Versions below are product families, not permanent pins. Verify stable/LTS and security support before implementation.

## A — Modern Full-Stack

Use Next.js + React + TypeScript, PostgreSQL + Drizzle, Tailwind + shadcn/ui, object storage, managed auth or a well-supported auth library (Better Auth / Auth.js; managed: Supabase Auth / Clerk), telemetry, tests, and managed deployment (Vercel, Cloudflare, or Fly). Organize domain modules inside one deployable application.

Fork — TanStack Start: when end-to-end route type safety, Vite speed, and deploy-anywhere output (no app-router/Vercel lock-in) matter more than RSC and ecosystem depth, use TanStack Start instead of the Next.js App Router. Keep the same data and UI layers: PostgreSQL + Drizzle, Tailwind + shadcn/ui, with TanStack Query as the data layer.

## B — Rapid MVP

Use Next.js + TypeScript with Supabase for PostgreSQL, Auth, Storage, and Realtime, deployed on a managed platform (Vercel, Cloudflare, or Fly). Optimize for validated learning. Keep domain interfaces clean so vendor-specific concerns can be replaced after product-market evidence appears.

## C — High-Scale Transaction

Use CDN/WAF/bot protection, Next.js/API, PostgreSQL, Redis for coordination, a queue/worker, object storage, transactional email, and payment webhooks. Inventory/reservations require atomic authoritative commits, TTL expiration, reconciliation, idempotency, and audit logs. Redis is not the final ledger.

## D — AI-Native

Use a web application, server-side AI gateway/model adapter, PostgreSQL for product state, object storage for source documents, evaluated retrieval, queues for long work, and cost/quality telemetry. Store prompt/model/tool versions with executions. Design graceful degradation and model portability at the adapter boundary, not as premature multi-provider complexity.

## E — Realtime

Use HTTP for durable commands and snapshots; WebSocket/SSE for live updates; PostgreSQL for durable state; Redis pub/sub or a managed realtime layer (Supabase Realtime, Pusher, Ably; LiveKit when audio/video is involved) for fan-out. Define room/session ownership, reconnect/resume behavior, ordering expectations, presence expiry, and backpressure.

## F — Edge / Global

Use CDN and edge compute for latency-sensitive paths, with regional or stateful primitives only when needed. State where writes are authoritative, how data residency works, and what happens during partition. Avoid global writes by default.

## G — Enterprise Modular

Use a modular monolith with explicit domain boundaries, application services, adapters, and shared contracts. Add BFF/API and event integration as needed. Extract services only after scaling, team ownership, isolation, or release independence becomes concrete.

## H — Multi-Tenant SaaS

Model organization, user, membership, role, and permission explicitly. Every tenant-owned entity carries tenant identity. Enforce tenant scoping in repositories/data access, test cross-tenant denial, and select shared tables, schemas, or databases based on isolation and operational needs. Include tenant-aware audit, quotas, exports, and deletion.

## I — Agentic Platform

Use web/API, orchestrator/agent runtime, tool registry, permissions, durable job state, queue/workers, sandbox where execution is untrusted, and audit/evaluation. Separate goal, plan, action, observation, correction, and terminal state. Human approval is required at risk-changing boundaries, not as a decorative UI step.

Agent invariants:

- Least-privilege tool scopes and per-action authorization.
- Typed/validated tool inputs and outputs.
- Bounded steps, tokens, runtime, spend, retries, and concurrency.
- Durable resumability for long jobs.
- Prompt-injection defenses around retrieved data and tool use.
- Human approval for irreversible, financial, publishing, permission, or external communication actions when not explicitly pre-authorized.
- Evaluation of task success, safety, latency, and cost using representative cases.

## J — Content / Marketing

Use Next.js or Astro, a headless CMS when editors need it, static generation or cached rendering, CDN, image optimization, SEO metadata/structured data, analytics, and search only if corpus size warrants it. Avoid transactional infrastructure that content publishing does not need.

## Composable module catalog

`core`, `auth`, `database`, `tenancy`, `storage`, `redis`, `queue`, `payment`, `email`, `realtime`, `search`, `vector`, `ai`, `agent`, `analytics`, `observability`, `audit`, `edge`, `cms`.