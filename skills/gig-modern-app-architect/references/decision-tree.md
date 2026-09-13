# Architecture Decision Tree

Choose one primary pattern, then add modules.

## Primary selection

| Dominant product condition | Primary pattern |
|---|---|
| Ordinary SaaS, dashboard, portal, or business workflow | A — Modern Full-Stack |
| Learning demand and shipping speed dominate; low initial operational complexity | B — Rapid MVP |
| Scarce capacity, booking, checkout, ticketing, flash crowd, or financial correctness | C — High-Scale Transaction |
| Model inference, RAG, document intelligence, or copilots are core product behavior | D — AI-Native |
| Shared live state, chat, presence, tracking, or collaboration | E — Realtime |
| Users are globally distributed and latency/state locality is a product requirement | F — Edge / Global |
| Many business domains and teams; independently owned boundaries are emerging | G — Enterprise Modular |
| Organization isolation, memberships, delegated administration, or per-tenant policy | H — Multi-Tenant SaaS |
| Autonomous multi-step execution with tools, memory, permissions, or sandboxes | I — Agentic Platform |
| Publishing, SEO, marketing pages, newsroom, docs, or content-led discovery | J — Content / Marketing |

If two rows match, choose the pattern that governs correctness or the largest irreversible risk. Treat the other as an added module. Example: an AI document SaaS is D primary + H tenant module, not two separate architectures.

## Module triggers

| Module | Add when | Do not add merely because |
|---|---|---|
| Auth/RBAC | Private data, roles, organizations, admin operations | The site has a contact form |
| Redis | Distributed coordination, hot ephemeral state, rate limit, reservation TTL | “Caching is modern” |
| Queue/worker | Slow, retryable, scheduled, bursty, or fan-out work | A request can safely finish inline |
| Object storage | User files, exports, media, large immutable objects | Small structured records fit the DB |
| Search | Users need ranked full-text/faceted retrieval beyond DB indexes | There is only simple filtering |
| Vector search | Semantic retrieval is evaluated and improves the target task | The product calls an LLM |
| Realtime | User value depends on sub-second shared updates/presence | Polling every few seconds is sufficient |
| Payment | Money is collected or reconciled | Pricing is displayed only |
| Edge state | Regional coordination or global latency is measured as material | CDN caching already solves delivery |
| Sandbox | Untrusted or generated code/actions execute | The model only returns text |

## Complexity gates

- Extract a service when it needs independent scaling, release ownership, security isolation, or a distinct reliability target.
- Add an event bus when multiple independent consumers and replay/ordering requirements exist; a queue is enough for ordinary background jobs.
- Add Kubernetes only when orchestration requirements and operating capability exceed managed platform/container primitives.
- Use multi-region writes only when measured availability/latency needs justify conflict resolution and operational cost.

