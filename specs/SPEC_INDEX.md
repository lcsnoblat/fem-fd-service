# Mission Control — Master Specification Index

> **Complete platform specification for the Mission Control personal productivity system.**  
> All decisions, architecture, data models, APIs, and design are documented here.

---

## Quick Navigation

### Cross-Cutting Specs

| Document | Description | Status |
|----------|-------------|--------|
| [SPEC_GENERAL.md](./SPEC_GENERAL.md) | Platform overview, principles, tech stack, project structure, phased plan | ✅ Complete |
| [SPEC_ARCHITECTURE.md](./SPEC_ARCHITECTURE.md) | System architecture, frontend/backend patterns, AI/MCP architecture, deployment | ✅ Complete |
| [SPEC_DATABASE.md](./SPEC_DATABASE.md) | Full Prisma schema for all 12 modules, indexes, migrations, seed data | ✅ Complete |
| [SPEC_API.md](./SPEC_API.md) | Complete tRPC procedure definitions, WebSocket events, error codes, rate limits | ✅ Complete |
| [SPEC_DESIGN_SYSTEM.md](./SPEC_DESIGN_SYSTEM.md) | Color tokens, typography, components, geometric effects, animations, a11y | ✅ Complete |
| [SPEC_TESTING.md](./SPEC_TESTING.md) | Testing strategy, Vitest config, E2E with Playwright, CI/CD pipeline | ✅ Complete |

### Page Specs

| Document | Module | Route | Status |
|----------|--------|-------|--------|
| [pages/SPEC_DASHBOARD.md](./pages/SPEC_DASHBOARD.md) | Dashboard | `/` | ✅ Complete |
| [pages/SPEC_FINANCE.md](./pages/SPEC_FINANCE.md) | Finance | `/finance` | ✅ Complete |
| [pages/SPEC_RECIPES.md](./pages/SPEC_RECIPES.md) | Recipes | `/recipes` | ✅ Complete |
| [pages/SPEC_SHOPPING.md](./pages/SPEC_SHOPPING.md) | Shopping | `/shopping` | ✅ Complete |
| [pages/SPEC_JOBS.md](./pages/SPEC_JOBS.md) | Jobs | `/jobs` | ✅ Complete |
| [pages/SPEC_CALENDAR.md](./pages/SPEC_CALENDAR.md) | Calendar | `/calendar` | ✅ Complete |
| [pages/SPEC_GALLERY.md](./pages/SPEC_GALLERY.md) | Gallery | `/gallery` | ✅ Complete |
| [pages/SPEC_SMARTHOME.md](./pages/SPEC_SMARTHOME.md) | Smart Home | `/smarthome` | ✅ Complete |
| [pages/SPEC_REMINDERS.md](./pages/SPEC_REMINDERS.md) | Reminders | `/reminders` | ✅ Complete |
| [pages/SPEC_AGENT.md](./pages/SPEC_AGENT.md) | Agent | `/agent` | ✅ Complete |
| [pages/SPEC_MODELS.md](./pages/SPEC_MODELS.md) | Models | `/models` | ✅ Complete |
| [pages/SPEC_REPORTS.md](./pages/SPEC_REPORTS.md) | Reports | `/reports` | ✅ Complete |

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      MISSION CONTROL                             │
│                  Personal Productivity OS                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend: Next.js 15 + TypeScript (strict) + Tailwind CSS v4   │
│  Backend:  tRPC v11 + Prisma 5 + PostgreSQL 16 + Redis          │
│  AI:       Vercel AI SDK — Anthropic, OpenAI, Groq, Ollama      │
│  MCP:      @modelcontextprotocol/sdk — connect any MCP server   │
│  Scraping: Playwright — scheduled via BullMQ                     │
│  Real-time: Socket.io — AI streaming, IoT state, notifications  │
│  Storage:  Cloudflare R2 — gallery images, report exports       │
│  Auth:     Auth.js v5 — Google OAuth                            │
│  Testing:  Vitest + React Testing Library + Playwright E2E      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Map

```
Dashboard ──────────────────── reads from all modules
    │
    ├── Finance ────────────── standalone + AI categorization
    │
    ├── Recipes ────────────── web scraping + AI + → Shopping
    │       └── Shopping ───── AI suggestions + web scraping
    │
    ├── Jobs ────────────────── web scraping + AI fit score
    │
    ├── Calendar ────────────── Google sync + → Reminders
    │       └── Reminders ───── push notifications + → Calendar
    │
    ├── Gallery ─────────────── R2 storage + AI tagging
    │
    ├── Smart Home ──────────── IoT API + WebSocket real-time
    │
    ├── Agent ───────────────── MCP + Models + WebSocket streaming
    │
    ├── Models ──────────────── powers all AI features
    │
    └── Reports ─────────────── BullMQ scheduling + Playwright scraping
```

---

## Data Flow Overview

```
User Action
    │
    ▼
React Component (validates with Zod)
    │
    ▼
tRPC Mutation/Query (authedProcedure)
    │
    ▼
Service Layer (business logic)
    │
    ├──→ PostgreSQL via Prisma (persistent data)
    ├──→ Redis (cache, rate limit, pub/sub)
    ├──→ External API (Google, IoT, LLM provider)
    └──→ BullMQ (background jobs for scraping/reports)
```

---

## AI Model Assignment

| Feature | Default Model | Reasoning |
|---------|--------------|-----------|
| Agent (autonomous tasks) | claude-opus-4-7 | Highest capability for complex multi-step work |
| Jobs Fit Score | claude-sonnet-4-6 | Good balance for nuanced matching |
| Finance Insights | claude-haiku-4-5 | Fast, cheap, sufficient for summaries |
| Recipes AI | claude-haiku-4-5 | Quick responses for recipe suggestions |
| Shopping AI | claude-haiku-4-5 | Simple categorization + suggestions |
| Reminders NLP | claude-haiku-4-5 | Fast natural language parsing |
| Calendar AI | claude-haiku-4-5 | Time blocking suggestions |
| Gallery Tags | claude-haiku-4-5 | Vision tasks, fast |
| Reports AI | claude-haiku-4-5 | Summary generation |
| All (can override to Ollama) | llama3.2 | Local, free, slower |

---

## Security Checklist

- [x] All routes protected by `authedProcedure` middleware
- [x] API keys encrypted AES-256 at rest, never returned to client
- [x] Rate limiting on all endpoints via Redis
- [x] CSRF protection via tRPC POST + custom header
- [x] Input sanitization via Zod on every procedure
- [x] Garage door API calls server-side only
- [x] File uploads via pre-signed R2 URLs (no data through Next.js)
- [x] Playwright scrapers sandboxed (no filesystem, no internal network)
- [x] Push notification keys (VAPID) server-side only
- [x] Google OAuth tokens stored server-side in encrypted session

---

## Development Checklist (Phase 0 — Scaffold)

Before writing any feature code, this foundation must be solid:

- [ ] Monorepo with Turborepo (`apps/web`, `packages/db`, `packages/ui`)
- [ ] `tsconfig.json` with all strict settings enabled
- [ ] ESLint with `@typescript-eslint/strict-type-checked`
- [ ] Prettier + `import/order` rule
- [ ] Husky pre-commit: lint + typecheck + unit tests
- [ ] Docker Compose: PostgreSQL 16 + Redis 7
- [ ] Prisma schema (full schema from SPEC_DATABASE.md)
- [ ] First migration: `npx prisma migrate dev --name init`
- [ ] Auth.js v5 with Google OAuth configured
- [ ] tRPC router + context setup
- [ ] Tailwind v4 with design tokens from SPEC_DESIGN_SYSTEM.md
- [ ] Base components: Button, Card, Input, Badge, Dialog, Toast
- [ ] Layout shell: Sidebar + Topbar + geometric background
- [ ] Geometric effects: grid lines + orb glow + floating shapes
- [ ] BullMQ worker process bootstrapped
- [ ] Socket.io server initialized

---

## Implementation Order (Recommended)

### Phase 0: Scaffold ← START HERE
1. Monorepo + tooling setup
2. DB schema + auth
3. Design system + layout shell

### Phase 1: Core Modules
4. Dashboard (skeleton, then populate as modules are built)
5. Finance module (most-used, validates full CRUD pattern)
6. Reminders (validates push notifications)
7. Calendar (validates Google sync)
8. Gallery (validates R2 storage)

### Phase 2: AI-Augmented Modules
9. Models configuration (needed before AI features)
10. Recipes (validates scraping + AI)
11. Shopping (builds on recipes)
12. Jobs (validates complex scraping)

### Phase 3: Agentic & IoT
13. Agent (most complex — MCP + streaming + code editor)
14. Smart Home (validates IoT integration)
15. Reports (validates BullMQ scheduling + scraping)

### Phase 4: Polish
16. PWA + service workers
17. Performance optimization
18. Full E2E test suite
19. Production deployment

---

## Key Decisions & Rationale

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API layer | tRPC v11 | End-to-end types without codegen ceremony |
| State management | Zustand + TanStack Query | Separation of global UI state vs server state |
| ORM | Prisma 5 | Best DX for TypeScript, excellent migrations |
| Styling | Tailwind v4 | Design tokens + utility classes, no CSS-in-JS overhead |
| Animations | Framer Motion | Declarative, GPU-accelerated, SSR compatible |
| Code editor | Monaco | VS Code quality, TypeScript IntelliSense |
| Web scraping | Playwright | Most capable headless browser, JS-heavy sites |
| Queue | BullMQ | Battle-tested, Redis-backed, TypeScript-first |
| Push notifications | Web Push API (VAPID) | No third-party service needed, works in PWA |
| File storage | Cloudflare R2 | S3-compatible, cheaper egress, good DX |
| AI SDK | Vercel AI SDK | Unified API, streaming, tool calling, all providers |
| MCP | Official SDK | Standard protocol, future-proof, extensible |

---

*Last updated: 2026-05-22 | Total specs: 18 documents*
