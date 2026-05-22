# Mission Control — Architecture Specification

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser / PWA)                      │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │Dashboard │  │ Finance  │  │  Agent   │  │  Other Modules   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │              │                  │             │
│  ┌────▼──────────────▼──────────────▼──────────────────▼─────────┐ │
│  │              tRPC Client + TanStack Query + Zustand            │ │
│  └────────────────────────────────┬───────────────────────────────┘ │
│                                   │ HTTP/WS                         │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────┐
│                     NEXT.JS SERVER (API Layer)                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Auth Middleware                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────────┐   │
│  │  tRPC Router   │  │  WebSocket      │  │  Webhook Handlers  │   │
│  │  (procedures)  │  │  (Socket.io)    │  │  (IoT, scrapers)   │   │
│  └───────┬────────┘  └────────┬────────┘  └─────────┬──────────┘   │
│          │                    │                       │              │
│  ┌───────▼────────────────────▼───────────────────────▼──────────┐ │
│  │                      Service Layer                             │ │
│  │  FinanceService | RecipeService | JobService | AgentService    │ │
│  │  CalendarService | ScraperService | IoTService | ...           │ │
│  └───────┬─────────────────────────────────────────────┬──────────┘ │
│          │                                             │             │
└──────────┼─────────────────────────────────────────────┼────────────┘
           │                                             │
    ┌──────▼──────────────────────────────────┐  ┌──────▼──────────┐
    │           Data Layer                     │  │  External APIs  │
    │  ┌──────────┐  ┌────────┐  ┌─────────┐ │  │                 │
    │  │PostgreSQL│  │ Redis  │  │   R2    │ │  │  Google APIs    │
    │  │(Prisma)  │  │(Cache) │  │(Storage)│ │  │  LLM Providers  │
    │  └──────────┘  └────────┘  └─────────┘ │  │  Job Boards     │
    └──────────────────────────────────────────┘  │  Garage API     │
                                                  │  Recipe Sites   │
                                                  └─────────────────┘
           │
    ┌──────▼────────────────────────────────────┐
    │           Background Workers               │
    │  ┌───────────────┐  ┌──────────────────┐  │
    │  │ Scraper Worker│  │  Report Worker   │  │
    │  │ (BullMQ)      │  │  (BullMQ)        │  │
    │  └───────────────┘  └──────────────────┘  │
    └────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Next.js App Router Structure

```
app/
├── (auth)/
│   ├── login/page.tsx              # Google OAuth entry point
│   └── layout.tsx                  # Minimal auth layout
│
├── (dashboard)/
│   ├── layout.tsx                  # Shell: Sidebar + Topbar + geometric bg
│   ├── page.tsx                    # Dashboard
│   ├── finance/
│   │   ├── page.tsx                # Finance overview
│   │   ├── transactions/page.tsx   # Full transaction history
│   │   └── budgets/page.tsx        # Budget management
│   ├── recipes/
│   │   ├── page.tsx                # Recipe search + discovery
│   │   └── [id]/page.tsx           # Recipe detail
│   ├── shopping/
│   │   ├── page.tsx                # Active shopping lists
│   │   └── history/page.tsx        # Past lists
│   ├── jobs/
│   │   ├── page.tsx                # Job feed + filters
│   │   ├── saved/page.tsx          # Bookmarked jobs
│   │   └── tracker/page.tsx        # Application Kanban
│   ├── calendar/
│   │   └── page.tsx                # Calendar with tasks
│   ├── gallery/
│   │   ├── page.tsx                # Gallery grid
│   │   └── [albumId]/page.tsx      # Album view
│   ├── smarthome/
│   │   └── page.tsx                # IoT controls
│   ├── reminders/
│   │   └── page.tsx                # Reminders list + create
│   ├── agent/
│   │   ├── page.tsx                # Agent workspace
│   │   └── [sessionId]/page.tsx    # Active session
│   ├── models/
│   │   └── page.tsx                # Model configuration
│   └── reports/
│       ├── page.tsx                # Reports dashboard
│       └── [reportId]/page.tsx     # Report detail
│
└── api/
    ├── trpc/[trpc]/route.ts
    ├── auth/[...nextauth]/route.ts
    ├── ws/route.ts                  # WebSocket upgrade
    └── webhooks/
        ├── garage/route.ts
        └── scraper/route.ts
```

### 2.2 Component Architecture

```
components/
├── ui/                             # Primitives (built on Radix UI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── progress.tsx
│   ├── skeleton.tsx
│   ├── toast.tsx
│   ├── tabs.tsx
│   ├── select.tsx
│   ├── switch.tsx
│   ├── slider.tsx
│   ├── chart.tsx                   # Recharts wrapper
│   └── data-table.tsx              # TanStack Table wrapper
│
├── layout/
│   ├── shell.tsx                   # Root layout wrapper
│   ├── sidebar.tsx                 # Navigation sidebar
│   ├── topbar.tsx                  # Top bar with search + user
│   ├── mobile-nav.tsx              # Bottom nav for mobile
│   └── command-palette.tsx         # Cmd+K global search
│
├── effects/
│   ├── geometric-bg.tsx            # Animated geometric background
│   ├── particle-field.tsx          # Subtle floating particles
│   ├── grid-lines.tsx              # Perspective grid lines
│   └── glow-cursor.tsx             # Cursor glow effect
│
├── ai/
│   ├── model-selector.tsx          # Reusable model picker
│   ├── message-stream.tsx          # Streaming AI response
│   └── thinking-indicator.tsx      # AI thinking animation
│
└── [module]/                       # Module-specific components
    ├── finance/
    ├── recipes/
    ├── shopping/
    ├── jobs/
    ├── calendar/
    ├── gallery/
    ├── smarthome/
    ├── reminders/
    ├── agent/
    ├── models/
    └── reports/
```

### 2.3 State Architecture

```
State layers (from global → local):
                                                     
  Zustand (global, persisted)
  ├── auth store          → current user, session
  ├── ui store            → sidebar open, theme, command palette
  ├── model store         → active model per feature
  └── notification store  → push notification state

  TanStack Query (server state)
  ├── Caches tRPC responses
  ├── Background refetch on window focus
  ├── Optimistic updates for mutations
  └── Infinite queries for paginated lists

  React state (local, ephemeral)
  ├── Form state (React Hook Form)
  ├── UI toggles (expanded/collapsed)
  └── Drag-and-drop state
```

### 2.4 tRPC Router Map

```typescript
// Root router structure
router({
  auth: authRouter,
  finance: financeRouter,        // transactions, categories, budgets
  recipes: recipesRouter,        // search, save, mealPlan
  shopping: shoppingRouter,      // lists, items, priceCompare
  jobs: jobsRouter,              // feed, saved, applications
  calendar: calendarRouter,      // events, tasks, googleSync
  gallery: galleryRouter,        // albums, images, tags
  smarthome: smarthomeRouter,    // devices, status, control
  reminders: remindersRouter,    // reminders, schedules
  agent: agentRouter,            // sessions, messages, mcp
  models: modelsRouter,          // providers, keys, usage
  reports: reportsRouter,        // scrapers, schedules, results
  notifications: notifRouter,    // push subscriptions, send
})
```

---

## 3. Backend Architecture

### 3.1 Service Layer Pattern

Each module follows the same service pattern:

```typescript
// lib/services/finance.service.ts
export class FinanceService {
  constructor(private readonly db: PrismaClient) {}

  async getTransactions(userId: string, opts: TransactionQueryOpts) { ... }
  async createTransaction(userId: string, input: CreateTransactionInput) { ... }
  async updateTransaction(id: string, userId: string, input: UpdateTransactionInput) { ... }
  async deleteTransaction(id: string, userId: string) { ... }
  async getBudgetSummary(userId: string, month: Date) { ... }
  async getSpendingByCategory(userId: string, range: DateRange) { ... }
}

// Services are instantiated once and injected into tRPC context
```

### 3.2 tRPC Procedure Pattern

```typescript
// Authenticated procedure base
const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, userId: ctx.session.user.id } });
});

// Example router
export const financeRouter = router({
  getTransactions: authedProcedure
    .input(transactionQuerySchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.finance.getTransactions(ctx.userId, input);
    }),

  createTransaction: authedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.services.finance.createTransaction(ctx.userId, input);
    }),
});
```

### 3.3 Middleware Stack

```
Request → [Rate Limiter] → [Auth Middleware] → [CSRF Check] → [Handler]
                                ↓
                    Redis session lookup
                    (< 1ms for cached sessions)
```

### 3.4 Background Workers

```typescript
// workers/scraper-worker.ts
const scraperQueue = new Queue('scrapers', { connection: redis });

const scraperWorker = new Worker('scrapers', async (job) => {
  const { scraperId, config } = job.data;
  const result = await runScraper(config);
  await db.scraperRun.create({ data: { scraperId, result, status: 'completed' } });
  await notifyUser(config.userId, 'report-ready', { scraperId });
}, { connection: redis, concurrency: 3 });
```

---

## 4. AI Architecture

### 4.1 Model Provider Abstraction

```typescript
// lib/ai/provider.ts
export type ModelProvider = 'anthropic' | 'openai' | 'groq' | 'google' | 'ollama';

export interface ModelConfig {
  provider: ModelProvider;
  modelId: string;
  baseUrl?: string;        // for Ollama
  apiKey?: string;         // resolved server-side from DB
  temperature?: number;
  maxTokens?: number;
}

// lib/ai/client.ts
export function getAIClient(config: ModelConfig) {
  switch (config.provider) {
    case 'anthropic': return createAnthropic({ apiKey: config.apiKey });
    case 'openai': return createOpenAI({ apiKey: config.apiKey });
    case 'groq': return createGroq({ apiKey: config.apiKey });
    case 'google': return createGoogleGenerativeAI({ apiKey: config.apiKey });
    case 'ollama': return createOllama({ baseURL: config.baseUrl });
  }
}

// Each feature has a model slot in DB, user configures per-feature
```

### 4.2 Vercel AI SDK Usage

```typescript
// Streaming text generation (used by Agent, Recipes AI, etc.)
export async function streamAIResponse(
  prompt: string,
  featureSlot: ModelSlot,
  systemPrompt?: string,
) {
  const config = await getModelConfigForSlot(featureSlot);
  const client = getAIClient(config);

  return streamText({
    model: client(config.modelId),
    system: systemPrompt,
    prompt,
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 4096,
  });
}
```

### 4.3 MCP Architecture (Agent Module)

```typescript
// lib/mcp/client.ts
export class MCPClientManager {
  private clients = new Map<string, Client>();

  async connect(serverId: string, config: MCPServerConfig) {
    const transport = config.type === 'stdio'
      ? new StdioClientTransport({ command: config.command, args: config.args })
      : new SSEClientTransport(new URL(config.url));

    const client = new Client({ name: 'mission-control', version: '1.0.0' });
    await client.connect(transport);
    this.clients.set(serverId, client);
    return client;
  }

  async callTool(serverId: string, toolName: string, args: unknown) {
    const client = this.clients.get(serverId);
    if (!client) throw new Error(`MCP server ${serverId} not connected`);
    return client.callTool({ name: toolName, arguments: args as Record<string, unknown> });
  }

  getAvailableTools(serverId: string) {
    return this.clients.get(serverId)?.listTools();
  }
}
```

### 4.4 Agentic Loop (Agent Module)

```
User message
    │
    ▼
Agent receives message + tools list (MCP tools + built-in tools)
    │
    ▼
LLM generates response (may include tool_use blocks)
    │
    ├──→ If text only → stream to user
    │
    └──→ If tool_use → execute tool → feed result back → LLM continues
              │
              └──→ Repeat until no more tool_use (max 20 iterations)
                        │
                        ▼
                  Final response → stream to user
```

---

## 5. Database Architecture

### 5.1 Connection Strategy

```typescript
// packages/db/src/client.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 5.2 Redis Usage

| Purpose | Key Pattern | TTL |
|---------|-------------|-----|
| Session cache | `session:{sessionId}` | 7 days |
| Rate limit counter | `ratelimit:{ip}:{endpoint}` | 1 min |
| Job queue | BullMQ (managed) | N/A |
| IoT device state | `iot:device:{deviceId}` | 30 sec |
| Scraper lock | `scraper:lock:{scraperId}` | 10 min |
| AI response cache | `ai:cache:{hash}` | 1 hour |

---

## 6. Real-Time Architecture

### 6.1 WebSocket Events

```typescript
// Server → Client events
type ServerToClientEvents = {
  'garage:state-changed': (state: GarageState) => void;
  'agent:token': (token: string) => void;
  'agent:tool-call': (tool: ToolCall) => void;
  'agent:tool-result': (result: ToolResult) => void;
  'agent:done': () => void;
  'scraper:progress': (progress: ScraperProgress) => void;
  'scraper:complete': (result: ScraperResult) => void;
  'notification': (notification: AppNotification) => void;
};

// Client → Server events
type ClientToServerEvents = {
  'agent:send': (message: string, sessionId: string) => void;
  'agent:cancel': (sessionId: string) => void;
  'garage:subscribe': (deviceId: string) => void;
};
```

---

## 7. File Storage Architecture

```
R2 Bucket structure:
mission-control-{env}/
├── gallery/
│   └── {userId}/
│       └── {albumId}/
│           └── {imageId}.{ext}
│
├── reports/
│   └── {userId}/
│       └── {reportId}/
│           └── {timestamp}.{pdf|csv|json}
│
└── exports/
    └── {userId}/
        └── {timestamp}-{type}.{ext}
```

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
User → Login page → Google OAuth redirect
    → Google consent → Callback with code
    → Auth.js exchanges code for tokens
    → Creates/updates user in DB
    → Creates session → stores in Redis
    → Sets HTTP-only session cookie
    → Redirects to dashboard
```

### 8.2 API Security Layers

```
Request
├── HTTPS only (force redirect in Next.js config)
├── CORS: same-origin only
├── Rate limiting: 100 req/min per IP (Redis)
├── Auth check: session cookie → Redis lookup
├── CSRF: tRPC uses POST + custom header
├── Input validation: Zod schema on every procedure
└── Output: TypeScript types prevent data leaks
```

### 8.3 Secrets Management

- API keys encrypted at rest in PostgreSQL (AES-256)
- Encryption key stored in environment variable only
- Never returned to client (only `hasKey: boolean`)
- Server-side-only services for garage, scraping

---

## 9. Performance Architecture

### 9.1 Caching Strategy

```
Route rendering:
├── Static (no data) → full SSG
├── Auth-gated pages → no cache (user-specific)
├── Public recipe/job search → ISR (60s revalidate)
└── Reports → cache result after generation

Data fetching:
├── TanStack Query: staleTime: 30s, gcTime: 5min
├── Redis: AI responses cached by prompt hash (1h)
└── Scraper results: cached in DB, no re-run within TTL
```

### 9.2 Code Splitting

```
Heavy modules lazy-loaded:
├── Monaco Editor (1.2MB) → dynamic import on /agent
├── xterm.js (500KB) → dynamic import on /agent
├── D3 (250KB) → dynamic import on /finance charts
└── Playwright (server-only, never bundled)
```

### 9.3 Image Optimization

- All gallery images served through Next.js Image with srcset
- Thumbnails generated server-side at upload (sharp)
- Placeholder blur hashes stored in DB

---

## 10. Deployment Architecture

```
Production:
├── Vercel (Next.js app)
│   ├── Edge runtime for middleware
│   └── Node.js runtime for API routes
│
├── Upstash Redis (serverless Redis)
│
├── Neon PostgreSQL (serverless Postgres)
│
├── Cloudflare R2 (file storage)
│
└── BullMQ Worker (separate Node.js process)
    └── Railway or Fly.io

Development (Docker Compose):
├── next dev
├── PostgreSQL container
├── Redis container
└── ts-node workers/scraper-worker.ts
```

---

*Last updated: 2026-05-22 | Version: 1.0.0*
