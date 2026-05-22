# SPEC_SHOPPING.md — Shopping Module
**Platform:** Mission Control Personal Productivity Platform
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, Playwright, Vercel AI SDK

---

## 1. Overview

The Shopping module is a full-featured smart list manager that goes beyond a simple checklist. It ingests items from the Recipes meal planner, uses AI to suggest quantities and complementary products, and leverages Playwright-powered price comparison scraping to help users find the best deal for each item. Every list action is optimistic — the UI responds instantly and syncs silently in the background.

### Core Capabilities

| Capability | Description |
|---|---|
| Smart List Management | Create, edit, archive, and share shopping lists |
| Recipe Import | Bulk-import ingredients from any recipe or weekly meal plan |
| AI Suggestions | Auto-suggest quantities, categories, and complementary items |
| Price Comparison | Real-time price scraping across major Brazilian retailers |
| Price Alerts | Set a target price for an item — get notified when it drops |
| Auto-Categorization | Items auto-grouped by aisle: Produce, Dairy, Meat, etc. |
| Sharing | Shareable read-only links with no auth required |
| Purchase History | Track completed lists, re-activate them, and view spend analytics |

---

## 2. User Stories

### US-01 — Quick Item Entry
**As a** user in a hurry,
**I want to** type an item name and press Enter to add it instantly,
**so that** I can build my shopping list as fast as I can think.

**Acceptance Criteria:**
- Item is added optimistically in < 50ms (local state first, server sync in background)
- AI automatically detects and assigns the item's category (no user action needed)
- Duplicate detection: if item already exists, quantity increments instead of creating a duplicate
- Common shorthand is understood: "2L milk" → quantity: 2, unit: L, name: milk

---

### US-02 — Recipe Import
**As a** user who planned their meals,
**I want to** import all ingredients from my weekly meal plan into a shopping list,
**so that** I don't have to manually transcribe each ingredient.

**Acceptance Criteria:**
- "Import from Meal Plan" triggers `addItemsFromRecipe` in bulk (single mutation)
- Identical ingredients across recipes are merged (e.g., 3× garlic becomes 1 item)
- Imported items show a "from recipe" badge and source recipe name on hover
- User can de-select individual items before confirming the import

---

### US-03 — Price Comparison
**As a** budget-conscious shopper,
**I want to** tap any item and see the current price at nearby stores,
**so that** I can make informed purchase decisions without leaving the app.

**Acceptance Criteria:**
- Price panel slides in from the right when an item is selected
- Shows top 5 results: store name, price, unit, and a "Buy" link
- Results are cached for 2 hours with a timestamp shown ("Updated 45m ago")
- If scraping fails, shows a graceful error with a retry button
- Price trend graph shown if ≥ 3 historical scrapes exist for the item

---

### US-04 — Price Alerts
**As a** user who watches prices,
**I want to** set a target price for an item and receive a notification when it drops below that threshold,
**so that** I can buy at the right moment without checking manually.

**Acceptance Criteria:**
- Alert modal appears when user clicks the bell icon on any item
- User enters a target price and selects which stores to monitor
- Alert is checked on each scraping cycle (every 2h)
- Notification appears in Mission Control's notification center

---

### US-05 — Shareable Lists
**As a** user shopping with a partner,
**I want to** share my shopping list via a link that requires no login,
**so that** my partner can view and check off items in real time.

**Acceptance Criteria:**
- "Share" button generates a unique, unguessable token URL
- Read-only view shows all items grouped by category
- Checking off items in the shared view updates the owner's list in real time (WebSocket or polling)
- Share can be revoked, invalidating the token

---

### US-06 — Purchase History and Re-activation
**As a** user who shops the same items regularly,
**I want to** view my past completed shopping lists and re-activate one as a new list,
**so that** I don't have to build the same list from scratch each week.

**Acceptance Criteria:**
- History tab shows all archived/completed lists sorted by date
- Clicking "Re-use list" creates a new active list with the same items (all unchecked)
- Analytics panel shows average spend per list, most frequently bought items, and category breakdown

---

### US-07 — AI-Assisted Estimation
**As a** user who often forgets quantities,
**I want to** let AI suggest quantities and flag missing complementary items,
**so that** I can complete my list faster and avoid forgetting essentials.

**Acceptance Criteria:**
- AI suggestions appear as a dismissible panel at the bottom of the active list
- Suggestions are based on: past purchase history, currently checked items, and time of year
- Each suggestion shows a one-tap "Add" button
- AI estimates a total cost for the list using scraped/historical prices

---

## 3. UI Layout

### 3.1 — Main Shopping Page (`/shopping`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  MISSION CONTROL                                              [+ New List] [Avatar]│
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─ LISTS SIDEBAR (~22%) ──────┐  ┌─ ACTIVE LIST (~48%) ──────────────────────┐ │
│  │                             │  │                                           │ │
│  │  📋 MY LISTS                │  │  🛒 Weekly Groceries          [✏️] [🔗] [⋮] │ │
│  │  ─────────────────────────  │  │  ─────────────────────────────────────── │ │
│  │  ▶ Weekly Groceries (12)   │  │                                           │ │
│  │    Party Shopping (8)      │  │  [+ Add item...            ] [Import 🍽️]  │ │
│  │    Date Night (5)          │  │                                           │ │
│  │                             │  │  🥦 PRODUCE (4 items)                   │ │
│  │  ─────────────────────────  │  │  ┌─────────────────────────────────────┐ │ │
│  │  📁 COMPLETED               │  │  │ ☐  Broccoli         1 head   💰 🔔  │ │ │
│  │    Last week (15) ✓        │  │  │ ☐  Tomatoes         500g     💰 🔔  │ │ │
│  │    Mar 15 (9) ✓            │  │  │ ☑  Garlic           2 bulbs           │ │ │
│  │    Mar 8 (21) ✓            │  │  │ ☑  Spinach          200g              │ │ │
│  │                             │  │  └─────────────────────────────────────┘ │ │
│  │  ─────────────────────────  │  │                                           │ │
│  │  📊 ANALYTICS               │  │  🥩 MEAT & SEAFOOD (2 items)            │ │
│  │  Avg spend: R$187/list      │  │  ┌─────────────────────────────────────┐ │ │
│  │  Top item: Eggs (8×)        │  │  │ ☐  Chicken breast   1kg      💰 🔔  │ │ │
│  │                             │  │  │ ☐  Salmon fillet    400g     💰 🔔  │ │ │
│  │  [+ New List]               │  │  └─────────────────────────────────────┘ │ │
│  │                             │  │                                           │ │
│  │                             │  │  🧀 DAIRY (3 items)                     │ │
│  │                             │  │  ┌─────────────────────────────────────┐ │ │
│  │                             │  │  │ ☐  Whole milk       2L       💰 🔔  │ │ │
│  │                             │  │  │ ☐  Greek yogurt     500g     💰 🔔  │ │ │
│  │                             │  │  │ ☐  Cheddar cheese   200g     💰 🔔  │ │ │
│  │                             │  │  └─────────────────────────────────────┘ │ │
│  │                             │  │                                           │ │
│  │                             │  │  🤖 AI SUGGESTS                         │ │
│  │                             │  │  ┌─────────────────────────────────────┐ │ │
│  │                             │  │  │ + Eggs (you usually buy with milk)  │ │ │
│  │                             │  │  │ + Butter (low in your history)      │ │ │
│  │                             │  │  │                          [Dismiss]  │ │ │
│  │                             │  │  └─────────────────────────────────────┘ │ │
│  │                             │  │                                           │ │
│  │                             │  │  Estimated total: ~R$ 143.50             │ │
│  └─────────────────────────────┘  └───────────────────────────────────────────┘ │
│                                                                                  │
│  ┌─ PRICE COMPARE PANEL (~30%) — slides in when 💰 clicked ─────────────────┐   │
│  │  💰 Price comparison: "Broccoli"                              [✕ Close]   │   │
│  │  Updated: 1h 12m ago  [🔄 Refresh]                                        │   │
│  │                                                                           │   │
│  │  #1  Mercado Livre     R$ 2.49 / head  ⭐ Best price  [Buy →]            │   │
│  │  #2  Americanas        R$ 2.99 / head               [Buy →]              │   │
│  │  #3  Extra Online      R$ 3.10 / head               [Buy →]              │   │
│  │  #4  Carrefour         R$ 3.49 / head               [Buy →]              │   │
│  │  #5  iFood Mercado     R$ 3.89 / head               [Buy →]              │   │
│  │                                                                           │   │
│  │  📈 Price History (last 30 days)                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐    │   │
│  │  │ R$4 ┤                                                             │    │   │
│  │  │ R$3 ┤  ●──●     ●──●──●                    ●                     │    │   │
│  │  │ R$2 ┤      ●──●           ●──●──●──●──●──●   ●──●──●             │    │   │
│  │  │     └──────────────────────────────────────────────────────       │    │   │
│  │  │     Mar 1                Mar 15                May 1              │    │   │
│  │  └──────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                           │   │
│  │  🔔 Set Price Alert                                                       │   │
│  │  Target: [R$ ____]  Stores: [All ▾]  [Set Alert]                         │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 — Shared List View (`/shopping/shared/[token]`)

```
┌───────────────────────────────────────────────────────────┐
│  🛒 Weekly Groceries — shared by Lucas           [Mission Control →]│
│  Read-only view                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  🥦 PRODUCE                                              │
│  ☐  Broccoli          1 head                             │
│  ☑  Garlic            2 bulbs    ✓ checked               │
│                                                           │
│  🥩 MEAT                                                 │
│  ☐  Chicken breast    1kg                                │
│                                                           │
│  🧀 DAIRY                                                │
│  ☐  Whole milk        2L                                 │
│                                                           │
│  12 items total · 3 checked                              │
└───────────────────────────────────────────────────────────┘
```

### 3.3 — History / Analytics (`/shopping/history`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  📊 Shopping History & Analytics                                                 │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─ STATS ───────────────────────────────────────────────────────────────────┐  │
│  │  Total lists: 28  │  Avg items: 14  │  Avg spend: R$187  │  Top: Eggs     │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌─ PAST LISTS ──────────────────────────────────────────────────────────────┐  │
│  │  📅 May 15 · Weekly Groceries   15 items · R$203.40   [Re-use] [View]    │  │
│  │  📅 May 8  · Party Shopping     21 items · R$312.00   [Re-use] [View]    │  │
│  │  📅 May 1  · Weekly Groceries   12 items · R$178.50   [Re-use] [View]    │  │
│  │  [Load more...]                                                            │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Model (Prisma Schema)

```prisma
// ─── ShoppingList ─────────────────────────────────────────────────────────────

model ShoppingList {
  id          String            @id @default(cuid())
  userId      String
  name        String
  status      ShoppingListStatus @default(ACTIVE)
  shareToken  String?           @unique // null = not shared
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  completedAt DateTime?
  archivedAt  DateTime?

  user  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items ShoppingItem[]

  @@index([userId, status])
  @@index([shareToken])
}

enum ShoppingListStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

// ─── ShoppingItem ─────────────────────────────────────────────────────────────

model ShoppingItem {
  id             String         @id @default(cuid())
  listId         String
  name           String
  quantity       Float
  unit           String         @default("")
  categoryId     ItemCategory   @default(OTHER)
  isChecked      Boolean        @default(false)
  addedFrom      AddedFrom      @default(MANUAL)
  sourceRecipeId String?        // if addedFrom = RECIPE
  estimatedPrice Float?         // in BRL, derived from price scrapes
  actualPrice    Float?         // user-confirmed after shopping
  notes          String?        @db.Text
  position       Int            // for manual ordering within category
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  list ShoppingList @relation(fields: [listId], references: [id], onDelete: Cascade)

  @@index([listId, isChecked])
  @@index([listId, categoryId])
}

enum ItemCategory {
  PRODUCE
  MEAT
  SEAFOOD
  DAIRY
  BAKERY
  FROZEN
  PANTRY
  DRINKS
  CLEANING
  PERSONAL_CARE
  OTHER
}

enum AddedFrom {
  MANUAL
  RECIPE
  AI
  HISTORY // re-activated from past list
}

// ─── PriceComparison ──────────────────────────────────────────────────────────

model PriceComparison {
  id         String   @id @default(cuid())
  itemName   String   // normalized lowercase: "broccoli"
  storeName  String
  price      Float
  unit       String   // "head" | "kg" | "500g" | etc.
  currency   String   @default("BRL")
  url        String?  // product page URL for "Buy" link
  scrapedAt  DateTime @default(now())
  expiresAt  DateTime // scrapedAt + 2h

  @@index([itemName, scrapedAt])
  @@index([expiresAt])
}

// ─── PriceAlert ───────────────────────────────────────────────────────────────

model PriceAlert {
  id          String   @id @default(cuid())
  userId      String
  itemName    String
  targetPrice Float
  currency    String   @default("BRL")
  stores      String[] // ["Mercado Livre", "Americanas"] — empty = all
  isActive    Boolean  @default(true)
  triggeredAt DateTime? // set when alert fires
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@index([itemName, isActive])
}
```

### TypeScript Types for Derived/Computed Values

```typescript
// Types used across the Shopping module

interface ShoppingListSummary {
  id: string;
  name: string;
  status: ShoppingListStatus;
  itemCount: number;
  checkedCount: number;
  estimatedTotal: number;       // sum of item.estimatedPrice * item.quantity
  createdAt: Date;
  completedAt: Date | null;
}

interface ShoppingItemWithPrice extends ShoppingItem {
  latestPrices: PriceComparison[]; // top 5, most recent, for this item name
  priceAlert: PriceAlert | null;   // active alert if any
}

interface CategoryGroup {
  category: ItemCategory;
  label: string;
  emoji: string;
  items: ShoppingItem[];
}

const CATEGORY_META: Record<ItemCategory, { label: string; emoji: string; order: number }> = {
  PRODUCE:       { label: 'Produce',       emoji: '🥦', order: 1 },
  MEAT:          { label: 'Meat',          emoji: '🥩', order: 2 },
  SEAFOOD:       { label: 'Seafood',       emoji: '🐟', order: 3 },
  DAIRY:         { label: 'Dairy',         emoji: '🧀', order: 4 },
  BAKERY:        { label: 'Bakery',        emoji: '🍞', order: 5 },
  FROZEN:        { label: 'Frozen',        emoji: '🧊', order: 6 },
  PANTRY:        { label: 'Pantry',        emoji: '🫙',  order: 7 },
  DRINKS:        { label: 'Drinks',        emoji: '🥤', order: 8 },
  CLEANING:      { label: 'Cleaning',      emoji: '🧹', order: 9 },
  PERSONAL_CARE: { label: 'Personal Care', emoji: '🧴', order: 10 },
  OTHER:         { label: 'Other',         emoji: '📦', order: 11 },
};

interface PriceHistory {
  itemName: string;
  storeName: string;
  dataPoints: Array<{ date: Date; price: number }>;
  lowestEver: number;
  trend: 'up' | 'down' | 'stable';
}
```

---

## 5. Price Comparison Scraping

### 5.1 — Scraping Sources

| Store | Base URL | Search Endpoint | Notes |
|---|---|---|---|
| Mercado Livre | `mercadolivre.com.br` | `/items?q={query}` | JSON API available; prefer API over DOM |
| Americanas | `americanas.com.br` | `/busca/{query}` | Requires JS rendering (Playwright) |
| Extra Online | `extra.com.br` | `/busca?q={query}` | DOM scraping |
| Carrefour | `carrefour.com.br` | `/busca?q={query}` | DOM scraping |
| iFood Mercado | `ifood.com.br` | Search API | Requires geolocation header |

### 5.2 — Scraper Architecture

```typescript
// src/lib/scrapers/price-scraper/base-price-scraper.ts

import { chromium, Browser, Page } from 'playwright';
import { RateLimiter } from '../../rate-limiter';

export interface PriceResult {
  storeName: string;
  itemName: string;        // as found on the page
  price: number;           // in BRL
  unit: string;
  url: string;
  imageUrl?: string;
}

export abstract class BasePriceScraper {
  protected browser: Browser | null = null;
  protected readonly storeName: string;
  protected readonly baseUrl: string;
  private rateLimiter: RateLimiter;

  constructor(storeName: string, baseUrl: string) {
    this.storeName = storeName;
    this.baseUrl = baseUrl;
    // 1 request per 3 seconds for price scrapers (more sensitive)
    this.rateLimiter = new RateLimiter({ requestsPerSecond: 0.33 });
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled', // avoid bot detection
      ],
    });
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
  }

  protected async openPage(url: string): Promise<Page> {
    await this.rateLimiter.wait();

    const context = await this.browser!.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      locale: 'pt-BR',
      geolocation: { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
      permissions: ['geolocation'],
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    return page;
  }

  abstract search(itemName: string): Promise<PriceResult[]>;
}

// src/lib/scrapers/price-scraper/mercado-livre-scraper.ts

export class MercadoLivreScraper extends BasePriceScraper {
  constructor() {
    super('Mercado Livre', 'https://api.mercadolivre.com.br');
  }

  async search(itemName: string): Promise<PriceResult[]> {
    // Mercado Livre has a public search API — prefer it over DOM
    await this.rateLimiter.wait();

    const response = await fetch(
      `${this.baseUrl}/sites/MLB/search?q=${encodeURIComponent(itemName)}&limit=5`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) throw new Error(`ML API error: ${response.status}`);

    const data = await response.json() as MLSearchResponse;

    return data.results.slice(0, 5).map((item) => ({
      storeName: this.storeName,
      itemName: item.title,
      price: item.price,
      unit: this.inferUnit(item.title),
      url: item.permalink,
      imageUrl: item.thumbnail,
    }));
  }

  private inferUnit(title: string): string {
    // "Brócolis Orgânico 500g" → "500g"
    const match = title.match(/\d+\s*(kg|g|ml|l|un|pack|cx)/i);
    return match ? match[0].trim() : 'un';
  }
}

// src/lib/scrapers/price-scraper/americanas-scraper.ts

export class AmericanasScraper extends BasePriceScraper {
  constructor() {
    super('Americanas', 'https://www.americanas.com.br');
  }

  async search(itemName: string): Promise<PriceResult[]> {
    const page = await this.openPage(
      `${this.baseUrl}/busca/${encodeURIComponent(itemName)}`
    );

    // Wait for product cards to render
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10_000 });

    const results = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="product-card"]');
      return Array.from(cards).slice(0, 5).map((card) => ({
        itemName: card.querySelector('[data-testid="product-name"]')?.textContent?.trim() ?? '',
        price: parseFloat(
          (card.querySelector('[data-testid="price-value"]')?.textContent ?? '0')
            .replace('R$', '')
            .replace(',', '.')
            .trim()
        ),
        url: (card.querySelector('a') as HTMLAnchorElement)?.href ?? '',
      }));
    });

    await page.close();

    return results.map((r) => ({
      ...r,
      storeName: this.storeName,
      unit: this.inferUnit(r.itemName),
    }));
  }

  private inferUnit(title: string): string {
    const match = title.match(/\d+\s*(kg|g|ml|l|un)/i);
    return match ? match[0].trim() : 'un';
  }
}
```

### 5.3 — Price Cache Strategy

```typescript
// src/lib/scrapers/price-cache.ts

const PRICE_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function getCachedPricesOrScrape(
  itemName: string
): Promise<PriceComparison[]> {
  const normalizedName = itemName.toLowerCase().trim();

  // Check for fresh cached results
  const cached = await prisma.priceComparison.findMany({
    where: {
      itemName: normalizedName,
      expiresAt: { gt: new Date() },
    },
    orderBy: { price: 'asc' },
    take: 5,
  });

  if (cached.length > 0) return cached;

  // Scrape all stores in parallel
  const scrapers = [
    new MercadoLivreScraper(),
    new AmericanasScraper(),
    new ExtraOnlineScraper(),
    new CarrefourScraper(),
  ];

  await Promise.all(scrapers.map((s) => s.init()));

  const results = await Promise.allSettled(
    scrapers.map((s) => s.search(itemName))
  );

  await Promise.all(scrapers.map((s) => s.teardown()));

  const flatResults = results
    .filter((r): r is PromiseFulfilledResult<PriceResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  // Persist to DB
  const expiresAt = new Date(Date.now() + PRICE_CACHE_TTL_MS);
  const saved = await prisma.priceComparison.createManyAndReturn({
    data: flatResults.map((r) => ({
      itemName: normalizedName,
      storeName: r.storeName,
      price: r.price,
      unit: r.unit,
      currency: 'BRL',
      url: r.url,
      expiresAt,
    })),
  });

  return saved.sort((a, b) => a.price - b.price).slice(0, 5);
}
```

### 5.4 — Price History and Trend

```typescript
// src/lib/scrapers/price-history.ts

export async function getPriceHistory(
  itemName: string,
  storeName?: string,
  days = 30
): Promise<PriceHistory> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const records = await prisma.priceComparison.findMany({
    where: {
      itemName: itemName.toLowerCase(),
      ...(storeName ? { storeName } : {}),
      scrapedAt: { gte: since },
    },
    orderBy: { scrapedAt: 'asc' },
  });

  const dataPoints = records.map((r) => ({ date: r.scrapedAt, price: r.price }));
  const prices = dataPoints.map((p) => p.price);

  const trend: PriceHistory['trend'] =
    prices.length < 2
      ? 'stable'
      : prices[prices.length - 1]! > prices[0]! * 1.05
      ? 'up'
      : prices[prices.length - 1]! < prices[0]! * 0.95
      ? 'down'
      : 'stable';

  return {
    itemName,
    storeName: storeName ?? 'all',
    dataPoints,
    lowestEver: Math.min(...prices),
    trend,
  };
}
```

---

## 6. tRPC Procedures

```typescript
// src/server/routers/shopping.ts

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { nanoid } from 'nanoid';

export const shoppingRouter = createTRPCRouter({

  // ── Lists ──────────────────────────────────────────────────────────────────

  getLists: protectedProcedure
    .input(z.object({
      status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.shoppingList.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          _count: { select: { items: true } },
          items: {
            select: { isChecked: true, estimatedPrice: true, quantity: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  createList: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.shoppingList.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          status: 'ACTIVE',
        },
      });
    }),

  archiveList: protectedProcedure
    .input(z.object({ listId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.shoppingList.update({
        where: { id: input.listId, userId: ctx.session.user.id },
        data: { status: 'ARCHIVED', archivedAt: new Date() },
      });
    }),

  completeList: protectedProcedure
    .input(z.object({ listId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.shoppingList.update({
        where: { id: input.listId, userId: ctx.session.user.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }),

  reactivateList: protectedProcedure
    .input(z.object({ listId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const original = await ctx.prisma.shoppingList.findUniqueOrThrow({
        where: { id: input.listId, userId: ctx.session.user.id },
        include: { items: true },
      });

      // Create new list with same items, all unchecked
      return ctx.prisma.shoppingList.create({
        data: {
          userId: ctx.session.user.id,
          name: `${original.name} (copy)`,
          status: 'ACTIVE',
          items: {
            createMany: {
              data: original.items.map((item, i) => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                categoryId: item.categoryId,
                isChecked: false,
                addedFrom: 'HISTORY',
                estimatedPrice: item.estimatedPrice,
                position: i,
              })),
            },
          },
        },
      });
    }),

  // ── Items ──────────────────────────────────────────────────────────────────

  getListItems: protectedProcedure
    .input(z.object({ listId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      // Verify ownership
      await ctx.prisma.shoppingList.findUniqueOrThrow({
        where: { id: input.listId, userId: ctx.session.user.id },
      });

      const items = await ctx.prisma.shoppingItem.findMany({
        where: { listId: input.listId },
        orderBy: [{ categoryId: 'asc' }, { position: 'asc' }],
      });

      // Group by category
      return groupByCategory(items);
    }),

  addItem: protectedProcedure
    .input(z.object({
      listId: z.string().cuid(),
      name: z.string().min(1).max(200),
      quantity: z.number().positive().default(1),
      unit: z.string().max(20).default(''),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // AI auto-categorize
      const category = await aiCategorizeItem(input.name);

      // Check for duplicates
      const existing = await ctx.prisma.shoppingItem.findFirst({
        where: {
          listId: input.listId,
          name: { equals: input.name, mode: 'insensitive' },
          unit: input.unit,
          isChecked: false,
        },
      });

      if (existing) {
        // Merge quantities
        return ctx.prisma.shoppingItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + input.quantity },
        });
      }

      const maxPosition = await ctx.prisma.shoppingItem.aggregate({
        where: { listId: input.listId },
        _max: { position: true },
      });

      return ctx.prisma.shoppingItem.create({
        data: {
          listId: input.listId,
          name: input.name,
          quantity: input.quantity,
          unit: input.unit,
          categoryId: category,
          addedFrom: 'MANUAL',
          notes: input.notes,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });
    }),

  updateItem: protectedProcedure
    .input(z.object({
      itemId: z.string().cuid(),
      name: z.string().min(1).max(200).optional(),
      quantity: z.number().positive().optional(),
      unit: z.string().max(20).optional(),
      notes: z.string().max(500).optional(),
      actualPrice: z.number().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { itemId, ...data } = input;
      return ctx.prisma.shoppingItem.update({
        where: { id: itemId },
        data,
      });
    }),

  deleteItem: protectedProcedure
    .input(z.object({ itemId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.shoppingItem.delete({ where: { id: input.itemId } });
    }),

  checkItem: protectedProcedure
    .input(z.object({
      itemId: z.string().cuid(),
      isChecked: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.shoppingItem.update({
        where: { id: input.itemId },
        data: { isChecked: input.isChecked },
      });
    }),

  // ── Recipe Import ──────────────────────────────────────────────────────────

  addItemsFromRecipe: protectedProcedure
    .input(z.object({
      listId: z.string().cuid(),
      recipeId: z.string().cuid(),
      servings: z.number().positive().optional(), // scale quantities
    }))
    .mutation(async ({ input, ctx }) => {
      const recipe = await ctx.prisma.recipe.findUniqueOrThrow({
        where: { id: input.recipeId },
      });

      const ingredients = recipe.ingredients as RecipeIngredient[];
      const scale = input.servings ? input.servings / recipe.servings : 1;

      const existing = await ctx.prisma.shoppingItem.findMany({
        where: { listId: input.listId, isChecked: false },
      });

      const toCreate: Prisma.ShoppingItemCreateManyInput[] = [];
      const toUpdate: Array<{ id: string; quantity: number }> = [];

      for (const ing of ingredients) {
        const match = existing.find(
          (e) => e.name.toLowerCase() === ing.name.toLowerCase() && e.unit === ing.unit
        );

        if (match) {
          toUpdate.push({ id: match.id, quantity: match.quantity + ing.quantity * scale });
        } else {
          toCreate.push({
            listId: input.listId,
            name: ing.name,
            quantity: ing.quantity * scale,
            unit: ing.unit,
            categoryId: mapIngredientCategoryToItemCategory(ing.category),
            addedFrom: 'RECIPE',
            sourceRecipeId: input.recipeId,
            position: 999,
          });
        }
      }

      await ctx.prisma.$transaction([
        ctx.prisma.shoppingItem.createMany({ data: toCreate }),
        ...toUpdate.map(({ id, quantity }) =>
          ctx.prisma.shoppingItem.update({ where: { id }, data: { quantity } })
        ),
      ]);

      return { created: toCreate.length, updated: toUpdate.length };
    }),

  // ── AI Features ────────────────────────────────────────────────────────────

  getAISuggestions: protectedProcedure
    .input(z.object({
      listId: z.string().cuid(),
      limit: z.number().int().min(1).max(10).default(5),
    }))
    .query(async ({ input, ctx }) => {
      const [currentItems, recentLists] = await Promise.all([
        ctx.prisma.shoppingItem.findMany({
          where: { listId: input.listId },
          select: { name: true, categoryId: true, isChecked: true },
        }),
        ctx.prisma.shoppingList.findMany({
          where: { userId: ctx.session.user.id, status: { in: ['COMPLETED', 'ARCHIVED'] } },
          include: { items: { select: { name: true, quantity: true, unit: true } } },
          orderBy: { completedAt: 'desc' },
          take: 5,
        }),
      ]);

      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
          suggestions: z.array(z.object({
            name: z.string(),
            quantity: z.number(),
            unit: z.string(),
            reason: z.string(), // "You usually buy this with milk"
            category: z.nativeEnum(ItemCategory),
          })).max(input.limit),
          estimatedTotal: z.number(),
        }),
        prompt: `Shopping list assistant. Current items: ${JSON.stringify(currentItems)}.
          Past shopping history (last 5 lists): ${JSON.stringify(
            recentLists.flatMap((l) => l.items).slice(0, 50)
          )}.
          Suggest up to ${input.limit} items the user likely forgot.
          Also estimate total cost in BRL based on typical Brazilian supermarket prices.`,
      });

      return result.object;
    }),

  // ── Price Comparison ───────────────────────────────────────────────────────

  comparePrices: protectedProcedure
    .input(z.object({
      itemName: z.string().min(1).max(200),
      forceRefresh: z.boolean().default(false),
    }))
    .query(async ({ input, ctx }) => {
      if (input.forceRefresh) {
        // Delete cached entries for this item
        await ctx.prisma.priceComparison.deleteMany({
          where: { itemName: input.itemName.toLowerCase() },
        });
      }

      const prices = await getCachedPricesOrScrape(input.itemName);
      const history = await getPriceHistory(input.itemName);

      return { prices, history };
    }),

  // ── Price Alerts ───────────────────────────────────────────────────────────

  setPriceAlert: protectedProcedure
    .input(z.object({
      itemName: z.string().min(1).max(200),
      targetPrice: z.number().positive(),
      stores: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.priceAlert.upsert({
        where: {
          // Composite unique would need a migration; use findFirst + upsert pattern
          id: (await ctx.prisma.priceAlert.findFirst({
            where: { userId: ctx.session.user.id, itemName: input.itemName.toLowerCase(), isActive: true },
          }))?.id ?? '',
        },
        create: {
          userId: ctx.session.user.id,
          itemName: input.itemName.toLowerCase(),
          targetPrice: input.targetPrice,
          stores: input.stores ?? [],
        },
        update: {
          targetPrice: input.targetPrice,
          stores: input.stores ?? [],
          isActive: true,
          triggeredAt: null,
        },
      });
    }),

  removePriceAlert: protectedProcedure
    .input(z.object({ alertId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.priceAlert.update({
        where: { id: input.alertId, userId: ctx.session.user.id },
        data: { isActive: false },
      });
    }),

  // ── Sharing ────────────────────────────────────────────────────────────────

  generateShareLink: protectedProcedure
    .input(z.object({ listId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      const token = nanoid(24); // URL-safe, unguessable
      await ctx.prisma.shoppingList.update({
        where: { id: input.listId, userId: ctx.session.user.id },
        data: { shareToken: token },
      });
      return { token, url: `${process.env.NEXT_PUBLIC_APP_URL}/shopping/shared/${token}` };
    }),

  revokeShareLink: protectedProcedure
    .input(z.object({ listId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.shoppingList.update({
        where: { id: input.listId, userId: ctx.session.user.id },
        data: { shareToken: null },
      });
    }),

  getSharedList: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const list = await ctx.prisma.shoppingList.findUniqueOrThrow({
        where: { shareToken: input.token },
        include: {
          items: { orderBy: [{ categoryId: 'asc' }, { position: 'asc' }] },
        },
      });
      return list;
    }),
});
```

---

## 7. AI Features

### 7.1 — Auto-Categorization

```typescript
// src/lib/ai/categorize-item.ts

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Cache in-memory for common items to avoid repeated AI calls
const categoryCache = new Map<string, ItemCategory>();

export async function aiCategorizeItem(itemName: string): Promise<ItemCategory> {
  const normalized = itemName.toLowerCase().trim();

  if (categoryCache.has(normalized)) {
    return categoryCache.get(normalized)!;
  }

  // Rule-based fast path (no AI call needed for common items)
  const ruleBasedCategory = getRuleBasedCategory(normalized);
  if (ruleBasedCategory) {
    categoryCache.set(normalized, ruleBasedCategory);
    return ruleBasedCategory;
  }

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      category: z.nativeEnum(ItemCategory),
      confidence: z.number().min(0).max(1),
    }),
    prompt: `Categorize this shopping item: "${itemName}"
      Choose from: PRODUCE, MEAT, SEAFOOD, DAIRY, BAKERY, FROZEN, PANTRY, DRINKS, CLEANING, PERSONAL_CARE, OTHER`,
  });

  categoryCache.set(normalized, result.object.category);
  return result.object.category;
}

function getRuleBasedCategory(name: string): ItemCategory | null {
  const rules: [RegExp, ItemCategory][] = [
    [/\b(milk|cheese|yogurt|butter|cream|leite|queijo|iogurte|manteiga)\b/i, 'DAIRY'],
    [/\b(chicken|beef|pork|bacon|frango|carne|porco|salsicha|sausage)\b/i, 'MEAT'],
    [/\b(apple|banana|tomato|lettuce|carrot|onion|garlic|maca|tomate|cenoura)\b/i, 'PRODUCE'],
    [/\b(beer|wine|juice|soda|cerveja|vinho|suco|refrigerante|agua|water)\b/i, 'DRINKS'],
    [/\b(detergent|soap|bleach|detergente|sabao|sabonete|desinfetante)\b/i, 'CLEANING'],
    [/\b(bread|cake|biscuit|pao|bolo|biscoito)\b/i, 'BAKERY'],
    [/\b(frozen|congelado|ice cream|sorvete)\b/i, 'FROZEN'],
    [/\b(shampoo|toothpaste|pasta de dente|conditioner)\b/i, 'PERSONAL_CARE'],
  ];

  for (const [regex, category] of rules) {
    if (regex.test(name)) return category;
  }
  return null;
}
```

### 7.2 — Quantity Suggestion from History

```typescript
// When a user types an item name, AI looks at their purchase history
// to pre-fill the quantity field

export async function suggestQuantityFromHistory(
  userId: string,
  itemName: string
): Promise<{ quantity: number; unit: string } | null> {
  const history = await prisma.shoppingItem.findMany({
    where: {
      list: { userId },
      name: { contains: itemName, mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { quantity: true, unit: true },
  });

  if (history.length === 0) return null;

  // Simple mode (most common quantity+unit pair)
  const frequencyMap = new Map<string, number>();
  for (const h of history) {
    const key = `${h.quantity}_${h.unit}`;
    frequencyMap.set(key, (frequencyMap.get(key) ?? 0) + 1);
  }

  const [mostCommon] = [...frequencyMap.entries()].sort((a, b) => b[1] - a[1]);
  if (!mostCommon) return null;

  const [qty, unit] = mostCommon[0].split('_');
  return { quantity: parseFloat(qty!), unit: unit! };
}
```

### 7.3 — Total Cost Estimation

```typescript
// Uses combination of scraped prices + AI estimation for items with no price data

export async function estimateListTotal(
  items: ShoppingItem[]
): Promise<{ total: number; breakdown: Array<{ name: string; estimated: number }> }> {
  const breakdown: Array<{ name: string; estimated: number }> = [];

  for (const item of items) {
    if (item.estimatedPrice) {
      breakdown.push({ name: item.name, estimated: item.estimatedPrice * item.quantity });
      continue;
    }

    // Check price DB
    const latestPrice = await prisma.priceComparison.findFirst({
      where: { itemName: item.name.toLowerCase() },
      orderBy: { scrapedAt: 'desc' },
    });

    if (latestPrice) {
      breakdown.push({ name: item.name, estimated: latestPrice.price * item.quantity });
    } else {
      // AI fallback estimate
      // (batched in practice — not called per-item in production)
      breakdown.push({ name: item.name, estimated: 0 }); // flagged for AI batch
    }
  }

  return {
    total: breakdown.reduce((sum, b) => sum + b.estimated, 0),
    breakdown,
  };
}
```

---

## 8. List Categories

Items are automatically grouped and displayed in a fixed aisle-style order:

```typescript
// src/lib/shopping/group-by-category.ts

export function groupByCategory(items: ShoppingItem[]): CategoryGroup[] {
  const grouped = new Map<ItemCategory, ShoppingItem[]>();

  for (const item of items) {
    const cat = item.categoryId;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => CATEGORY_META[a].order - CATEGORY_META[b].order)
    .map(([category, items]) => ({
      category,
      label: CATEGORY_META[category].label,
      emoji: CATEGORY_META[category].emoji,
      items: items.sort((a, b) => a.position - b.position),
    }));
}
```

---

## 9. Sharing

### Architecture

```
Owner creates list
      │
      ▼
generateShareLink → nanoid(24) token → stored in ShoppingList.shareToken
      │
      ▼
Returns URL: /shopping/shared/{token}
      │
Anyone with link
      │
      ▼
GET /shopping/shared/{token}
      │
      ▼
getSharedList (publicProcedure — no auth)
      │
      ▼
Read-only view: categories + items + check state
(checked items persist to the owner's list via:
  checkSharedItem publicProcedure — token-authenticated, no user session needed)
```

### Revocation

```typescript
// Token revocation immediately invalidates any shared link
// Next request to /shopping/shared/{token} returns 404

// In the shared page component:
if (!list) return <NotFoundPage message="This list has been revoked or doesn't exist." />;
```

---

## 10. History & Analytics

### Analytics Queries

```typescript
// src/server/routers/shopping-analytics.ts

export const shoppingAnalyticsRouter = createTRPCRouter({
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const [lists, items] = await Promise.all([
      ctx.prisma.shoppingList.findMany({
        where: { userId: ctx.session.user.id, status: { in: ['COMPLETED', 'ARCHIVED'] } },
        include: { items: { select: { name: true, actualPrice: true, quantity: true } } },
      }),
      ctx.prisma.shoppingItem.findMany({
        where: { list: { userId: ctx.session.user.id } },
        select: { name: true, quantity: true, unit: true, actualPrice: true },
      }),
    ]);

    const avgSpend = lists.reduce((sum, l) => {
      const total = l.items.reduce((s, i) => s + (i.actualPrice ?? 0) * i.quantity, 0);
      return sum + total;
    }, 0) / (lists.length || 1);

    // Most frequently bought items
    const itemFrequency = new Map<string, number>();
    for (const item of items) {
      const key = item.name.toLowerCase();
      itemFrequency.set(key, (itemFrequency.get(key) ?? 0) + 1);
    }
    const topItems = [...itemFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return { avgSpend, totalLists: lists.length, topItems };
  }),
});
```

---

## 11. Animations

### 11.1 — Item Check Animation (Strikethrough + Fade)

```typescript
// src/components/shopping/ShoppingItem.tsx

'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ShoppingItemProps {
  item: ShoppingItem;
  onCheck: (id: string, checked: boolean) => void;
}

export function ShoppingItemRow({ item, onCheck }: ShoppingItemProps) {
  return (
    <motion.div
      layout                              // smooth reorder when checked items move
      className="flex items-center gap-3 py-2"
      animate={{ opacity: item.isChecked ? 0.5 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={() => onCheck(item.id, !item.isChecked)}
        className="flex h-5 w-5 items-center justify-center rounded border-2 border-border
          transition-colors hover:border-primary"
        aria-label={item.isChecked ? 'Uncheck item' : 'Check item'}
      >
        <AnimatePresence>
          {item.isChecked && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 30 }}
              className="h-3 w-3 rounded-sm bg-primary"
            />
          )}
        </AnimatePresence>
      </button>

      <span className="relative flex-1 text-sm">
        {/* Strikethrough line animates in */}
        <AnimatePresence>
          {item.isChecked && (
            <motion.span
              className="absolute inset-y-1/2 left-0 h-px bg-muted-foreground"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              exit={{ width: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
        <span className={item.isChecked ? 'text-muted-foreground' : 'text-foreground'}>
          {item.name}
        </span>
      </span>

      <span className="text-xs text-muted-foreground">
        {item.quantity} {item.unit}
      </span>
    </motion.div>
  );
}
```

### 11.2 — Price Compare Panel Slide-In

```typescript
// src/components/shopping/PriceComparePanel.tsx

import { motion, AnimatePresence } from 'framer-motion';

export function PriceComparePanel({ isOpen, itemName, onClose }: PriceComparePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          className="fixed right-0 top-0 h-full w-80 border-l border-border bg-background shadow-xl z-50"
        >
          {/* Panel content */}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
```

### 11.3 — List Item Add Animation

```typescript
// New items animate in from the top with a slide-down effect
// Existing items below shift down smoothly (Framer Motion layout animations)

const itemVariants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, x: -20, height: 0 },
};
```

---

## 12. Testing

### 12.1 — Price Scraper Mock Tests (Vitest)

```typescript
// src/lib/scrapers/price-scraper/__tests__/mercado-livre-scraper.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MercadoLivreScraper } from '../mercado-livre-scraper';

global.fetch = vi.fn();

const mockMLResponse = {
  results: [
    { title: 'Brócolis Orgânico 500g', price: 4.99, permalink: 'https://ml.com/p/1', thumbnail: '' },
    { title: 'Brócolis Fresh 1kg', price: 8.50, permalink: 'https://ml.com/p/2', thumbnail: '' },
  ],
};

describe('MercadoLivreScraper', () => {
  let scraper: MercadoLivreScraper;

  beforeEach(() => {
    scraper = new MercadoLivreScraper();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockMLResponse,
    } as Response);
  });

  it('returns normalized price results', async () => {
    const results = await scraper.search('broccoli');
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      storeName: 'Mercado Livre',
      price: 4.99,
    });
  });

  it('infers unit from product title', async () => {
    const results = await scraper.search('broccoli');
    expect(results[0]!.unit).toBe('500g');
    expect(results[1]!.unit).toBe('1kg');
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 429 } as Response);
    await expect(scraper.search('broccoli')).rejects.toThrow('ML API error: 429');
  });
});
```

### 12.2 — List CRUD Tests (tRPC Caller)

```typescript
// src/server/routers/__tests__/shopping.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { createCaller } from '../shopping';
import { createMockContext } from '@/test/mock-context';

describe('Shopping Router', () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    caller = createCaller(createMockContext());
  });

  it('creates a new shopping list', async () => {
    const list = await caller.createList({ name: 'Test List' });
    expect(list.name).toBe('Test List');
    expect(list.status).toBe('ACTIVE');
  });

  it('merges duplicate items on addItem', async () => {
    const list = await caller.createList({ name: 'Merge Test' });
    await caller.addItem({ listId: list.id, name: 'Garlic', quantity: 2, unit: 'cloves' });
    await caller.addItem({ listId: list.id, name: 'garlic', quantity: 3, unit: 'cloves' }); // case-insensitive

    const groups = await caller.getListItems({ listId: list.id });
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems).toHaveLength(1);
    expect(allItems[0]!.quantity).toBe(5);
  });

  it('archives a list and excludes it from active getLists', async () => {
    const list = await caller.createList({ name: 'To Archive' });
    await caller.archiveList({ listId: list.id });
    const activeLists = await caller.getLists({ status: 'ACTIVE' });
    expect(activeLists.find((l) => l.id === list.id)).toBeUndefined();
  });

  it('reactivates a past list with unchecked items', async () => {
    const original = await caller.createList({ name: 'Original' });
    await caller.addItem({ listId: original.id, name: 'Milk', quantity: 2, unit: 'L' });
    await caller.checkItem({ itemId: 'item-id', isChecked: true });
    await caller.completeList({ listId: original.id });

    const newList = await caller.reactivateList({ listId: original.id });
    const groups = await caller.getListItems({ listId: newList.id });
    const items = groups.flatMap((g) => g.items);
    expect(items.every((i) => !i.isChecked)).toBe(true);
  });
});
```

### 12.3 — AI Suggestion Mock Tests

```typescript
// src/server/routers/__tests__/shopping-ai.test.ts

import { describe, it, expect, vi } from 'vitest';

vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      suggestions: [
        { name: 'Eggs', quantity: 12, unit: 'units', reason: 'You usually buy eggs with milk', category: 'DAIRY' },
        { name: 'Butter', quantity: 200, unit: 'g', reason: 'Common pantry staple', category: 'DAIRY' },
      ],
      estimatedTotal: 87.50,
    },
  }),
}));

describe('getAISuggestions', () => {
  it('returns suggestions with reasons', async () => {
    const caller = createCaller(createMockContext());
    const result = await caller.getAISuggestions({ listId: 'list-id' });

    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions[0]!.name).toBe('Eggs');
    expect(result.suggestions[0]!.reason).toContain('milk');
    expect(result.estimatedTotal).toBe(87.50);
  });
});
```

### 12.4 — E2E Tests (Playwright)

```typescript
// e2e/shopping/list-management.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Shopping List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shopping');
  });

  test('add item and see it auto-categorized', async ({ page }) => {
    await page.click('[data-testid="create-list-btn"]');
    await page.fill('[data-testid="list-name-input"]', 'My Test List');
    await page.keyboard.press('Enter');

    await page.fill('[data-testid="add-item-input"]', 'Whole Milk 2L');
    await page.keyboard.press('Enter');

    await expect(
      page.locator('[data-testid="category-DAIRY"]')
    ).toContainText('Whole Milk 2L');
  });

  test('check item with strikethrough animation', async ({ page }) => {
    // pre-create list with item
    const item = page.locator('[data-testid="shopping-item"]').first();
    await item.locator('[data-testid="check-btn"]').click();

    await expect(item).toHaveCSS('opacity', '0.5');
    await expect(item.locator('[data-testid="strikethrough"]')).toBeVisible();
  });

  test('price compare panel slides in', async ({ page }) => {
    await page.click('[data-testid="price-compare-btn"]');
    const panel = page.locator('[data-testid="price-compare-panel"]');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Mercado Livre');
  });
});
```

---

## Appendix: File Structure

```
src/
├── app/(dashboard)/shopping/
│   ├── page.tsx                           # Main shopping page (RSC)
│   ├── history/
│   │   └── page.tsx                       # History + analytics (RSC)
│   ├── shared/
│   │   └── [token]/
│   │       └── page.tsx                   # Public shared list view
│   └── _components/
│       ├── ListsSidebar.tsx
│       ├── ActiveList.tsx
│       ├── ShoppingItemRow.tsx
│       ├── AddItemInput.tsx
│       ├── CategoryGroup.tsx
│       ├── PriceComparePanel.tsx
│       ├── PriceHistoryChart.tsx
│       ├── PriceAlertModal.tsx
│       ├── AISuggestionsPanel.tsx
│       ├── ShareModal.tsx
│       └── AnalyticsPanel.tsx
├── server/routers/
│   ├── shopping.ts
│   └── shopping-analytics.ts
├── lib/
│   ├── scrapers/price-scraper/
│   │   ├── base-price-scraper.ts
│   │   ├── mercado-livre-scraper.ts
│   │   ├── americanas-scraper.ts
│   │   ├── extra-online-scraper.ts
│   │   └── carrefour-scraper.ts
│   ├── price-cache.ts
│   ├── price-history.ts
│   └── ai/
│       └── categorize-item.ts
└── stores/
    └── shopping-store.ts                  # Zustand: optimistic updates
```
