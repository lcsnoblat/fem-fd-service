# Mission Control — General Platform Specification

## 1. Platform Overview

**Mission Control** is a personal productivity and life-management platform built as a unified workspace. It aggregates finance tracking, food discovery, smart shopping, job hunting, calendar management, media viewing, IoT smart home controls, reminders, AI-powered coding assistance, and automated web-scraping reports — all within a single, beautiful, minimal interface.

The platform is designed for a single authenticated user (personal dashboard), with multi-model AI at its core. Local and cloud LLMs are treated as first-class citizens, and all major features have an AI-augmented mode.

---

## 2. Mission Statement

> Replace the chaos of 10+ disconnected apps with one calm, intelligent, and beautiful command center that learns your patterns, saves you time, and quietly keeps your life organized.

---

## 3. Core Principles

| Principle | Description |
|-----------|-------------|
| **Unified** | Every feature lives in one app; no context switching |
| **AI-First** | Every module has at least one AI-augmented workflow |
| **Model-Agnostic** | Works with Ollama (local), Anthropic, OpenAI, Groq, Gemini |
| **Minimal** | Light, geometric, breathing design; no visual noise |
| **Offline-Ready** | PWA with service workers; core features work offline |
| **Type-Safe** | End-to-end TypeScript; no `any`; strict compiler settings |
| **Testable** | Every feature has unit + integration tests; E2E for critical paths |
| **Extensible** | MCP-first architecture; add new tools without touching core |

---

## 4. Feature Modules

| # | Module | Route | Description |
|---|--------|-------|-------------|
| 1 | Dashboard | `/` | Central hub: stats, quick actions, activity feed |
| 2 | Finance | `/finance` | Expense tracking, budgets, reports |
| 3 | Recipes | `/recipes` | AI-curated food discovery, meal planning |
| 4 | Shopping | `/shopping` | Smart lists, price comparison, history |
| 5 | Jobs | `/jobs` | Aggregated job search, application tracker |
| 6 | Calendar | `/calendar` | Tasks, events, Google Calendar sync |
| 7 | Gallery | `/gallery` | Image viewer, album management, AI tags |
| 8 | Smart Home | `/smarthome` | Garage door + IoT device controls |
| 9 | Reminders | `/reminders` | Push notifications, recurring, snooze |
| 10 | Agent | `/agent` | Agentic AI coder with MCP, editor, terminal |
| 11 | Models | `/models` | LLM configuration, keys, usage, costs |
| 12 | Reports | `/reports` | Scheduled scraper reports, templates, exports |

---

## 5. Top-Level User Stories

```
As a user, I want to see an overview of my day — finances, tasks, reminders — in under 5 seconds after opening the app.

As a user, I want to search for a recipe, get AI suggestions based on what I have at home, and add the missing ingredients directly to my shopping list.

As a user, I want to browse job listings aggregated from multiple boards, tag them by interest, and track my application status through a Kanban board.

As a user, I want to open my garage door from the app with a single tap and see the current state (open/closed) in real time.

As a user, I want an AI agent that I can point at a GitHub repo and say "fix the bug in issue #42" and it will autonomously work through the code, test, and push a commit.

As a user, I want web scrapers that run on a schedule and deliver me a clean report — e.g., "best price for item X today" or "new job postings matching my profile."

As a user, I want to configure which AI model powers each feature — use a local Ollama model for quick tasks and Claude Opus for complex agent work.
```

---

## 6. Technical Stack

### Frontend
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | RSC, streaming, layouts, file-based routing |
| Language | TypeScript 5.5+ (strict) | Full type safety, no `any` |
| Styling | Tailwind CSS v4 | Utility-first, design tokens |
| Animations | Framer Motion 11 | Declarative, performant animations |
| Geometric FX | Custom SVG + Canvas API | Unique geometric background effects |
| State (global) | Zustand 5 | Minimal, type-safe global state |
| State (server) | TanStack Query v5 | Caching, background refresh, optimistic updates |
| Forms | React Hook Form + Zod | Validation, type inference from schema |
| Tables | TanStack Table v8 | Virtualized, sortable, filterable |
| Charts | Recharts + D3 | Flexible, composable charts |
| Rich Text | TipTap | Agent notes, rich content editing |
| Code Editor | Monaco Editor | Full VS Code experience in browser |
| Terminal | xterm.js | Terminal emulation for Agent module |
| Icons | Lucide React | Consistent, MIT-licensed icon set |
| Date | date-fns | Lightweight, tree-shakeable |
| i18n | next-intl | Internationalization ready (PT-BR + EN) |

### Backend (Next.js API Routes + tRPC)
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API Layer | tRPC v11 | End-to-end type safety without codegen |
| Auth | Auth.js v5 (NextAuth) | Google OAuth + session management |
| Database ORM | Prisma 5 | Type-safe queries, migrations |
| Database | PostgreSQL 16 | Relational, JSONB for flexible data |
| Cache | Redis (Upstash) | Session cache, rate limiting, pub/sub |
| File Storage | Cloudflare R2 | S3-compatible, images and exports |
| Real-time | Socket.io | Agent streaming, smart home events |
| Queue | BullMQ (Redis-backed) | Scheduled scrapers, async jobs |
| Web Scraping | Playwright | Headless browser scraping |
| AI SDK | Vercel AI SDK 4 | Unified API for all LLM providers |
| MCP | @modelcontextprotocol/sdk | Tool protocol for Agent module |
| Email | Resend | Transactional email for reports |

### Dev Tooling
| Tool | Config |
|------|--------|
| ESLint | `@typescript-eslint/strict` + custom rules |
| Prettier | Single-quote, no-semi, 100-char line |
| Vitest | Unit + integration tests |
| Playwright | E2E tests |
| Husky + lint-staged | Pre-commit hooks |
| Turborepo | Monorepo task pipeline |
| Docker Compose | Local dev environment |

---

## 7. Project Structure

```
mission-control/
├── apps/
│   └── web/                        # Next.js application
│       ├── app/
│       │   ├── (auth)/             # Login, onboarding
│       │   ├── (dashboard)/        # Authenticated routes
│       │   │   ├── page.tsx        # Dashboard /
│       │   │   ├── finance/
│       │   │   ├── recipes/
│       │   │   ├── shopping/
│       │   │   ├── jobs/
│       │   │   ├── calendar/
│       │   │   ├── gallery/
│       │   │   ├── smarthome/
│       │   │   ├── reminders/
│       │   │   ├── agent/
│       │   │   ├── models/
│       │   │   └── reports/
│       │   ├── api/
│       │   │   ├── trpc/[trpc]/
│       │   │   ├── auth/[...nextauth]/
│       │   │   └── webhooks/
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/                 # Base design system components
│       │   ├── layout/             # Shell, sidebar, topbar
│       │   ├── effects/            # Geometric SVG effects
│       │   └── [module]/           # Module-specific components
│       ├── lib/
│       │   ├── trpc/               # tRPC client + server
│       │   ├── db/                 # Prisma client
│       │   ├── ai/                 # AI SDK helpers
│       │   ├── mcp/                # MCP client
│       │   ├── scrapers/           # Scraper definitions
│       │   └── utils/
│       ├── hooks/                  # Shared React hooks
│       ├── stores/                 # Zustand stores
│       ├── types/                  # Shared TypeScript types
│       └── tests/
│           ├── unit/
│           ├── integration/
│           └── e2e/
├── packages/
│   ├── db/                         # Prisma schema + client (shared)
│   ├── ui/                         # Shared component library
│   └── config/                     # Shared ESLint, TypeScript configs
├── workers/                        # BullMQ worker processes
│   ├── scraper-worker.ts
│   └── report-worker.ts
├── specs/                          # ← This directory
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 8. Environment Variables

```env
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# AI Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Smart Home
GARAGE_API_URL=
GARAGE_API_KEY=

# Scraping
SCRAPER_CONCURRENCY=3
SCRAPER_TIMEOUT_MS=30000

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_WS_URL=
```

---

## 9. Phased Delivery Plan

### Phase 0 — Scaffold (Week 1)
- [ ] Monorepo setup with Turborepo
- [ ] Next.js app with strict TypeScript
- [ ] ESLint + Prettier + Husky
- [ ] Prisma + PostgreSQL + Redis (Docker Compose)
- [ ] Auth.js with Google OAuth
- [ ] Design system tokens + base components
- [ ] Layout shell (sidebar, topbar, geometric effects)
- [ ] tRPC setup

### Phase 1 — Core Modules (Weeks 2–4)
- [ ] Dashboard
- [ ] Finance (full CRUD + charts)
- [ ] Reminders (with push notifications)
- [ ] Calendar (local + Google sync)
- [ ] Gallery (upload + view)

### Phase 2 — AI-Augmented Modules (Weeks 5–7)
- [ ] Models configuration
- [ ] Recipes (scraping + AI)
- [ ] Shopping (smart list + price compare)
- [ ] Jobs (aggregation + application tracker)

### Phase 3 — Agentic & IoT (Weeks 8–9)
- [ ] Agent module (MCP + code editor + terminal)
- [ ] Smart Home (garage + IoT)
- [ ] Reports (scheduled scrapers)

### Phase 4 — Polish & Production (Week 10)
- [ ] PWA + service workers
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Full E2E test suite
- [ ] Production deployment

---

## 10. Cross-Cutting Concerns

### Authentication & Authorization
- Single-user by default (personal dashboard)
- Google OAuth via Auth.js
- Session stored in Redis for fast validation
- All tRPC procedures protected by `authedProcedure`
- API routes protected by middleware

### Error Handling
- Zod for all input validation at procedure boundaries
- Typed errors via tRPC `TRPCError`
- Error boundaries on every page
- Toast notifications for user-facing errors
- Sentry for error tracking (optional)

### Performance
- React Server Components for static/cached content
- Streaming for AI responses and large data sets
- Image optimization via Next.js Image
- Lazy loading for heavy modules (Monaco, xterm)
- Virtualized lists for large data sets

### Accessibility
- WCAG 2.1 AA compliance
- All interactive elements keyboard-navigable
- ARIA labels on icons and complex components
- Focus management on modal/panel open
- Color contrast ratios enforced in design tokens

### Internationalization
- PT-BR as primary language
- EN as secondary
- All user-facing strings via next-intl keys
- Date/number formatting locale-aware

---

## 11. Security Requirements

- All API keys stored server-side only, never exposed to client
- CSRF protection on all mutations
- Rate limiting on all public-facing endpoints
- Input sanitization before storage
- Helmet headers via Next.js config
- No `dangerouslySetInnerHTML` without sanitization
- Garage door API calls server-side only
- Secret scanning in CI (GitHub Actions)

---

## 12. Linting & Code Quality Rules

```jsonc
// tsconfig.json — strictest settings
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

```jsonc
// .eslintrc
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

*Last updated: 2026-05-22 | Version: 1.0.0*
