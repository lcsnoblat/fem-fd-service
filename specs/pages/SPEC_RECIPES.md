# SPEC_RECIPES.md — Recipes Module
**Platform:** Mission Control Personal Productivity Platform
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, Playwright, Vercel AI SDK

---

## 1. Overview

The Recipes module is a full-stack AI-curated food discovery and meal planning system. It aggregates recipes from external sources via Playwright-powered web scraping, augments them with AI-generated metadata and nutritional analysis, and ties into a weekly meal planner and shopping list generator. The module is designed for users who want a single surface to discover recipes, plan their week, and automatically populate a shopping list — all without leaving Mission Control.

### Core Capabilities

| Capability | Description |
|---|---|
| Recipe Search | Full-text + filter search across scraped + AI-generated recipes |
| Discovery Feed | AI-curated "For You" recipe suggestions based on saved history |
| Meal Planner | 7-day drag-and-drop calendar with per-meal-type slots |
| Shopping List | Auto-generate a deduped, categorized list from any meal plan |
| AI Recipe Gen | Fallback AI recipe generation when scraping yields no results |
| Ingredient-Based Search | Input available ingredients, AI suggests matching recipes |
| Dietary Adaptation | AI rewrites recipes to match dietary restrictions |
| Nutritional Analysis | AI-powered macro/micro nutrient estimation per recipe |

---

## 2. User Stories

### US-01 — Recipe Discovery
**As a** home cook,
**I want to** search and browse recipes filtered by cuisine, dietary restrictions, and prep time,
**so that** I can find meals that fit my schedule and preferences without scrolling through irrelevant results.

**Acceptance Criteria:**
- Search results appear within 500ms (cached) or 2s (live scrape)
- Filter chips are combinable (e.g., Italian + Vegetarian + Under 30min)
- Each card shows image, title, total time, difficulty, and dietary badges

---

### US-02 — Ingredient-Based Suggestion
**As a** user with limited groceries,
**I want to** type the ingredients I have on hand and receive recipe suggestions,
**so that** I can avoid food waste and still cook a proper meal.

**Acceptance Criteria:**
- AI returns at least 5 recipe suggestions when 3+ ingredients are provided
- Results ranked by ingredient match percentage (highest first)
- User can click "I'm missing X" to add the missing item to a shopping list

---

### US-03 — Meal Planning
**As a** meal prepper,
**I want to** drag recipes onto a weekly calendar grid by meal type (breakfast/lunch/dinner/snack),
**so that** I can visualize and organize my week's eating in one view.

**Acceptance Criteria:**
- 7-day calendar is always visible in the sidebar
- Drag-and-drop works on desktop; tap-to-assign works on mobile
- Each slot shows recipe name + thumbnail
- Slots can be emptied with a single click

---

### US-04 — Shopping List Generation
**As a** user who has planned their meals,
**I want to** generate a consolidated, deduplicated shopping list from my meal plan,
**so that** I don't have to manually tally ingredients across multiple recipes.

**Acceptance Criteria:**
- Shopping list merges identical ingredients across recipes (e.g., 2x "garlic clove" + 3x "garlic clove" = 5 cloves)
- Items are grouped by category (Produce, Dairy, etc.)
- List is sent directly to the Shopping module
- User can toggle which meals to include before generating

---

### US-05 — Recipe Saving
**As a** user who finds a recipe they like,
**I want to** save it to my personal collection with optional notes,
**so that** I can return to it later without re-searching.

**Acceptance Criteria:**
- Save button is visible on the card and detail page
- Notes field on the saved recipe (e.g., "reduce salt", "kids loved this")
- Saved recipes appear in a dedicated sidebar panel with instant search

---

### US-06 — AI Recipe Generation (Fallback)
**As a** user searching for something obscure,
**I want to** receive an AI-generated recipe when no scraped result matches my query,
**so that** I always get a useful response even for niche requests.

**Acceptance Criteria:**
- AI generation is triggered automatically after 0 results from scraping
- Generated recipe is clearly labeled "AI Generated"
- User can regenerate with a different style (e.g., "more rustic", "restaurant-style")
- Generation streams token-by-token in the detail view

---

### US-07 — Dietary Adaptation
**As a** user with dietary restrictions,
**I want to** adapt any recipe to my dietary needs (vegan, gluten-free, low-sodium, etc.),
**so that** I can enjoy the same meal as the original without compromising my health goals.

**Acceptance Criteria:**
- "Adapt Recipe" button visible on all recipe detail pages
- User selects restriction(s) from a preset list or types custom restrictions
- AI rewrites ingredient list and instructions in-place (streaming)
- Adapted version can be saved separately from the original

---

### US-08 — Nutritional Analysis
**As a** health-conscious user,
**I want to** see estimated macronutrient and calorie information for any recipe,
**so that** I can make informed decisions about my daily intake.

**Acceptance Criteria:**
- AI estimates calories, protein, carbs, fat, and fiber per serving
- Analysis is shown in a collapsible panel on the detail page
- Disclaimer notes that values are estimates, not medical advice
- Per-serving vs. total toggle is available

---

## 3. UI Layout

### 3.1 — Main Recipes Page (`/recipes`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  MISSION CONTROL                              [Search bar 🔍            ] [Avatar]│
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─ SEARCH & FILTERS ────────────────────────────────────────────────────────┐   │
│  │  🍳 Search recipes, ingredients, or ask AI...              [Search]       │   │
│  │                                                                           │   │
│  │  CUISINE:  [Italian] [Asian] [Mexican] [Mediterranean] [+ More]          │   │
│  │  DIETARY:  [Vegan] [Vegetarian] [Gluten-Free] [Dairy-Free] [Keto]        │   │
│  │  TIME:     [< 15min] [< 30min] [< 1hr] [Any]                             │   │
│  │  SORT:     [Relevance ▾] [Newest] [Quickest] [Most Saved]                │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─ RECIPE GRID (main, ~70% width) ──────────┐  ┌─ SIDEBAR (~30% width) ──────┐ │
│  │                                           │  │                             │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │  │  📅 MEAL PLANNER            │ │
│  │  │  [img]  │ │  [img]  │ │  [img]  │     │  │  ┌───┬───┬───┬───┬───┬───┬─┐│ │
│  │  │Spaghetti│ │Thai Grn │ │Avocado  │     │  │  │Mo │Tu │We │Th │Fr │Sa │S││ │
│  │  │Carbonara│ │  Curry  │ │  Toast  │     │  │  ├───┼───┼───┼───┼───┼───┼─┤│ │
│  │  │ 🕒 25m  │ │ 🕒 40m  │ │ 🕒 10m  │     │  │  │ B │   │   │🍳 │   │   │ ││ │
│  │  │ ⭐ Easy │ │ ⭐ Med  │ │ ⭐ Easy │     │  │  ├───┼───┼───┼───┼───┼───┼─┤│ │
│  │  │🥩 [♡]  │ │🌱 [♡]  │ │🌱 [♡]  │     │  │  │ L │🍜 │   │   │🥗 │   │ ││ │
│  │  └─────────┘ └─────────┘ └─────────┘     │  │  ├───┼───┼───┼───┼───┼───┼─┤│ │
│  │                                           │  │  │ D │   │🍛 │   │   │🍕 │ ││ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐     │  │  └───┴───┴───┴───┴───┴───┴─┘│ │
│  │  │  [img]  │ │  [img]  │ │  [img]  │     │  │  [Generate Shopping List]    │ │
│  │  │  Tacos  │ │  Ramen  │ │Oat Bowl │     │  │                             │ │
│  │  │ 🕒 20m  │ │ 🕒 90m  │ │ 🕒 5m   │     │  │  ─────────────────────────  │ │
│  │  │ ⭐ Easy │ │ ⭐ Hard │ │ ⭐ Easy │     │  │                             │ │
│  │  │🌮 [♡]  │ │🍜 [♡]  │ │🌱 [♡]  │     │  │  📌 SAVED RECIPES (12)      │ │
│  │  └─────────┘ └─────────┘ └─────────┘     │  │  ┌──────────────────────┐  │ │
│  │                                           │  │  │ 🔍 Search saved...   │  │ │
│  │  [Load more...]                           │  │  └──────────────────────┘  │ │
│  │                                           │  │  • Pasta Primavera         │ │
│  │  ┌─ AI SUGGEST ──────────────────────┐    │  │  • Chicken Stir-fry        │ │
│  │  │  🤖 What can you make with...     │    │  │  • Greek Salad             │ │
│  │  │  [eggs, pasta, tomatoes      ] →  │    │  │  • Banana Bread            │ │
│  │  └───────────────────────────────────┘    │  │  [View all saved →]        │ │
│  └───────────────────────────────────────────┘  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 — Recipe Detail Page (`/recipes/[id]`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ← Back to Recipes                                         [♡ Save] [+ Meal Plan]│
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    [HERO IMAGE — full width, 400px tall]                    │ │
│  │                                                                             │ │
│  │  Spaghetti Carbonara                              🕒 25 min | 👥 4 servings │ │
│  │  ⭐ Easy  •  🇮🇹 Italian  •  🥩 Contains Meat  •  🌾 Contains Gluten        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌─ INGREDIENTS (left, ~35%) ─────────┐  ┌─ INSTRUCTIONS (right, ~65%) ───────┐ │
│  │  Servings: [- 2 +] [4] [+ 8]      │  │                                    │ │
│  │                                    │  │  Step 1 of 6                       │ │
│  │  ☐ 400g spaghetti                  │  │  ┌──────────────────────────────┐  │ │
│  │  ☐ 200g pancetta / guanciale       │  │  │ Bring a large pot of salted  │  │ │
│  │  ☐ 4 large eggs                    │  │  │ water to a boil. Cook the    │  │ │
│  │  ☐ 100g Pecorino Romano            │  │  │ spaghetti until al dente...  │  │ │
│  │  ☐ 100g Parmesan                   │  │  └──────────────────────────────┘  │ │
│  │  ☐ 4 cloves garlic                 │  │                                    │ │
│  │  ☐ Black pepper (to taste)         │  │  Step 2 of 6                       │ │
│  │  ☐ Salt                            │  │  ┌──────────────────────────────┐  │ │
│  │                                    │  │  │ While pasta cooks, fry the   │  │ │
│  │  [+ Add missing to Shopping List]  │  │  │ pancetta in a pan until      │  │ │
│  │                                    │  │  │ crispy...                    │  │ │
│  │  ─────────────────────────────     │  │  └──────────────────────────────┘  │ │
│  │                                    │  │                                    │ │
│  │  🤖 AI NUTRITION (per serving)     │  │  [... Steps 3-6 collapsed ...]     │ │
│  │  ┌──────────────────────────────┐  │  │                                    │ │
│  │  │ Calories:  ~680 kcal         │  │  └────────────────────────────────────┘ │
│  │  │ Protein:   ~32g              │  │                                         │
│  │  │ Carbs:     ~75g              │  │  ┌─ AI ACTIONS ─────────────────────┐   │
│  │  │ Fat:       ~28g              │  │  │  [🥗 Adapt for dietary needs]    │   │
│  │  │ Fiber:     ~3g               │  │  │  [🔄 Regenerate recipe]          │   │
│  │  │ [per serving | total]        │  │  │  [💬 Ask AI about this recipe]   │   │
│  │  └──────────────────────────────┘  │  └──────────────────────────────────┘   │
│  └─────────────────────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Model (Prisma Schema)

```prisma
// ─── Recipe ──────────────────────────────────────────────────────────────────

model Recipe {
  id           String   @id @default(cuid())
  userId       String?  // null for publicly scraped/global recipes
  title        String
  description  String   @db.Text
  ingredients  Json[]   // RecipeIngredient[]
  instructions Json[]   // RecipeStep[]
  prepTime     Int      // minutes
  cookTime     Int      // minutes
  servings     Int
  cuisine      String
  dietary      String[] // ["vegan", "gluten-free", etc.]
  imageUrl     String?
  sourceUrl    String?  // original URL if scraped
  isSaved      Boolean  @default(false)
  aiGenerated  Boolean  @default(false)
  tags         String[]
  difficulty   String   @default("medium") // "easy" | "medium" | "hard"
  scrapedAt    DateTime?
  cacheExpiry  DateTime? // scraped recipes cached 24h
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  savedByUsers SavedRecipe[]
  mealPlanSlots MealPlan[]

  user         User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([cuisine])
  @@index([aiGenerated])
  @@index([scrapedAt])
}

// ─── MealPlan ────────────────────────────────────────────────────────────────

model MealPlan {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date
  recipeId  String
  mealType  MealType
  notes     String?
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, date, mealType]) // one recipe per slot per day
  @@index([userId, date])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

// ─── SavedRecipe ─────────────────────────────────────────────────────────────

model SavedRecipe {
  userId   String
  recipeId String
  savedAt  DateTime @default(now())
  notes    String?  @db.Text

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@id([userId, recipeId])
  @@index([userId, savedAt])
}

// ─── RecipeSearchCache ───────────────────────────────────────────────────────

model RecipeSearchCache {
  id          String   @id @default(cuid())
  queryHash   String   @unique // MD5 of normalized query+filters
  results     Json     // Recipe[] serialized
  createdAt   DateTime @default(now())
  expiresAt   DateTime

  @@index([expiresAt])
}
```

### TypeScript Types for JSON Fields

```typescript
// Stored in Recipe.ingredients (Json[])
interface RecipeIngredient {
  id: string;                    // nanoid
  name: string;                  // "garlic"
  quantity: number;              // 4
  unit: string;                  // "cloves" | "grams" | "ml" | ""
  preparation?: string;          // "minced" | "diced"
  optional?: boolean;
  substitutes?: string[];        // ["shallots", "onion powder"]
  category: IngredientCategory;  // for shopping list grouping
}

type IngredientCategory =
  | 'produce'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'bakery'
  | 'frozen'
  | 'pantry'
  | 'spices'
  | 'drinks'
  | 'other';

// Stored in Recipe.instructions (Json[])
interface RecipeStep {
  step: number;
  title?: string;               // "Boil the pasta"
  description: string;          // full instruction text
  durationMinutes?: number;     // 10
  tip?: string;                 // "Don't overcook — al dente is key"
  imageUrl?: string;            // optional step-level image
}
```

---

## 5. Web Scraping Strategy

### 5.1 — Scraping Sources

| Source | Base URL | Notes |
|---|---|---|
| AllRecipes | `allrecipes.com` | Structured JSON-LD, excellent robot compliance |
| Tasty | `tasty.co` | Video-first, but has full recipe JSON |
| BBC Good Food | `bbcgoodfood.com` | Well-structured, UK-centric but global relevance |

All scrapers must:
- Check `robots.txt` on startup and cache it for 1h
- Respect `Crawl-delay` directives
- Identify themselves with a descriptive User-Agent
- Rate-limit to **1 request per 2 seconds per domain**
- Never scrape behind authentication

### 5.2 — Playwright Scraper Architecture

```typescript
// src/lib/scrapers/base-scraper.ts

import { chromium, Browser, Page } from 'playwright';
import { RateLimiter } from '../rate-limiter';
import { RobotsChecker } from '../robots-checker';

export abstract class BaseRecipeScraper {
  protected browser: Browser | null = null;
  protected readonly domain: string;
  private rateLimiter: RateLimiter;
  private robotsChecker: RobotsChecker;

  constructor(domain: string) {
    this.domain = domain;
    this.rateLimiter = new RateLimiter({ requestsPerSecond: 0.5 }); // 1 req/2s
    this.robotsChecker = new RobotsChecker(domain);
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  }

  async teardown(): Promise<void> {
    await this.browser?.close();
  }

  protected async openPage(url: string): Promise<Page> {
    const isAllowed = await this.robotsChecker.isAllowed(url);
    if (!isAllowed) throw new Error(`Scraping blocked by robots.txt: ${url}`);

    await this.rateLimiter.wait();

    const page = await this.browser!.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': 'MissionControlBot/1.0 (personal productivity; not for redistribution)',
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    return page;
  }

  abstract search(query: string, filters: RecipeSearchFilters): Promise<ScrapedRecipePreview[]>;
  abstract getRecipeDetail(url: string): Promise<ScrapedRecipe>;
}

// src/lib/scrapers/allrecipes-scraper.ts

export class AllRecipesScraper extends BaseRecipeScraper {
  constructor() {
    super('allrecipes.com');
  }

  async search(query: string, filters: RecipeSearchFilters): Promise<ScrapedRecipePreview[]> {
    const page = await this.openPage(
      `https://www.allrecipes.com/search?q=${encodeURIComponent(query)}`
    );

    const previews = await page.evaluate(() => {
      // Extract JSON-LD structured data from search results
      const cards = document.querySelectorAll('[data-type="recipe"]');
      return Array.from(cards).map((card) => ({
        title: card.querySelector('.card__title')?.textContent?.trim() ?? '',
        url: (card as HTMLAnchorElement).href,
        imageUrl: card.querySelector('img')?.src ?? null,
        totalTime: card.querySelector('.recipe-meta-item--time')?.textContent?.trim() ?? null,
      }));
    });

    await page.close();
    return previews.slice(0, 20);
  }

  async getRecipeDetail(url: string): Promise<ScrapedRecipe> {
    const page = await this.openPage(url);

    const recipe = await page.evaluate(() => {
      // Prefer JSON-LD structured data for accuracy
      const jsonLdTag = document.querySelector('script[type="application/ld+json"]');
      if (jsonLdTag) {
        const data = JSON.parse(jsonLdTag.textContent ?? '{}');
        const recipeData = Array.isArray(data)
          ? data.find((d: Record<string, unknown>) => d['@type'] === 'Recipe')
          : data;
        if (recipeData) return recipeData;
      }

      // Fallback: DOM scraping
      return {
        name: document.querySelector('h1')?.textContent?.trim(),
        description: document.querySelector('.article-subheading')?.textContent?.trim(),
        // ... further selectors
      };
    });

    await page.close();
    return this.normalize(recipe, url);
  }

  private normalize(raw: Record<string, unknown>, sourceUrl: string): ScrapedRecipe {
    // Map schema.org Recipe to our internal format
    return {
      title: String(raw.name ?? ''),
      description: String(raw.description ?? ''),
      ingredients: this.parseIngredients(raw.recipeIngredient as string[]),
      instructions: this.parseInstructions(raw.recipeInstructions),
      prepTime: this.parseISO8601Duration(raw.prepTime as string),
      cookTime: this.parseISO8601Duration(raw.cookTime as string),
      servings: parseInt(String(raw.recipeYield ?? '4'), 10),
      imageUrl: (raw.image as { url?: string })?.url ?? null,
      sourceUrl,
      tags: (raw.keywords as string ?? '').split(',').map((t) => t.trim()),
      cuisine: (raw.recipeCuisine as string) ?? 'unknown',
      dietary: this.parseDietary(raw),
    };
  }

  private parseISO8601Duration(iso?: string): number {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    return (parseInt(match[1] ?? '0', 10) * 60) + parseInt(match[2] ?? '0', 10);
  }
}
```

### 5.3 — Caching Strategy

```typescript
// src/lib/scrapers/recipe-cache.ts

const CACHE_TTL_HOURS = 24;

export async function getCachedOrScrape(
  queryHash: string,
  scraperFn: () => Promise<ScrapedRecipe[]>
): Promise<ScrapedRecipe[]> {
  const cached = await prisma.recipeSearchCache.findUnique({
    where: { queryHash },
  });

  if (cached && cached.expiresAt > new Date()) {
    return cached.results as ScrapedRecipe[];
  }

  const results = await scraperFn();

  await prisma.recipeSearchCache.upsert({
    where: { queryHash },
    create: {
      queryHash,
      results: results as unknown as Prisma.JsonArray,
      expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
    },
    update: {
      results: results as unknown as Prisma.JsonArray,
      expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
    },
  });

  return results;
}
```

### 5.4 — Rate Limiter

```typescript
// src/lib/rate-limiter.ts

export class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private readonly delayMs: number;

  constructor({ requestsPerSecond }: { requestsPerSecond: number }) {
    this.delayMs = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      if (!this.processing) this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    this.processing = true;
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      next?.();
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
    this.processing = false;
  }
}
```

### 5.5 — Scraping Fallback Flow

```
User searches "X"
      │
      ▼
Check RecipeSearchCache (queryHash)
      │
  HIT │ MISS
      │──────────────────┐
      │                  ▼
      │         Run Playwright scrapers
      │         (AllRecipes, Tasty, BBC)
      │              │
      │          Results?
      │        YES │ NO
      │            │──────────────────┐
      │            │                  ▼
      │            │        Trigger AI generation
      │            │        (generateRecipe procedure)
      │            │        Mark aiGenerated = true
      ▼            ▼                  │
      └────────────┴──────────────────┘
                   │
                   ▼
            Persist to DB
            (cacheExpiry = now + 24h)
                   │
                   ▼
             Return results
```

---

## 6. tRPC Procedures

```typescript
// src/server/routers/recipes.ts

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

const RecipeFiltersSchema = z.object({
  cuisine: z.array(z.string()).optional(),
  dietary: z.array(z.string()).optional(),
  maxTotalTime: z.number().int().positive().optional(), // minutes
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  aiGenerated: z.boolean().optional(),
});

const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const recipesRouter = createTRPCRouter({

  // ── Search ─────────────────────────────────────────────────────────────────

  searchRecipes: publicProcedure
    .input(z.object({
      query: z.string().min(1).max(200),
      filters: RecipeFiltersSchema.optional(),
      pagination: PaginationSchema.optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { query, filters, pagination } = input;
      const queryHash = computeQueryHash(query, filters);

      return getCachedOrScrape(queryHash, async () => {
        const [allrecipes, tasty, bbc] = await Promise.allSettled([
          new AllRecipesScraper().search(query, filters ?? {}),
          new TastyScraper().search(query, filters ?? {}),
          new BBCGoodFoodScraper().search(query, filters ?? {}),
        ]);

        const results = [
          ...(allrecipes.status === 'fulfilled' ? allrecipes.value : []),
          ...(tasty.status === 'fulfilled' ? tasty.value : []),
          ...(bbc.status === 'fulfilled' ? bbc.value : []),
        ];

        if (results.length === 0) {
          // Fallback to AI generation
          const aiRecipe = await generateRecipe({ prompt: query, filters });
          return [aiRecipe];
        }

        return results;
      });
    }),

  getRecipeById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const recipe = await ctx.prisma.recipe.findUniqueOrThrow({
        where: { id: input.id },
      });
      return recipe;
    }),

  // ── Saved Recipes ──────────────────────────────────────────────────────────

  saveRecipe: protectedProcedure
    .input(z.object({
      recipeId: z.string().cuid(),
      notes: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.savedRecipe.upsert({
        where: { userId_recipeId: { userId: ctx.session.user.id, recipeId: input.recipeId } },
        create: { userId: ctx.session.user.id, recipeId: input.recipeId, notes: input.notes },
        update: { notes: input.notes },
      });
    }),

  unsaveRecipe: protectedProcedure
    .input(z.object({ recipeId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.savedRecipe.delete({
        where: { userId_recipeId: { userId: ctx.session.user.id, recipeId: input.recipeId } },
      });
    }),

  getSavedRecipes: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const items = await ctx.prisma.savedRecipe.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.search ? {
            recipe: { title: { contains: input.search, mode: 'insensitive' } },
          } : {}),
        },
        include: { recipe: true },
        orderBy: { savedAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { userId_recipeId: { userId: ctx.session.user.id, recipeId: input.cursor } } : undefined,
      });

      const hasMore = items.length > input.limit;
      return {
        items: hasMore ? items.slice(0, -1) : items,
        nextCursor: hasMore ? items[items.length - 2]!.recipeId : undefined,
      };
    }),

  // ── Meal Plan ──────────────────────────────────────────────────────────────

  getMealPlan: protectedProcedure
    .input(z.object({
      weekStart: z.string().datetime(), // ISO date of Monday
    }))
    .query(async ({ input, ctx }) => {
      const start = new Date(input.weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      return ctx.prisma.mealPlan.findMany({
        where: {
          userId: ctx.session.user.id,
          date: { gte: start, lte: end },
        },
        include: { recipe: true },
        orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
      });
    }),

  addToMealPlan: protectedProcedure
    .input(z.object({
      recipeId: z.string().cuid(),
      date: z.string().datetime(),
      mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.mealPlan.upsert({
        where: {
          userId_date_mealType: {
            userId: ctx.session.user.id,
            date: new Date(input.date),
            mealType: input.mealType,
          },
        },
        create: {
          userId: ctx.session.user.id,
          recipeId: input.recipeId,
          date: new Date(input.date),
          mealType: input.mealType,
        },
        update: { recipeId: input.recipeId },
      });
    }),

  removeFromMealPlan: protectedProcedure
    .input(z.object({ mealPlanId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.mealPlan.delete({
        where: { id: input.mealPlanId, userId: ctx.session.user.id },
      });
    }),

  // ── Shopping List Integration ──────────────────────────────────────────────

  generateShoppingListFromMealPlan: protectedProcedure
    .input(z.object({
      weekStart: z.string().datetime(),
      includeMealTypes: z.array(z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const mealPlan = await getMealPlanWithRecipes(ctx.session.user.id, input.weekStart);
      const filteredPlan = input.includeMealTypes
        ? mealPlan.filter((m) => input.includeMealTypes!.includes(m.mealType))
        : mealPlan;

      const allIngredients = filteredPlan.flatMap(
        (m) => m.recipe.ingredients as RecipeIngredient[]
      );

      const merged = mergeIngredients(allIngredients); // dedup + sum quantities

      // Creates a new ShoppingList via the Shopping module's service layer
      return createShoppingListFromIngredients(ctx.session.user.id, merged);
    }),

  // ── AI Features ────────────────────────────────────────────────────────────

  suggestRecipesFromIngredients: protectedProcedure
    .input(z.object({
      ingredients: z.array(z.string()).min(1).max(20),
      dietary: z.array(z.string()).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { textStream } = await streamText({
        model: openai('gpt-4o-mini'),
        system: `You are a creative chef AI. Given a list of available ingredients,
          suggest 5 recipes the user can make. For each recipe, provide:
          - title
          - matchedIngredients (from the user's list)
          - missingIngredients (what else is needed, max 3)
          - estimatedTime (minutes)
          - difficulty (easy/medium/hard)
          - brief description (1-2 sentences)
          Respond with a valid JSON array.`,
        prompt: `Available ingredients: ${input.ingredients.join(', ')}.
          Dietary restrictions: ${input.dietary?.join(', ') ?? 'none'}.`,
      });

      return textStream; // Client reads streaming JSON
    }),

  generateRecipe: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(500),
      filters: RecipeFiltersSchema.optional(),
      style: z.string().optional(), // "rustic", "restaurant-style", etc.
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await generateObject({
        model: anthropic('claude-3-5-sonnet-20241022'),
        schema: z.object({
          title: z.string(),
          description: z.string(),
          ingredients: z.array(z.object({
            name: z.string(),
            quantity: z.number(),
            unit: z.string(),
            preparation: z.string().optional(),
            category: z.string(),
          })),
          instructions: z.array(z.object({
            step: z.number(),
            description: z.string(),
            durationMinutes: z.number().optional(),
            tip: z.string().optional(),
          })),
          prepTime: z.number(),
          cookTime: z.number(),
          servings: z.number(),
          cuisine: z.string(),
          dietary: z.array(z.string()),
          difficulty: z.enum(['easy', 'medium', 'hard']),
          tags: z.array(z.string()),
        }),
        prompt: `Create a detailed recipe for: "${input.prompt}".
          Style preference: ${input.style ?? 'standard home cooking'}.
          Dietary filters: ${JSON.stringify(input.filters?.dietary ?? [])}.`,
      });

      // Persist AI-generated recipe to DB
      const recipe = await ctx.prisma.recipe.create({
        data: {
          ...result.object,
          aiGenerated: true,
          userId: ctx.session.user.id,
        },
      });

      return recipe;
    }),

  analyzeNutrition: protectedProcedure
    .input(z.object({ recipeId: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      const recipe = await ctx.prisma.recipe.findUniqueOrThrow({
        where: { id: input.recipeId },
      });

      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
          perServing: z.object({
            calories: z.number(),
            protein: z.number(),
            carbs: z.number(),
            fat: z.number(),
            fiber: z.number(),
            sodium: z.number(),
          }),
          total: z.object({
            calories: z.number(),
            protein: z.number(),
            carbs: z.number(),
            fat: z.number(),
            fiber: z.number(),
            sodium: z.number(),
          }),
          disclaimer: z.string(),
          highlights: z.array(z.string()), // ["High protein", "Low carb"]
        }),
        prompt: `Estimate nutritional information for this recipe (${recipe.servings} servings):
          ${JSON.stringify(recipe.ingredients)}`,
      });

      return result.object;
    }),

  adaptRecipeForDiet: protectedProcedure
    .input(z.object({
      recipeId: z.string().cuid(),
      restrictions: z.array(z.string()).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const recipe = await ctx.prisma.recipe.findUniqueOrThrow({
        where: { id: input.recipeId },
      });

      // Returns a ReadableStream for client-side streaming
      const { textStream } = await streamText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        system: `You are a culinary expert. Adapt the given recipe to meet the specified 
          dietary restrictions while maintaining the spirit of the original dish. 
          Return a complete modified recipe in JSON format.`,
        prompt: `Original recipe: ${JSON.stringify(recipe)}
          Dietary restrictions to apply: ${input.restrictions.join(', ')}`,
      });

      return textStream;
    }),
});
```

---

## 7. AI Features

### 7.1 — Model Selection Strategy

| Task | Model | Rationale |
|---|---|---|
| Ingredient-to-recipe suggestions | `gpt-4o-mini` | Fast, cheap, good enough for structured JSON |
| Full recipe generation | `claude-3-5-sonnet` | Best for creative, detailed recipes |
| Nutritional analysis | `gpt-4o-mini` | Structured output, fast |
| Dietary adaptation | `claude-3-5-sonnet` | Needs nuanced understanding of substitutions |
| Local / offline fallback | `ollama/llama3.2` | Via Ollama when user opts for privacy |

### 7.2 — AI Prompt Templates

```typescript
// src/lib/ai/prompts/recipes.ts

export const INGREDIENT_SUGGESTION_SYSTEM = `
You are a creative chef AI assistant. Your job is to suggest practical, 
delicious recipes based on available ingredients. Always:
- Prioritize recipes that use the majority of provided ingredients
- Keep missing ingredients to a minimum (max 3)
- Consider common pantry staples (salt, pepper, oil) as "always available"
- Rank by ingredient match percentage
- Be realistic about difficulty levels
`;

export const RECIPE_GENERATION_SYSTEM = `
You are a professional recipe developer. When generating recipes:
- Provide clear, numbered instructions
- Include specific quantities and measurements
- Note substitution options for key ingredients
- Include timing for each step when applicable
- Mention visual/sensory cues for doneness ("until golden brown")
- Always include a brief description that sells the dish
`;

export const NUTRITIONAL_ANALYSIS_SYSTEM = `
You are a registered dietitian assistant providing nutritional estimates.
- Base estimates on USDA food database averages
- Account for cooking method (roasting vs. boiling affects values)
- Round to reasonable precision (calories: nearest 10, macros: nearest 1g)
- Always include a disclaimer that values are estimates
- Flag notable nutritional highlights or concerns
`;
```

### 7.3 — Ollama Local Fallback

```typescript
// src/lib/ai/model-selector.ts

import { createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export function selectModel(task: 'quick' | 'detailed', useLocal = false) {
  if (useLocal) {
    // Requires Ollama running on localhost:11434
    const ollama = createOpenAI({
      baseURL: 'http://localhost:11434/v1',
      apiKey: 'ollama', // placeholder
    });
    return ollama('llama3.2');
  }

  switch (task) {
    case 'quick':
      return openai('gpt-4o-mini');
    case 'detailed':
      return anthropic('claude-3-5-sonnet-20241022');
  }
}
```

---

## 8. Recipe Card Component

```typescript
// src/components/recipes/RecipeCard.tsx

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Clock, ChefHat, Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  isSaved: boolean;
  onSave: (id: string) => void;
  onAddToMealPlan: (id: string) => void;
  variant?: 'grid' | 'list';
}

const DIETARY_BADGES: Record<string, { label: string; color: string }> = {
  vegan:       { label: '🌱 Vegan',       color: 'bg-green-100 text-green-800' },
  vegetarian:  { label: '🥦 Veggie',      color: 'bg-emerald-100 text-emerald-800' },
  'gluten-free': { label: '🌾 GF',        color: 'bg-yellow-100 text-yellow-800' },
  'dairy-free':  { label: '🥛 DF',        color: 'bg-blue-100 text-blue-800' },
  keto:        { label: '🥑 Keto',        color: 'bg-purple-100 text-purple-800' },
};

export function RecipeCard({
  recipe,
  isSaved,
  onSave,
  onAddToMealPlan,
  variant = 'grid',
}: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        'cursor-pointer transition-shadow hover:shadow-md',
        variant === 'list' && 'flex flex-row h-32'
      )}
    >
      {/* Cover Image */}
      <div className={cn(
        'relative overflow-hidden bg-muted',
        variant === 'grid' ? 'h-48 w-full' : 'h-32 w-32 flex-shrink-0'
      )}>
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
        )}
        {recipe.aiGenerated && (
          <span className="absolute left-2 top-2 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">
            AI Generated
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
          {recipe.title}
        </h3>

        {/* Meta row */}
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {totalTime < 60 ? `${totalTime}m` : `${Math.floor(totalTime / 60)}h ${totalTime % 60}m`}
          </span>
          <span className="flex items-center gap-1">
            <ChefHat className="h-3 w-3" />
            <span className="capitalize">{recipe.difficulty}</span>
          </span>
        </div>

        {/* Dietary badges */}
        {recipe.dietary.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.dietary.slice(0, 3).map((d) => (
              <span
                key={d}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  DIETARY_BADGES[d]?.color ?? 'bg-gray-100 text-gray-700'
                )}
              >
                {DIETARY_BADGES[d]?.label ?? d}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToMealPlan(recipe.id); }}
            className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Meal Plan
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSave(recipe.id); }}
            className={cn(
              'rounded-full p-1.5 transition-colors',
              isSaved
                ? 'text-red-500 hover:text-red-600'
                : 'text-muted-foreground hover:text-red-500'
            )}
            aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
          >
            <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## 9. Recipe Detail Page

### 9.1 — Route: `/recipes/[id]/page.tsx`

```typescript
// src/app/(dashboard)/recipes/[id]/page.tsx

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { api } from '@/trpc/server';
import { RecipeDetailClient } from './_components/RecipeDetailClient';
import { RecipeDetailSkeleton } from './_components/RecipeDetailSkeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const recipe = await api.recipes.getRecipeById({ id });
    return (
      <Suspense fallback={<RecipeDetailSkeleton />}>
        <RecipeDetailClient recipe={recipe} />
      </Suspense>
    );
  } catch {
    notFound();
  }
}
```

### 9.2 — Client Component Behavior

- **Ingredients list**: Each ingredient renders as a `<button>` that toggles a checked state in local Zustand slice — checked items display with strikethrough + reduced opacity
- **Step-by-step instructions**: Steps are collapsed by default; clicking a step expands it with a smooth `height` animation via Framer Motion's `AnimatePresence`
- **Serving adjuster**: A `+/-` control scales all ingredient quantities proportionally using simple ratio math; values update instantly in local state (no server round-trip)
- **"Add missing to Shopping List"**: Collects all unchecked ingredients → calls `shopping.addItemsFromRecipe` mutation
- **AI Nutrition Panel**: Lazy-loaded on first expand; fires `analyzeNutrition` query, streams result; displays as animated number counters using Framer Motion
- **Adapt Recipe**: Opens a bottom drawer with dietary restriction checkboxes → calls `adaptRecipeForDiet`, streams the modified recipe inline with a typewriter effect
- **Hero image**: Uses Next.js `<Image>` with blur placeholder; falls back to a gradient with emoji if no image

---

## 10. Meal Planner

### 10.1 — State Management (Zustand)

```typescript
// src/stores/meal-plan-store.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type MealSlotKey = `${string}_${MealType}`; // "2024-01-15_DINNER"

interface MealPlanStore {
  slots: Record<MealSlotKey, MealPlanSlot | null>;
  weekStart: Date;
  draggedRecipe: Recipe | null;

  setWeekStart: (date: Date) => void;
  setSlot: (date: string, mealType: MealType, recipe: Recipe | null) => void;
  setDraggedRecipe: (recipe: Recipe | null) => void;
  clearSlot: (date: string, mealType: MealType) => void;
}

export const useMealPlanStore = create<MealPlanStore>()(
  immer((set) => ({
    slots: {},
    weekStart: getMonday(new Date()),
    draggedRecipe: null,

    setWeekStart: (date) => set((state) => { state.weekStart = date; }),

    setSlot: (date, mealType, recipe) => set((state) => {
      const key: MealSlotKey = `${date}_${mealType}`;
      state.slots[key] = recipe ? { date, mealType, recipe } : null;
    }),

    setDraggedRecipe: (recipe) => set((state) => { state.draggedRecipe = recipe; }),

    clearSlot: (date, mealType) => set((state) => {
      const key: MealSlotKey = `${date}_${mealType}`;
      state.slots[key] = null;
    }),
  }))
);
```

### 10.2 — 7-Day Calendar Grid Component

```typescript
// src/components/recipes/MealPlanner.tsx
//
// Layout: 7 columns (days) × 4 rows (meal types) + header row
// Each cell is a drop target; dragging a RecipeCard onto it calls addToMealPlan

// Drop target cell uses the HTML5 DnD API (onDragOver + onDrop)
// On mobile: tap recipe → "Add to plan" → modal to pick day + mealType

interface MealPlanCellProps {
  date: string;         // ISO date string "2024-01-15"
  mealType: MealType;
  recipe: Recipe | null;
  onDrop: (date: string, mealType: MealType, recipe: Recipe) => void;
  onClear: (date: string, mealType: MealType) => void;
}
```

### 10.3 — Shopping List Generation Logic

```typescript
// src/lib/recipes/merge-ingredients.ts

export function mergeIngredients(
  ingredients: RecipeIngredient[]
): MergedIngredient[] {
  const map = new Map<string, MergedIngredient>();

  for (const ing of ingredients) {
    // Normalize name: lowercase, singular form
    const key = `${normalize(ing.name)}_${ing.unit}`;

    if (map.has(key)) {
      map.get(key)!.quantity += ing.quantity;
    } else {
      map.set(key, { ...ing, quantity: ing.quantity });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.category.localeCompare(b.category)
  );
}
```

---

## 11. Animations

### 11.1 — Card Hover Scale
Handled via `motion.div` with `whileHover={{ scale: 1.02, y: -2 }}` and spring physics — see `RecipeCard` component above.

### 11.2 — Skeleton Loading

```typescript
// src/components/recipes/RecipeCardSkeleton.tsx

import { Skeleton } from '@/components/ui/skeleton';

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
```

### 11.3 — AI Streaming Typewriter Effect

```typescript
// src/components/recipes/AIStreamingText.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIStreamingTextProps {
  stream: ReadableStream<string> | null;
  className?: string;
}

export function AIStreamingText({ stream, className }: AIStreamingTextProps) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!stream) return;
    const reader = stream.getReader();
    let accumulated = '';

    async function read() {
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) { setDone(true); break; }
        accumulated += value;
        setText(accumulated);
      }
    }

    read();
    return () => { reader.cancel(); };
  }, [stream]);

  return (
    <div className={className}>
      <span>{text}</span>
      <AnimatePresence>
        {!done && (
          <motion.span
            className="inline-block h-4 w-0.5 bg-foreground align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 11.4 — Meal Plan Slot Drop Animation

```typescript
// Drop zone uses AnimatePresence to transition between empty/filled states
// Empty state: dashed border, subtle pulse animation
// Filled state: thumbnail + name, scale-in on mount with spring physics

const slotVariants = {
  empty: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  filled: { borderStyle: 'solid', backgroundColor: 'var(--primary-50)' },
};
```

---

## 12. Testing

### 12.1 — Scraper Mock Tests (Vitest)

```typescript
// src/lib/scrapers/__tests__/allrecipes-scraper.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllRecipesScraper } from '../allrecipes-scraper';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setExtraHTTPHeaders: vi.fn(),
        goto: vi.fn(),
        evaluate: vi.fn().mockResolvedValue(mockSearchResults),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

const mockSearchResults = [
  { title: 'Spaghetti Carbonara', url: 'https://allrecipes.com/recipe/1', imageUrl: null, totalTime: '25 mins' },
];

describe('AllRecipesScraper', () => {
  let scraper: AllRecipesScraper;

  beforeEach(async () => {
    scraper = new AllRecipesScraper();
    await scraper.init();
  });

  it('returns normalized recipe previews from search', async () => {
    const results = await scraper.search('carbonara', {});
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Spaghetti Carbonara');
  });

  it('respects rate limiting — waits between requests', async () => {
    const start = Date.now();
    await Promise.all([
      scraper.search('pasta', {}),
      scraper.search('pizza', {}),
    ]);
    expect(Date.now() - start).toBeGreaterThan(1900); // ~2s gap
  });

  it('throws when robots.txt disallows the URL', async () => {
    vi.spyOn(scraper['robotsChecker'], 'isAllowed').mockResolvedValue(false);
    await expect(scraper.search('test', {})).rejects.toThrow('Scraping blocked');
  });
});
```

### 12.2 — AI Mock Tests

```typescript
// src/server/routers/__tests__/recipes-ai.test.ts

import { describe, it, expect, vi } from 'vitest';
import { createCaller } from '../recipes';
import { mockDeep } from 'vitest-mock-extended';

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mock-model'),
}));

vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      title: 'AI Pasta Bake',
      description: 'A creamy, AI-generated pasta bake.',
      ingredients: [{ name: 'pasta', quantity: 400, unit: 'g', category: 'pantry' }],
      instructions: [{ step: 1, description: 'Cook pasta.' }],
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      cuisine: 'Italian',
      dietary: [],
      difficulty: 'easy',
      tags: ['pasta', 'bake'],
    },
  }),
}));

describe('generateRecipe', () => {
  it('returns an AI-generated recipe with aiGenerated=true', async () => {
    const caller = createCaller(mockContext);
    const result = await caller.generateRecipe({ prompt: 'pasta bake' });
    expect(result.aiGenerated).toBe(true);
    expect(result.title).toBe('AI Pasta Bake');
  });
});
```

### 12.3 — Meal Plan Calculation Unit Tests

```typescript
// src/lib/recipes/__tests__/merge-ingredients.test.ts

import { describe, it, expect } from 'vitest';
import { mergeIngredients } from '../merge-ingredients';

describe('mergeIngredients', () => {
  it('sums identical ingredients across recipes', () => {
    const input: RecipeIngredient[] = [
      { name: 'garlic', quantity: 2, unit: 'cloves', category: 'produce' },
      { name: 'garlic', quantity: 3, unit: 'cloves', category: 'produce' },
    ];
    const result = mergeIngredients(input);
    expect(result).toHaveLength(1);
    expect(result[0]!.quantity).toBe(5);
  });

  it('keeps different units separate', () => {
    const input: RecipeIngredient[] = [
      { name: 'butter', quantity: 50, unit: 'g', category: 'dairy' },
      { name: 'butter', quantity: 2, unit: 'tbsp', category: 'dairy' },
    ];
    const result = mergeIngredients(input);
    expect(result).toHaveLength(2);
  });

  it('sorts by category', () => {
    const input: RecipeIngredient[] = [
      { name: 'milk', quantity: 200, unit: 'ml', category: 'dairy' },
      { name: 'apple', quantity: 1, unit: 'piece', category: 'produce' },
    ];
    const result = mergeIngredients(input);
    expect(result[0]!.category).toBe('dairy');
    expect(result[1]!.category).toBe('produce');
  });

  it('handles empty input', () => {
    expect(mergeIngredients([])).toEqual([]);
  });
});
```

### 12.4 — E2E Tests (Playwright)

```typescript
// e2e/recipes/meal-planner.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Meal Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForSelector('[data-testid="recipe-grid"]');
  });

  test('drag recipe to meal plan slot', async ({ page }) => {
    const card = page.locator('[data-testid="recipe-card"]').first();
    const slot = page.locator('[data-testid="meal-slot-monday-dinner"]');

    await card.dragTo(slot);

    await expect(slot).toContainText(await card.locator('h3').textContent());
  });

  test('generate shopping list from meal plan', async ({ page }) => {
    // Pre-fill meal plan via API
    await page.request.post('/api/trpc/recipes.addToMealPlan', {
      data: { recipeId: 'test-recipe-id', date: nextMonday(), mealType: 'DINNER' },
    });

    await page.reload();
    await page.click('[data-testid="generate-shopping-list"]');

    await expect(page).toHaveURL(/\/shopping/);
    await expect(page.locator('[data-testid="shopping-list"]')).toBeVisible();
  });
});
```

---

## Appendix: File Structure

```
src/
├── app/(dashboard)/recipes/
│   ├── page.tsx                    # Main recipes page (RSC)
│   ├── [id]/
│   │   ├── page.tsx                # Recipe detail (RSC)
│   │   └── _components/
│   │       ├── RecipeDetailClient.tsx
│   │       ├── RecipeDetailSkeleton.tsx
│   │       ├── IngredientsList.tsx
│   │       ├── InstructionSteps.tsx
│   │       ├── NutritionPanel.tsx
│   │       └── AdaptRecipeDrawer.tsx
│   └── _components/
│       ├── RecipeGrid.tsx
│       ├── RecipeCard.tsx
│       ├── RecipeCardSkeleton.tsx
│       ├── RecipeFilters.tsx
│       ├── MealPlanner.tsx
│       ├── MealPlanCell.tsx
│       ├── SavedRecipesSidebar.tsx
│       └── IngredientSearch.tsx
├── server/routers/recipes.ts
├── lib/
│   ├── scrapers/
│   │   ├── base-scraper.ts
│   │   ├── allrecipes-scraper.ts
│   │   ├── tasty-scraper.ts
│   │   ├── bbc-good-food-scraper.ts
│   │   ├── recipe-cache.ts
│   │   └── robots-checker.ts
│   ├── rate-limiter.ts
│   ├── recipes/
│   │   └── merge-ingredients.ts
│   └── ai/
│       ├── model-selector.ts
│       └── prompts/recipes.ts
└── stores/
    └── meal-plan-store.ts
```
