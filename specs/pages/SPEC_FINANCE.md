# Mission Control — Finance Module Specification

**Routes:** `/finance` · `/finance/transactions` · `/finance/budgets`  
**Files:**  
- `apps/web/app/(dashboard)/finance/page.tsx`  
- `apps/web/app/(dashboard)/finance/transactions/page.tsx`  
- `apps/web/app/(dashboard)/finance/budgets/page.tsx`  
**Version:** 1.0.0  
**Last updated:** 2026-05-22

---

## 1. Overview

The Finance module is a complete personal expense management system embedded within Mission Control. It provides the user with full control over their financial life: recording income and expenses, organizing transactions by category, setting spending budgets per category, and visualizing patterns through rich charts and AI-powered insights.

### Goals

| Goal | Description |
|------|-------------|
| **Instant overview** | User understands their monthly financial health in under 3 seconds |
| **Frictionless entry** | Adding a transaction takes < 15 seconds including category assignment |
| **Budget awareness** | User always knows which categories are over/near budget |
| **Pattern intelligence** | AI surfaces insights the user would not find themselves |
| **Data portability** | Full CSV import/export; no lock-in |

### Module Boundaries

The Finance module is self-contained. It reads from and writes to the `Transaction`, `Category`, `Budget`, and `RecurringTransaction` Prisma models. The Dashboard widget at `/` consumes read-only snapshots via `finance.getAccountBalance`, `finance.getRecentTransactions`, and `finance.getSparklineData`.

---

## 2. User Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-F01 | As a user, I want to see my total balance, monthly income, and monthly expenses on one screen, so I understand my financial position at a glance. | Finance overview page shows three stat cards with current values and monthly delta. |
| US-F02 | As a user, I want to add a transaction in under 15 seconds — specifying amount, category, and date — so logging expenses does not feel like a chore. | Transaction form accessible from page + quick action; submits and reflects in list within 1 second. |
| US-F03 | As a user, I want to see a donut chart of spending by category for the current month, so I immediately know where my money goes. | Donut chart renders with category labels and percentages; clicking a segment filters the transaction list. |
| US-F04 | As a user, I want to filter my transaction history by date range, category, and type (income/expense), so I can quickly find specific transactions. | Filters apply instantly (no page reload); filter state persists in URL query params. |
| US-F05 | As a user, I want to set a monthly budget per spending category, so I know when I am approaching or over my limits. | Budget creation form; progress bars per category; red highlight when over budget. |
| US-F06 | As a user, I want to import transactions from a bank CSV export, map the columns, and have AI auto-categorize them, so I can onboard historical data quickly. | CSV import wizard: upload → column mapping → preview → import. AI suggests category for each row. |
| US-F07 | As a user, I want to mark a transaction as recurring (weekly, monthly, yearly), so I do not have to re-enter regular expenses like subscriptions. | Recurring toggle in transaction form; `RecurringTransaction` record created; next-run displayed in transaction list. |
| US-F08 | As a user, I want AI to tell me "You spent 40% more on dining this month vs last month," so I can adjust my habits. | AI Insights panel on Finance overview with at least 3 data-driven observations. |
| US-F09 | As a user, I want to see a 12-month area chart of income vs expenses, so I can spot seasonal patterns in my finances. | Area chart renders last 12 months with two series; hover tooltip shows exact values per month. |
| US-F10 | As a user, I want to be warned if a CSV import contains transactions that look like duplicates of existing records, so I do not double-count spending. | Import preview flags potential duplicates with a yellow badge; user can deselect them before importing. |

---

## 3. Sub-Pages

### 3.1 `/finance` — Finance Overview

The main entry point. Shows summary stats, charts, budget health, and AI insights.

### 3.2 `/finance/transactions` — Transaction List

Full paginated, filterable, sortable list of all transactions. Full CRUD operations.

### 3.3 `/finance/budgets` — Budget Management

Create, edit, and delete budgets per category. Progress bars and over-budget alerts.

---

## 4. UI Layouts (ASCII Wireframes)

### 4.1 `/finance` — Overview Page

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: [≡ Mission Control]    [🔍 Cmd+K]    [🔔] [Avatar]                      │
├────────────┬────────────────────────────────────────────────────────────────────┤
│  SIDEBAR   │ FINANCE OVERVIEW                                                   │
│            │                                                                    │
│  ⌂ Home   │  ┌─────────────────────────────────────────────────────────────┐   │
│  ₿ Finance│  │ SUMMARY STATS  [col 4 each × 3]                             │   │
│    Overview│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │   │
│    Trans.. │  │ │ 💰 Balance   │  │ ▲ Income     │  │ ▼ Expenses   │       │   │
│    Budgets │  │ │  $4,821.50   │  │  $3,200.00   │  │  $1,843.20   │       │   │
│            │  │ │  All time    │  │  May 2026    │  │  May 2026    │       │   │
│            │  │ └──────────────┘  └──────────────┘  └──────────────┘       │   │
│            │  └─────────────────────────────────────────────────────────────┘   │
│            │                                                                    │
│            │  ┌─────────────────────────────┐ ┌──────────────────────────────┐ │
│            │  │ SPENDING BY CATEGORY         │ │ INCOME vs EXPENSES (12mo)    │ │
│            │  │  col 1–5 (5 cols)            │ │  col 6–12 (7 cols)           │ │
│            │  │                              │ │                              │ │
│            │  │       ╭───────╮              │ │  $5k ╷                  ╭╮  │ │
│            │  │      ╭╯       ╰╮             │ │      │     ╭╮      ╭╮  ╭╯╰╮ │ │
│            │  │  ───╯           ╰───         │ │  $3k │ ╭╮ ╭╯╰╮ ╭─╯╰╮╭╯   │ │
│            │  │  🍔 Food    $420  32%        │ │      │╭╯╰─╯   ╰╯    ╰╯    │ │
│            │  │  🏠 Rent    $800  61%        │ │  $1k ┼─────────────────────│ │
│            │  │  📺 Subs    $52    4%        │ │      J F M A M J J A S O N M│ │
│            │  │  🏋 Health  $50    3%        │ │                              │ │
│            │  │  [Click segment to filter]   │ │  ■ Income  ■ Expenses        │ │
│            │  └─────────────────────────────┘ └──────────────────────────────┘ │
│            │                                                                    │
│            │  ┌─────────────────────────────────────────────────────────────┐   │
│            │  │ BUDGET HEALTH                              [Manage budgets →] │   │
│            │  │ col span 12                                                   │   │
│            │  │                                                               │   │
│            │  │ 🍔 Food      $420 / $500  ████████████░░░░  84%  On track    │   │
│            │  │ 🏠 Rent      $800 / $800  ████████████████ 100%  At limit    │   │
│            │  │ 🎮 Entertain $140 / $100  ████████████████████ 140% OVER!    │   │
│            │  │ ☕ Coffee    $42  / $80   ████████░░░░░░░░  53%  On track    │   │
│            │  └─────────────────────────────────────────────────────────────┘   │
│            │                                                                    │
│            │  ┌────────────────────────────────┐ ┌──────────────────────────┐  │
│            │  │ RECENT TRANSACTIONS  [All →]   │ │ AI INSIGHTS 🤖           │  │
│            │  │  col 1–7 (7 cols)              │ │  col 8–12 (5 cols)       │  │
│            │  │ ☕ Coffee     -$4.50   Jan 22  │ │ 💡 You spent 40% more    │  │
│            │  │ 💼 Salary  +$3200.00   Jan 22  │ │    on Food this month    │  │
│            │  │ 🛒 Grocer   -$67.30   Jan 21   │ │    vs January.           │  │
│            │  │ 📺 Netflix  -$15.90   Jan 21   │ │                          │  │
│            │  │ 🏋 Gym      -$50.00   Jan 20   │ │ 💡 Your biggest expense  │  │
│            │  └────────────────────────────────┘ │    category is Rent      │  │
│            │                                     │    (61% of spending).    │  │
│            │                                     │                          │  │
│            │                                     │ 💡 Setting a Coffee      │  │
│            │                                     │    budget could save ~   │  │
│            │                                     │    $40/month.            │  │
│            │                                     │                          │  │
│            │                                     │ [Refresh insights]       │  │
│            │                                     └──────────────────────────┘  │
└────────────┴────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 `/finance/transactions` — Transaction List Page

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                                           │
├────────────┬────────────────────────────────────────────────────────────────────┤
│  SIDEBAR   │ ALL TRANSACTIONS                                   [+ Add]         │
│            │                                                                    │
│            │  FILTER BAR                                                        │
│            │  ┌──────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────┐  │
│            │  │📅 May 2026│ │🏷 All categories│ │⇅ All types    │ │🔍 Search │  │
│            │  └──────────┘ └────────────────┘ └────────────────┘ └──────────┘  │
│            │  [This month ▾] [Custom range]                  [Clear filters]   │
│            │  ─────────────────────────────────────────────────────────────    │
│            │                                                                    │
│            │  SUMMARY STRIP (filtered totals)                                  │
│            │  Income: $3,200.00 · Expenses: $1,843.20 · Net: +$1,356.80       │
│            │  ─────────────────────────────────────────────────────────────    │
│            │                                                                    │
│            │  TRANSACTION TABLE                                [⬆ Sort: Date]  │
│            │  ┌───┬────────────┬──────────────────────┬──────────┬──────────┐  │
│            │  │ ☐ │ Date       │ Description           │ Category │ Amount   │  │
│            │  ├───┼────────────┼──────────────────────┼──────────┼──────────┤  │
│            │  │ ☐ │ Jan 22     │ Coffee                │ ☕ Coffee │  -$4.50  │  │
│            │  │ ☐ │ Jan 22     │ Monthly Salary        │ 💼 Income │+$3,200  │  │
│            │  │ ☐ │ Jan 21     │ Pão de Queijo + items │ 🛒 Food   │ -$67.30 │  │
│            │  │ ☐ │ Jan 21     │ Netflix               │ 📺 Subscr │ -$15.90 │  │
│            │  │ ☐ │ Jan 20     │ Smart Fit             │ 🏋 Health │ -$50.00 │  │
│            │  │ ☐ │ Jan 20     │ Electricity bill      │ 🏠 Util   │ -$120.0 │  │
│            │  │ ☐ │ Jan 18     │ Uber Eats order       │ 🍔 Food   │ -$38.90 │  │
│            │  └───┴────────────┴──────────────────────┴──────────┴──────────┘  │
│            │                                                                    │
│            │  [☐ Select all]  [Delete selected]           Page 1 of 4 [→]     │
│            │                                                                    │
│            │  [⬆ Import CSV]  [⬇ Export CSV]                                   │
└────────────┴────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 `/finance/budgets` — Budget Management Page

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                                           │
├────────────┬────────────────────────────────────────────────────────────────────┤
│  SIDEBAR   │ BUDGETS                                           [+ New Budget]   │
│            │                                                                    │
│            │  ┌─────────────────────────────────────────────────────────────┐  │
│            │  │ PERIOD SELECTOR          [Monthly ▾]    [May 2026 ◂ ▸]      │  │
│            │  │ ─────────────────────────────────────────────────────────── │  │
│            │  │                                                               │  │
│            │  │ OVERVIEW STRIP                                                │  │
│            │  │ Total budgeted: $2,100  ·  Spent: $1,843  ·  Remaining: $257│  │
│            │  │ ████████████████████░░░  87.8% of total budget used          │  │
│            │  └─────────────────────────────────────────────────────────────┘  │
│            │                                                                    │
│            │  BUDGET CARDS (grid: 3 columns on desktop)                        │
│            │                                                                    │
│            │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│            │  │ 🍔 Food         │ │ 🏠 Rent         │ │ 🎮 Entertainment│    │
│            │  │ Budget: $500/mo │ │ Budget: $800/mo │ │ Budget: $100/mo │    │
│            │  │ Spent:  $420    │ │ Spent:  $800    │ │ Spent:  $140    │    │
│            │  │ Left:   $80     │ │ Left:   $0      │ │ Over:   $40     │    │
│            │  │ ████████░░  84% │ │ ████████████ 100│ │ ████████████ 140│    │
│            │  │                 │ │ ⚠ At limit      │ │ 🔴 OVER BUDGET  │    │
│            │  │ 30-day sparkline│ │ 30-day sparkline│ │ 30-day sparkline│    │
│            │  │ ╰──────────────╯│ │ ╰──────────────╯│ │ ╰──────────────╯│    │
│            │  │ [Edit] [Delete] │ │ [Edit] [Delete] │ │ [Edit] [Delete] │    │
│            │  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│            │                                                                    │
│            │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│            │  │ ☕ Coffee       │ │ 🏋 Health       │ │ + Add Budget    │    │
│            │  │ Budget: $80/mo  │ │ Budget: $120/mo │ │                 │    │
│            │  │ Spent:  $42     │ │ Spent:  $50     │ │ [+ New Budget]  │    │
│            │  │ Left:   $38     │ │ Left:   $70     │ │                 │    │
│            │  │ █████░░░░░  53% │ │ ████████░░  42% │ │                 │    │
│            │  │ On track ✓      │ │ On track ✓      │ │                 │    │
│            │  │ [Edit] [Delete] │ │ [Edit] [Delete] │ │                 │    │
│            │  └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│            │                                                                    │
│            │  BAR CHART: Budget vs Actual per Category                         │
│            │  ┌─────────────────────────────────────────────────────────────┐  │
│            │  │   $900                                                        │  │
│            │  │   $800  ┃ ┃                                                   │  │
│            │  │   $700  ┃ ┃                                                   │  │
│            │  │   $600  ┃ ┃                                                   │  │
│            │  │   $500  ┃ ┃  ┃ ┃                                              │  │
│            │  │   $400  ┃ ┃  ┃ ┃                                              │  │
│            │  │   $300  ┃ ┃  ┃ ┃                                              │  │
│            │  │   $200  ┃ ┃  ┃ ┃    ┃ ┃              ┃ ┃    ┃ ┃              │  │
│            │  │   $100  ┃ ┃  ┃ ┃  ┃ ┃    ┃ ┃         ┃ ┃    ┃ ┃              │  │
│            │  │     $0  ──────────────────────────────────────────────────── │  │
│            │  │        Food    Rent  Entert  Coffee  Health                   │  │
│            │  │         ■ Budget   ■ Actual                                   │  │
│            │  └─────────────────────────────────────────────────────────────┘  │
└────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model

### 5.1 Prisma Schema

```prisma
// packages/db/prisma/schema.prisma (Finance models)

enum TransactionType {
  INCOME
  EXPENSE
}

enum BudgetPeriod {
  WEEKLY
  MONTHLY
  YEARLY
}

enum RecurringFrequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}

model Category {
  id          String          @id @default(cuid())
  userId      String
  name        String          @db.VarChar(100)
  color       String          @db.VarChar(7)   // hex: "#FF5733"
  icon        String          @db.VarChar(50)  // Lucide icon name: "coffee"
  type        TransactionType // INCOME or EXPENSE category
  isDefault   Boolean         @default(false)  // system-created defaults
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  budgets      Budget[]

  @@unique([userId, name])
  @@index([userId])
}

model Transaction {
  id          String          @id @default(cuid())
  userId      String
  amount      Decimal         @db.Decimal(12, 2)  // always positive; type determines sign
  type        TransactionType
  categoryId  String
  description String          @db.VarChar(500)
  date        DateTime        @db.Date            // transaction date (not createdAt)
  receiptUrl  String?         // Cloudflare R2 URL
  notes       String?         @db.Text
  isRecurring Boolean         @default(false)
  importHash  String?         // SHA-256 of (userId+date+amount+description) for dedup
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user                User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  category            Category             @relation(fields: [categoryId], references: [id])
  recurringTransaction RecurringTransaction? @relation(fields: [recurringTransactionId], references: [id])
  recurringTransactionId String?

  @@index([userId, date(sort: Desc)])
  @@index([userId, categoryId])
  @@index([importHash])  // for duplicate detection
}

model Budget {
  id          String       @id @default(cuid())
  userId      String
  categoryId  String
  amount      Decimal      @db.Decimal(12, 2)
  period      BudgetPeriod @default(MONTHLY)
  startDate   DateTime     @db.Date
  endDate     DateTime?    @db.Date             // null = ongoing
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])

  @@unique([userId, categoryId, period])  // one active budget per category per period
  @@index([userId])
}

model RecurringTransaction {
  id              String             @id @default(cuid())
  userId          String
  templateAmount  Decimal            @db.Decimal(12, 2)
  templateType    TransactionType
  templateCategoryId String
  templateDescription String         @db.VarChar(500)
  frequency       RecurringFrequency
  nextRun         DateTime           @db.Date
  lastRun         DateTime?          @db.Date
  isActive        Boolean            @default(true)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@index([userId, nextRun])
  @@index([userId, isActive])
}
```

### 5.2 TypeScript Types (derived from Prisma)

```typescript
// types/finance.ts

export type TransactionType = 'INCOME' | 'EXPENSE'
export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface CategoryWithStats extends Category {
  transactionCount: number
  totalSpent: number          // for current period
  sparklineData: { date: string; total: number }[]  // last 30 days
}

export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>
}

export interface BudgetWithProgress extends Budget {
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>
  spent: number               // computed: sum of transactions in period
  remaining: number           // amount - spent
  percentUsed: number         // (spent / amount) * 100
  isOverBudget: boolean
  isNearLimit: boolean        // percentUsed >= 80
  sparklineData: { date: string; total: number }[]
}

// Aggregated summary
export interface FinancialSummary {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  currency: string
  month: string               // "2026-05"
}

// Chart data types
export interface MonthlyTrendPoint {
  month: string               // "2026-01"
  income: number
  expenses: number
  net: number
}

export interface CategorySpending {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  total: number
  percentage: number          // of total expenses
}
```

---

## 6. tRPC Procedures

### 6.1 Router Structure

```typescript
// server/routers/finance.ts
export const financeRouter = router({
  // Queries
  getTransactions: authedProcedure.input(transactionQuerySchema).query(...),
  getTransaction: authedProcedure.input(z.object({ id: z.string() })).query(...),
  getRecentTransactions: authedProcedure.input(z.object({ limit: z.number().min(1).max(50) })).query(...),
  getSparklineData: authedProcedure.input(z.object({ days: z.number().min(7).max(365) })).query(...),
  getAccountBalance: authedProcedure.query(...),
  getSpendingSummary: authedProcedure.input(spendingSummarySchema).query(...),
  getMonthlyTrend: authedProcedure.input(z.object({ months: z.number().min(1).max(24) })).query(...),

  // Category queries
  getCategories: authedProcedure.query(...),
  getCategoryWithStats: authedProcedure.input(z.object({ categoryId: z.string(), days: z.number() })).query(...),

  // Budget queries
  getBudgets: authedProcedure.input(budgetQuerySchema).query(...),

  // Mutations — Transactions
  createTransaction: authedProcedure.input(createTransactionSchema).mutation(...),
  updateTransaction: authedProcedure.input(updateTransactionSchema).mutation(...),
  deleteTransaction: authedProcedure.input(z.object({ id: z.string() })).mutation(...),
  deleteTransactions: authedProcedure.input(z.object({ ids: z.array(z.string()) })).mutation(...),

  // Mutations — Categories
  createCategory: authedProcedure.input(createCategorySchema).mutation(...),
  updateCategory: authedProcedure.input(updateCategorySchema).mutation(...),
  deleteCategory: authedProcedure.input(z.object({ id: z.string() })).mutation(...),

  // Mutations — Budgets
  createBudget: authedProcedure.input(createBudgetSchema).mutation(...),
  updateBudget: authedProcedure.input(updateBudgetSchema).mutation(...),
  deleteBudget: authedProcedure.input(z.object({ id: z.string() })).mutation(...),

  // AI features
  getAIInsights: authedProcedure.input(z.object({ month: z.string() })).query(...),
  autoCategorize: authedProcedure.input(z.object({ description: z.string(); amount: z.number() })).mutation(...),

  // Import/Export
  importFromCSV: authedProcedure.input(csvImportSchema).mutation(...),
  exportToCSV: authedProcedure.input(transactionQuerySchema).query(...),
  validateCSVImport: authedProcedure.input(csvValidationSchema).mutation(...),
})
```

### 6.2 Detailed Procedure Specifications

#### `getTransactions`

```typescript
const transactionQuerySchema = z.object({
  // Pagination
  page:        z.number().min(1).default(1),
  pageSize:    z.number().min(10).max(100).default(25),

  // Filters
  dateFrom:    z.string().date().optional(),    // "2026-01-01"
  dateTo:      z.string().date().optional(),    // "2026-01-31"
  categoryIds: z.array(z.string()).optional(),
  type:        z.enum(['INCOME', 'EXPENSE']).optional(),
  search:      z.string().max(200).optional(),  // searches description

  // Sorting
  sortBy:      z.enum(['date', 'amount', 'description', 'category']).default('date'),
  sortDir:     z.enum(['asc', 'desc']).default('desc'),
})

// Output:
interface GetTransactionsOutput {
  items: TransactionWithCategory[]
  totalCount: number
  pageCount: number
  currentPage: number
  summary: {
    totalIncome: number
    totalExpenses: number
    netAmount: number
  }
}
```

#### `createTransaction`

```typescript
const createTransactionSchema = z.object({
  amount:       z.number().positive().max(1_000_000),
  type:         z.enum(['INCOME', 'EXPENSE']),
  categoryId:   z.string().cuid(),
  description:  z.string().min(1).max(500),
  date:         z.string().date(),
  receiptUrl:   z.string().url().optional(),
  notes:        z.string().max(2000).optional(),
  isRecurring:  z.boolean().default(false),
  recurring:    z.object({
    frequency:  z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
    endDate:    z.string().date().optional(),
  }).optional(),  // only required when isRecurring = true
})

// Output: TransactionWithCategory
```

#### `updateTransaction`

```typescript
const updateTransactionSchema = z.object({
  id:           z.string().cuid(),
  amount:       z.number().positive().max(1_000_000).optional(),
  type:         z.enum(['INCOME', 'EXPENSE']).optional(),
  categoryId:   z.string().cuid().optional(),
  description:  z.string().min(1).max(500).optional(),
  date:         z.string().date().optional(),
  receiptUrl:   z.string().url().nullish(),
  notes:        z.string().max(2000).nullish(),
})

// Output: TransactionWithCategory
```

#### `getSpendingSummary`

```typescript
const spendingSummarySchema = z.object({
  month:        z.string().regex(/^\d{4}-\d{2}$/),  // "2026-05"
  groupBy:      z.enum(['category', 'day', 'week']).default('category'),
})

// Output:
interface SpendingSummaryOutput {
  byCategory: CategorySpending[]
  byDay?: { date: string; income: number; expenses: number }[]
  total: {
    income: number
    expenses: number
    net: number
  }
}
```

#### `getMonthlyTrend`

```typescript
// Input: { months: number }  — last N months
// Output:
interface MonthlyTrendOutput {
  data: MonthlyTrendPoint[]  // length === months input
  avgMonthlyIncome: number
  avgMonthlyExpenses: number
  bestMonth: MonthlyTrendPoint
  worstMonth: MonthlyTrendPoint
}
```

#### `createBudget`

```typescript
const createBudgetSchema = z.object({
  categoryId: z.string().cuid(),
  amount:     z.number().positive().max(1_000_000),
  period:     z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  startDate:  z.string().date(),
  endDate:    z.string().date().optional(),
})

// Output: BudgetWithProgress
```

#### `getBudgets`

```typescript
const budgetQuerySchema = z.object({
  period:     z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  month:      z.string().regex(/^\d{4}-\d{2}$/).optional(),  // defaults to current month
  includeStats: z.boolean().default(true),
})

// Output:
interface GetBudgetsOutput {
  budgets: BudgetWithProgress[]
  overview: {
    totalBudgeted: number
    totalSpent: number
    totalRemaining: number
    percentUsed: number
    overBudgetCount: number
  }
}
```

#### `importFromCSV`

```typescript
const csvImportSchema = z.object({
  rows: z.array(z.object({
    date:        z.string(),
    description: z.string(),
    amount:      z.string(),
    type:        z.enum(['INCOME', 'EXPENSE']).optional(),
    category:    z.string().optional(),
  })).max(1000),
  columnMapping: z.object({
    date:        z.string(),    // source column name from CSV header
    description: z.string(),
    amount:      z.string(),
    type:        z.string().optional(),
    category:    z.string().optional(),
  }),
  defaultType:   z.enum(['INCOME', 'EXPENSE']).default('EXPENSE'),
  skipDuplicates: z.boolean().default(true),
})

// Output:
interface CSVImportOutput {
  imported: number
  skipped: number
  duplicates: number
  errors: { row: number; reason: string }[]
  transactions: TransactionWithCategory[]
}
```

#### `getAIInsights`

```typescript
// Input: { month: string }   e.g. "2026-05"
// Output:
interface AIInsightsOutput {
  insights: {
    id: string
    type: 'spending_increase' | 'spending_decrease' | 'budget_suggestion' | 'pattern' | 'anomaly'
    title: string
    detail: string
    severity: 'info' | 'warning' | 'positive'
    relatedCategoryId?: string
    percentageChange?: number
  }[]
  generatedAt: Date
  modelUsed: string
}
```

#### `autoCategorize`

```typescript
// Input: { description: string; amount: number }
// Output:
interface AutoCategorizeOutput {
  categoryId: string
  categoryName: string
  confidence: number      // 0–1
  alternatives: { categoryId: string; categoryName: string; confidence: number }[]
}
```

---

## 7. Charts & Visualizations

### 7.1 Donut Chart — Spending by Category

**Component:** `components/finance/charts/spending-donut.tsx`

```typescript
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SpendingDonutProps {
  data: CategorySpending[]
  onSegmentClick: (categoryId: string) => void
  selectedCategoryId?: string
}

// Behavior:
// - Each segment uses category.color
// - Selected segment is slightly enlarged (outerRadius + 8px)
// - Hovering a segment shows tooltip: "Food · $420 · 32% of spending"
// - Center of donut shows total: "$1,843 total"
// - Legend below chart: color dot + category name + percentage
// - Click on segment calls onSegmentClick → filters transaction list
// - Max 8 categories shown; remainder collapsed into "Other"
// - Entrance animation: segments draw from 0 to full arc over 600ms
```

**Recharts Config:**
```typescript
<ResponsiveContainer width="100%" height={260}>
  <PieChart>
    <Pie
      data={data}
      cx="50%"
      cy="45%"
      innerRadius={70}
      outerRadius={100}
      paddingAngle={2}
      dataKey="total"
      animationBegin={0}
      animationDuration={600}
      onClick={(entry) => onSegmentClick(entry.categoryId)}
    >
      {data.map((entry) => (
        <Cell
          key={entry.categoryId}
          fill={entry.categoryColor}
          opacity={selectedCategoryId && selectedCategoryId !== entry.categoryId ? 0.4 : 1}
          outerRadius={selectedCategoryId === entry.categoryId ? 108 : 100}
        />
      ))}
    </Pie>
    <Tooltip content={<CategoryTooltip />} />
  </PieChart>
</ResponsiveContainer>
```

---

### 7.2 Area Chart — Income vs Expenses (12 months)

**Component:** `components/finance/charts/monthly-trend-chart.tsx`

```typescript
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

// Data shape: MonthlyTrendPoint[]
// Two areas: income (emerald) and expenses (red/rose)
// Areas are semi-transparent (opacity 0.3) with solid border stroke
// XAxis: "Jan", "Feb", ... abbreviated month names
// YAxis: formatted with local currency (compact: "$3k", "$4.5k")
// Hover tooltip: shows month name, income, expenses, net
// Gradient fill: income fades from emerald-500 to transparent bottom
//               expenses fades from rose-500 to transparent bottom
// Entrance: areas animate via strokeDasharray from left to right over 800ms
```

```typescript
<ResponsiveContainer width="100%" height={220}>
  <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
    <defs>
      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
    <XAxis dataKey="month" tickFormatter={formatMonthAbbr} />
    <YAxis tickFormatter={formatCompactCurrency} />
    <Tooltip content={<MonthlyTrendTooltip />} />
    <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGradient)" strokeWidth={2} />
    <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="url(#expenseGradient)" strokeWidth={2} />
  </AreaChart>
</ResponsiveContainer>
```

---

### 7.3 Bar Chart — Budget vs Actual per Category

**Component:** `components/finance/charts/budget-vs-actual-chart.tsx`

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts'

// Two bars per category: Budget (gray outline) and Actual (category color)
// If actual > budget: actual bar rendered in rose-500 (over-budget indication)
// XAxis: category icons + shortened names
// Tooltip: "Food · Budget: $500 · Spent: $420 · Under by: $80"
// Entrance: bars grow from bottom over 500ms staggered per category (100ms delay each)
```

```typescript
interface BudgetBarDatum {
  categoryName: string
  categoryIcon: string
  categoryColor: string
  budget: number
  actual: number
  isOverBudget: boolean
}
```

---

### 7.4 Sparklines — Per-Category Trend (30 days)

**Component:** `components/ui/sparkline.tsx` (shared)

```typescript
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface SparklineProps {
  data: { date: string; total: number }[]
  color: string       // hex color matching category
  height?: number     // default 40px
  showGradient?: boolean
}

// Minimal chart: no axes, no grid, no tooltip
// Used inside BudgetCard and CategoryCard
// Renders a clean area curve showing 30-day trend
```

---

## 8. Transaction Form

### 8.1 Overview

The Transaction Form is used in three contexts:
1. **Quick Add** (slide-over from Dashboard Quick Actions)
2. **Full Add** (from `/finance/transactions` page header)
3. **Edit** (clicking a row in the transaction table opens the same form pre-populated)

### 8.2 Field Specifications

```typescript
// components/finance/transaction-form.tsx
// Uses React Hook Form + Zod

interface TransactionFormValues {
  amount: string              // string for input; converted to number on submit
  type: 'INCOME' | 'EXPENSE'
  categoryId: string
  description: string
  date: string                // "YYYY-MM-DD"
  receiptUrl?: string
  notes?: string
  isRecurring: boolean
  recurring?: {
    frequency: RecurringFrequency
    endDate?: string
  }
}
```

### 8.3 Form Layout (Wireframe)

```
┌─────────────────────────────────────────────────────┐
│ Add Transaction                              [✕]    │
│─────────────────────────────────────────────────────│
│                                                     │
│ TYPE:   [💰 INCOME]  [💳 EXPENSE]   ← toggle       │
│                                                     │
│ AMOUNT:                                             │
│ ┌──────────────────────────────────────────────┐   │
│ │ R$  [       42.50                         ]  │   │
│ │     Large prominent input, auto-focus         │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ CATEGORY:                                           │
│ ┌──────────────────────────────────────────────┐   │
│ │ ☕ Coffee                               [▾] │   │
│ │ — category picker dropdown —                  │   │
│ │ ☕ Coffee    🛒 Food    🏠 Rent   + New       │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ DESCRIPTION:                                        │
│ ┌──────────────────────────────────────────────┐   │
│ │ e.g. "Coffee at Starbucks"                   │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ DATE:                            [Today]            │
│ ┌──────────────────────────────────────────────┐   │
│ │ 2026-05-22               [📅 Pick date]      │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐    │
│ │ 🔁 Recurring?          [○ OFF]              │    │
│ │    — Slide to expand —                       │    │
│ │ (when ON:)                                   │    │
│ │   Frequency: [Monthly ▾]                     │    │
│ │   End date:  [None / pick date]              │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ [▸ Add receipt / notes]    ← expandable section   │
│                                                     │
│           [Cancel]    [Save Transaction]            │
└─────────────────────────────────────────────────────┘
```

### 8.4 Amount Input Behavior

```typescript
// components/finance/transaction-form/amount-input.tsx

// - Large, prominent input (text-4xl font-bold)
// - Formats as local currency on blur (e.g., "42.50" → "R$ 42,50" in pt-BR)
// - Unformats on focus for easy editing
// - Prevents non-numeric input (except decimal separator)
// - Shows currency symbol prefix from user's configured currency
// - Green background tint if type === INCOME; red tint if EXPENSE
```

### 8.5 Category Picker Behavior

```typescript
// components/finance/transaction-form/category-picker.tsx

// - Dropdown with searchable list
// - Filtered to show only categories matching the current `type`
//   (INCOME types show income categories; EXPENSE types show expense categories)
// - Each option shows: colored dot + icon + category name
// - Last item in dropdown: "+ Create new category" → opens inline category creator
// - If AI is configured: shows AI suggestion below the picker:
//   "AI suggests: 🍔 Food (82% confidence)" with a "Use suggestion" button
// - Keyboard: ↑↓ to navigate, Enter to select, type to search
```

### 8.6 Validation Rules

| Field | Rule |
|-------|------|
| Amount | Required, > 0, ≤ 1,000,000 |
| Type | Required, must be INCOME or EXPENSE |
| CategoryId | Required, must be a valid category for the user |
| Description | Required, min 1 char, max 500 chars |
| Date | Required, valid date, not more than 10 years in the past |
| Recurring frequency | Required if isRecurring = true |

### 8.7 Receipt Upload

```typescript
// Receipt upload is optional, shown in the expandable section
// - "Attach receipt" button opens file picker (accepts: image/*, application/pdf)
// - On file select: preview shown inline (thumbnail for images, file name for PDF)
// - Upload happens immediately on file select (Cloudflare R2 via presigned URL)
// - receiptUrl populated automatically after upload
// - Max file size: 5MB
// - On error: toast notification "Upload failed, try again"
```

---

## 9. Budget System

### 9.1 Budget Creation Form

```typescript
// components/finance/budget-form.tsx

interface BudgetFormValues {
  categoryId: string
  amount: string            // converted to number on submit
  period: BudgetPeriod
  startDate: string
  endDate?: string          // optional; if absent, budget is ongoing
}

// Validation:
// - categoryId: must not already have an active budget for the same period
// - amount: > 0, ≤ 1,000,000
// - startDate: defaults to first day of current month
// - endDate: if set, must be > startDate
```

### 9.2 Budget Progress Bar Behavior

```typescript
// components/finance/budget-progress-bar.tsx

interface BudgetProgressBarProps {
  spent: number
  budget: number
  categoryColor: string
}

// Visual states:
// - 0–79%: category color, normal state
// - 80–99%: amber-500, shows "Near limit" badge
// - 100%:   rose-500 (or red), shows "At limit" badge, pulsing dot
// - >100%:  rose-600 with striped overflow section, shows "OVER by $X" badge
//           Bar fills to 100% width; overflow shown as red striped extension

// Pulse animation on ≥100%:
// @keyframes pulse: opacity 1 → 0.6 → 1, 1.5s infinite

// Tooltip on hover: "Spent: $X / Budget: $Y (Z%)"
```

### 9.3 Over-Budget Alerts

```typescript
// When a budget exceeds 100%:
// 1. BudgetCard shows red background tint + "OVER BUDGET" badge
// 2. Dashboard QuickStatCard for expenses shows amber delta badge
// 3. Toast notification fires the first time the threshold is crossed:
//    "⚠ You're over budget for Entertainment this month ($140 / $100)"
// 4. Over-budget categories appear first in the budget list (sorted by severity)

// Alert thresholds (configurable in user preferences):
const BUDGET_THRESHOLDS = {
  nearLimit: 0.80,    // 80%: amber warning
  atLimit: 1.00,      // 100%: red alert
} as const
```

---

## 10. CSV Import

### 10.1 Import Wizard (4 steps)

```
Step 1: Upload
─────────────
┌──────────────────────────────────────────────────────────┐
│ Import Transactions from CSV                [✕]          │
│──────────────────────────────────────────────────────────│
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │          📂 Drop your CSV file here               │  │
│  │           or click to browse                       │  │
│  │                                                    │  │
│  │       Supports: .csv files up to 10MB             │  │
│  │       Max 1,000 rows per import                    │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  💡 Export from your bank's web portal as CSV            │
│     Supported banks: Itaú, Bradesco, Nubank, Inter...    │
└──────────────────────────────────────────────────────────┘

Step 2: Column Mapping
──────────────────────
┌──────────────────────────────────────────────────────────┐
│ Map CSV Columns                           Step 2 of 4   │
│──────────────────────────────────────────────────────────│
│ CSV Preview (first 3 rows):                              │
│  Date      | Description        | Value    | Type        │
│  22/01/2026| STARBUCKS SAO PAULO| -4.50    | DEB         │
│  22/01/2026| SALARY CREDIT      | 3200.00  | CRE         │
│  21/01/2026| SUPERMERCADO EXTRA | -67.30   | DEB         │
│                                                          │
│ Map columns:                                             │
│  Date        → [Date       ▾]                           │
│  Description → [Description▾]                           │
│  Amount      → [Value      ▾]                           │
│  Type        → [Type       ▾]  (DEB=Expense, CRE=Income)│
│  Category    → [Not in CSV ▾]  (AI will auto-assign)   │
│                                                          │
│ Date format: [DD/MM/YYYY ▾]                             │
│ Default type: [Expense ▾] (used when Type column absent)│
│                                                          │
│            [Back]         [Next: Preview]               │
└──────────────────────────────────────────────────────────┘

Step 3: Preview & Review
─────────────────────────
┌──────────────────────────────────────────────────────────┐
│ Review Transactions                       Step 3 of 4   │
│──────────────────────────────────────────────────────────│
│ ✅ 47 ready to import                                    │
│ ⚠  3 potential duplicates (click to review)             │
│ ❌ 2 rows with errors (click to see)                     │
│                                                          │
│ ┌───┬────────────┬──────────────────┬───────────┬──────┐│
│ │ ☑ │ Date       │ Description      │ Category  │  Amt ││
│ ├───┼────────────┼──────────────────┼───────────┼──────┤│
│ │ ☑ │ 22/01/2026 │ Starbucks        │☕ Coffee  │ -4.50││
│ │⚠☑ │ 22/01/2026 │ Salary Credit    │💼 Salary  │3200.0││
│ │ ☑ │ 21/01/2026 │ Supermercado     │🛒 Food    │-67.30││
│ │ ☐ │ 20/01/2026 │ Netflix (DUP)    │📺 Subscr  │-15.90││
│ └───┴────────────┴──────────────────┴───────────┴──────┘│
│                                                          │
│ ⚠ Yellow rows: possible duplicates (uncheck to skip)   │
│ AI auto-categorized 44 of 47 rows                        │
│                                                          │
│            [Back]         [Import Selected (46)]        │
└──────────────────────────────────────────────────────────┘

Step 4: Complete
─────────────────
┌──────────────────────────────────────────────────────────┐
│                    ✅ Import Complete                     │
│                                                          │
│  46 transactions imported                                │
│  3 duplicates skipped                                    │
│  2 rows skipped due to errors                            │
│                                                          │
│  [View Transactions →]    [Import Another File]          │
└──────────────────────────────────────────────────────────┘
```

### 10.2 Duplicate Detection Logic

```typescript
// lib/finance/duplicate-detection.ts

// A transaction is flagged as a potential duplicate if:
// - Same userId
// - Same date (±1 day tolerance for timezone issues)
// - Same amount (exact match)
// - Similar description (Jaro-Winkler similarity > 0.85)

export async function detectDuplicates(
  userId: string,
  incoming: ParsedCSVRow[],
  db: PrismaClient,
): Promise<{ row: ParsedCSVRow; isDuplicate: boolean; matchedId?: string }[]> {
  // 1. Compute importHash for each incoming row
  //    importHash = SHA-256(userId + date + amount.toString() + description.toLowerCase().trim())

  // 2. Bulk query DB for matching importHashes
  //    Also query for amount+date matches to catch non-hash duplicates

  // 3. Return each row annotated with isDuplicate + matchedId
}

// The importHash is also stored on the Transaction model so future imports
// can detect duplicates in O(1) via index lookup.
```

### 10.3 AI Auto-Categorization During Import

```typescript
// After column mapping, before preview:
// For each row where category is unknown:
// - Send batch request to AI: autoCategorize({ description, amount })[]
// - AI uses existing user categories as context
// - Confidence ≥ 0.7: auto-assign, show as accepted
// - Confidence 0.4–0.7: show as "AI suggestion" with dropdown to override
// - Confidence < 0.4: show as "Uncategorized" — user must assign manually

// Batching: max 50 items per AI request; parallel for large imports
// Model used: configured model for 'finance' slot (defaults to fast model like GPT-4o-mini or Haiku)
```

---

## 11. Filters & Search

### 11.1 Filter Bar Component

```typescript
// components/finance/filters/transaction-filter-bar.tsx

interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  categoryIds?: string[]
  type?: 'INCOME' | 'EXPENSE'
  search?: string
  sortBy?: 'date' | 'amount' | 'description' | 'category'
  sortDir?: 'asc' | 'desc'
}
```

### 11.2 Filter Controls

| Control | Component | Behavior |
|---------|-----------|----------|
| Date Range | `DateRangePicker` | Presets: Today, This week, This month, Last month, Custom. Custom: two `<input type="date">` fields. |
| Category Multi-Select | `CategoryMultiSelect` | Dropdown with checkboxes. Each option shows category icon + name. "Select all" / "Clear all" actions. |
| Type Toggle | `ButtonGroup` | Three states: All, Income only, Expense only. |
| Text Search | `Input` with search icon | Debounced 300ms. Searches `description` field. Shows match count. |
| Sort | Column headers in table | Clicking column header cycles: none → asc → desc. Active sort shown with arrow icon. |

### 11.3 URL State Persistence

```typescript
// hooks/use-transaction-filters.ts
// Filters stored in URL search params so state survives refresh and is shareable

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export function useTransactionFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters: TransactionFilters = {
    dateFrom: searchParams.get('from') ?? undefined,
    dateTo: searchParams.get('to') ?? undefined,
    categoryIds: searchParams.get('categories')?.split(',') ?? undefined,
    type: (searchParams.get('type') as TransactionFilters['type']) ?? undefined,
    search: searchParams.get('q') ?? undefined,
    sortBy: (searchParams.get('sort') as TransactionFilters['sortBy']) ?? 'date',
    sortDir: (searchParams.get('dir') as TransactionFilters['sortDir']) ?? 'desc',
  }

  const setFilter = useCallback(
    (key: keyof TransactionFilters, value: string | string[] | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key === 'dateFrom' ? 'from' : key === 'dateTo' ? 'to' : key)
      } else {
        params.set(key === 'dateFrom' ? 'from' : key === 'dateTo' ? 'to' : key,
          Array.isArray(value) ? value.join(',') : value)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  return { filters, setFilter }
}
```

---

## 12. AI Features

### 12.1 Auto-Categorize Transactions

```typescript
// AI categorization system prompt:
const CATEGORIZE_SYSTEM_PROMPT = `
You are a personal finance assistant. Given a transaction description and amount,
classify it into one of the user's existing categories.

User categories: {categories}

Return JSON: { categoryId: string, confidence: number (0-1) }
Be concise. If uncertain, pick the closest match.
`

// Called during:
// 1. Manual entry: suggestion shown below category picker in real-time (debounced 500ms)
// 2. CSV import: bulk categorization in background
// 3. Recurring transaction matching: auto-assign category if template has none
```

### 12.2 Spending Insights

```typescript
// server/services/finance-insights.service.ts

export class FinanceInsightsService {
  async generateInsights(userId: string, month: string): Promise<AIInsightsOutput> {
    // 1. Fetch comparison data: current month + previous month + 3-month average
    const [current, previous, threeMonthAvg] = await Promise.all([
      this.getMonthSummary(userId, month),
      this.getMonthSummary(userId, getPreviousMonth(month)),
      this.getThreeMonthAverage(userId, month),
    ])

    // 2. Compute analytical signals (no AI needed for factual comparisons):
    const signals: AnalyticalSignal[] = [
      ...detectSpendingChanges(current, previous),      // "Food +40%"
      ...detectBudgetStatus(current),                   // "Rent at limit"
      ...detectAnomalies(current, threeMonthAvg),       // "Unusual large purchase"
    ]

    // 3. Send top 5 signals to AI for natural language framing
    const aiResponse = await streamText({
      model: getModelForSlot('finance'),
      system: INSIGHTS_SYSTEM_PROMPT,
      prompt: JSON.stringify(signals),
    })

    return parseInsightsResponse(aiResponse)
  }
}

// Insight types generated:
// spending_increase: "You spent 40% more on Food this month vs January"
// budget_suggestion: "Based on your Coffee spending, a $60 budget fits your habits"
// pattern: "Your electricity bill comes every 28th — consider a reminder"
// anomaly: "An unusually large Entertainment transaction ($300) on May 15"
// positive: "Great job! Your total expenses are 12% lower than last month"
```

### 12.3 Budget Suggestions

```typescript
// AI-powered budget suggestion shown in the budget creation form:
// "Based on your last 3 months, you spend an average of $420/month on Food.
//  Suggested budget: $450/month (+7% buffer)"

// Triggered when user opens "New Budget" for a category that has existing transactions
// Shown as a non-intrusive card below the amount field with "Use this suggestion" button
```

---

## 13. Animations

### 13.1 Number Counters

All financial values (balance, income, expenses) animate from 0 to their actual value on page mount, and from old to new value on data refresh (using `AnimatedNumber` component — same as Dashboard).

```typescript
// For currency values:
<AnimatedNumber
  value={monthlyExpenses}
  format={(v) => formatCurrency(v, userCurrency, userLocale)}
  duration={700}
/>
```

### 13.2 Chart Entrances

| Chart | Animation |
|-------|-----------|
| Donut chart | Segments draw from 0° clockwise, staggered 80ms per segment |
| Area chart | Paths draw left-to-right via `stroke-dashoffset` animation |
| Bar chart | Bars grow from bottom, staggered 60ms per bar group |
| Sparklines | Simple fade-in (no animation — small size makes motion distracting) |

### 13.3 Transaction Row Animations

```typescript
// New transaction added (optimistic update):
// Row appears at top of list with slide-down + fade-in
<motion.tr
  initial={{ opacity: 0, y: -12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>

// Transaction deleted:
<motion.tr
  exit={{ opacity: 0, x: -20, height: 0 }}
  transition={{ duration: 0.2 }}
>

// Wrap table body in <AnimatePresence>
```

### 13.4 Budget Progress Bars

```typescript
// Progress bar fills from 0% to actual percentage on mount:
<motion.div
  className="h-2 rounded-full"
  style={{ backgroundColor: isOverBudget ? '#f43f5e' : categoryColor }}
  initial={{ width: 0 }}
  animate={{ width: `${Math.min(percentUsed, 100)}%` }}
  transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
/>
// Overflow portion animated separately if over 100%:
// Striped red extension animates after the main bar completes
```

### 13.5 Over-Budget Alert Pulse

```typescript
// When a budget is over 100%, the card has a pulsing red border:
<motion.div
  animate={{ borderColor: ['#f43f5e', '#7f1d1d', '#f43f5e'] }}
  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
  className="rounded-xl border-2"
>
```

---

## 14. Edge Cases

### 14.1 Multi-Currency (Basic Support)

```typescript
// The platform stores all amounts as Decimal in the database without a currency field
// on individual transactions. Currency is a user-level preference.

// User preference:
// user.currency: string  = 'BRL'  (default for this user)
// user.locale: string   = 'pt-BR'

// Display: all amounts formatted with user.currency + user.locale
// No automatic conversion between currencies (out of scope v1)
// If user has expenses in multiple currencies, they manually enter the converted amount

// Future v2: add currencyCode field to Transaction model + exchange rate API integration
```

### 14.2 Negative Balance Warning

```typescript
// If totalBalance (all income - all expenses) drops below 0:
// 1. Balance QuickStatCard turns rose-600 background
// 2. A persistent banner appears at the top of the Finance overview:
//    "⚠ Your balance is negative (-$234.50). Review your expenses."
// 3. The banner is dismissible (stored in session, reappears on page reload if still negative)

// Balance is computed as:
// SUM(amount WHERE type=INCOME) - SUM(amount WHERE type=EXPENSE)
// across ALL transactions (not just current month)
```

### 14.3 Duplicate Detection on CSV Import

See Section 10.2 for the full duplicate detection logic.

**Edge cases handled:**
- Same transaction on different dates due to bank timezone vs user timezone: ±1 day tolerance.
- Partial duplicates (same amount, different description): flagged with lower confidence warning.
- Re-importing the same CSV file: all rows detected as duplicates via `importHash` index lookup; user is warned "This file appears to have been imported before."
- Very large imports (>500 rows): processed in chunks of 100; progress bar shown.

### 14.4 Recurring Transaction Edge Cases

```typescript
// If a recurring transaction's next-run date is in the past when the user opens the app:
// - BullMQ worker (or server-side check) creates the missed transaction(s)
// - Max catch-up: 3 missed occurrences; beyond that, user is notified manually
//   "Your recurring 'Netflix' transaction missed 4 runs. Please review."

// If the category of a recurring template is deleted:
// - Recurring transaction is paused automatically
// - User is notified: "Recurring transaction 'Netflix' paused: category was deleted"
// - User must reassign the category to resume

// If isRecurring is toggled off on an existing recurring transaction:
// - The RecurringTransaction record is soft-deleted (isActive = false)
// - Past generated transactions are not affected
```

### 14.5 CSV Import Errors

| Error Type | Handling |
|------------|----------|
| Invalid date format | Row flagged as error; suggestion shown: "Did you mean DD/MM/YYYY?" |
| Amount is text | Row flagged; attempt to parse "R$ 42,50" → 42.50 |
| Empty description | Row imported with description "(no description)" |
| Amount = 0 | Row skipped with error: "Zero-amount transactions not allowed" |
| Missing required column | Import blocked at step 2; clear error message |

---

## 15. Testing

### 15.1 Unit Tests — Calculation Logic (Vitest)

```typescript
// tests/unit/finance/calculations.test.ts
import { describe, it, expect } from 'vitest'
import {
  computeBudgetProgress,
  detectDuplicates,
  formatCurrency,
  parseCSVAmount,
  computeMonthlyTrend,
  computeCategorySpending,
} from '@/lib/finance/calculations'

describe('computeBudgetProgress', () => {
  it('calculates percentage correctly', () => {
    const result = computeBudgetProgress({ spent: 420, budget: 500 })
    expect(result.percentUsed).toBe(84)
    expect(result.remaining).toBe(80)
    expect(result.isOverBudget).toBe(false)
    expect(result.isNearLimit).toBe(true)  // 84% >= 80%
  })

  it('flags over budget correctly', () => {
    const result = computeBudgetProgress({ spent: 140, budget: 100 })
    expect(result.percentUsed).toBe(140)
    expect(result.isOverBudget).toBe(true)
    expect(result.remaining).toBe(-40)
  })

  it('handles zero budget without dividing by zero', () => {
    const result = computeBudgetProgress({ spent: 0, budget: 0 })
    expect(result.percentUsed).toBe(0)
    expect(result.isOverBudget).toBe(false)
  })
})

describe('parseCSVAmount', () => {
  it('parses Brazilian real format', () => {
    expect(parseCSVAmount('R$ 1.234,56')).toBe(1234.56)
    expect(parseCSVAmount('42,50')).toBe(42.5)
    expect(parseCSVAmount('-67,30')).toBe(-67.3)
  })

  it('parses US dollar format', () => {
    expect(parseCSVAmount('$1,234.56')).toBe(1234.56)
    expect(parseCSVAmount('42.50')).toBe(42.5)
  })

  it('returns null for non-parseable values', () => {
    expect(parseCSVAmount('N/A')).toBeNull()
    expect(parseCSVAmount('')).toBeNull()
  })
})

describe('computeCategorySpending', () => {
  it('calculates percentage of total correctly', () => {
    const transactions = [
      { categoryId: 'cat1', amount: 420, type: 'EXPENSE' },
      { categoryId: 'cat2', amount: 800, type: 'EXPENSE' },
      { categoryId: 'cat3', amount: 3200, type: 'INCOME' },  // excluded from expense calc
    ]
    const result = computeCategorySpending(transactions)
    const food = result.find((c) => c.categoryId === 'cat1')!
    expect(food.percentage).toBeCloseTo(34.43, 1)   // 420 / (420+800) * 100
  })
})

describe('detectDuplicates', () => {
  it('flags exact match as duplicate', async () => {
    // Mock existing transaction: 2026-01-22, $4.50, "starbucks"
    const existing = [{ date: '2026-01-22', amount: 4.50, description: 'starbucks' }]
    const incoming = [{ date: '2026-01-22', amount: 4.50, description: 'STARBUCKS SAO PAULO' }]
    const result = await detectDuplicates('user1', incoming, mockDb(existing))
    expect(result[0]!.isDuplicate).toBe(true)
  })

  it('does not flag different amounts as duplicates', async () => {
    const existing = [{ date: '2026-01-22', amount: 4.50, description: 'starbucks' }]
    const incoming = [{ date: '2026-01-22', amount: 8.00, description: 'starbucks' }]
    const result = await detectDuplicates('user1', incoming, mockDb(existing))
    expect(result[0]!.isDuplicate).toBe(false)
  })
})
```

### 15.2 Integration Tests — CRUD Operations

```typescript
// tests/integration/finance/transactions.test.ts
import { createCaller } from '@/lib/trpc/server'
import { createTestUser, cleanupTestUser } from '@/tests/helpers'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('finance.createTransaction', () => {
  let userId: string
  let caller: ReturnType<typeof createCaller>

  beforeAll(async () => {
    userId = await createTestUser()
    caller = createCaller({ session: { user: { id: userId } } })
  })

  afterAll(async () => {
    await cleanupTestUser(userId)
  })

  it('creates an expense transaction and returns it with category', async () => {
    const category = await caller.finance.createCategory({
      name: 'Test Food', color: '#ff0000', icon: 'utensils', type: 'EXPENSE',
    })

    const result = await caller.finance.createTransaction({
      amount: 42.5,
      type: 'EXPENSE',
      categoryId: category.id,
      description: 'Test grocery',
      date: '2026-05-22',
      isRecurring: false,
    })

    expect(result.id).toBeDefined()
    expect(result.amount.toNumber()).toBe(42.5)
    expect(result.category.name).toBe('Test Food')
    expect(result.type).toBe('EXPENSE')
  })

  it('creates a recurring transaction and RecurringTransaction record', async () => {
    const category = await caller.finance.createCategory({ ... })
    const result = await caller.finance.createTransaction({
      amount: 15.9,
      type: 'EXPENSE',
      categoryId: category.id,
      description: 'Netflix',
      date: '2026-05-22',
      isRecurring: true,
      recurring: { frequency: 'MONTHLY' },
    })

    expect(result.isRecurring).toBe(true)
    expect(result.recurringTransactionId).toBeDefined()
  })

  it('throws if amount is 0', async () => {
    await expect(
      caller.finance.createTransaction({ amount: 0, ... }),
    ).rejects.toThrow(/positive/)
  })

  it('throws if category belongs to another user', async () => {
    const otherUserId = await createTestUser()
    const otherCaller = createCaller({ session: { user: { id: otherUserId } } })
    const otherCategory = await otherCaller.finance.createCategory({ ... })

    await expect(
      caller.finance.createTransaction({ categoryId: otherCategory.id, ... }),
    ).rejects.toThrow()
  })
})

describe('finance.getBudgets', () => {
  it('returns budget with computed spent and remaining', async () => {
    // Create budget + matching transactions, then fetch
    const category = await caller.finance.createCategory({ ... })
    await caller.finance.createBudget({
      categoryId: category.id, amount: 100, period: 'MONTHLY', startDate: '2026-05-01',
    })
    await caller.finance.createTransaction({
      amount: 42, type: 'EXPENSE', categoryId: category.id,
      description: 'Test', date: '2026-05-15', isRecurring: false,
    })

    const { budgets } = await caller.finance.getBudgets({ period: 'MONTHLY', month: '2026-05' })
    const budget = budgets.find((b) => b.categoryId === category.id)!

    expect(budget.spent).toBe(42)
    expect(budget.remaining).toBe(58)
    expect(budget.percentUsed).toBe(42)
    expect(budget.isOverBudget).toBe(false)
  })
})
```

### 15.3 E2E Tests — Full Transaction Flow (Playwright)

```typescript
// tests/e2e/finance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Finance Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finance')
  })

  test('overview page loads with summary stats', async ({ page }) => {
    await expect(page.getByTestId('stat-balance')).toBeVisible()
    await expect(page.getByTestId('stat-income')).toBeVisible()
    await expect(page.getByTestId('stat-expenses')).toBeVisible()
    await expect(page.getByTestId('chart-donut')).toBeVisible()
    await expect(page.getByTestId('chart-monthly-trend')).toBeVisible()
  })

  test('full transaction add flow', async ({ page }) => {
    await page.goto('/finance/transactions')
    await page.getByRole('button', { name: /add/i }).click()

    // Form opens
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill form
    await page.getByLabel(/type/i).getByText('Expense').click()
    await page.getByLabel(/amount/i).fill('42.50')
    await page.getByLabel(/category/i).click()
    await page.getByRole('option', { name: /food/i }).click()
    await page.getByLabel(/description/i).fill('E2E test grocery')
    // Date defaults to today

    // Submit
    await page.getByRole('button', { name: /save/i }).click()

    // Form closes and new row appears
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByText('E2E test grocery')).toBeVisible()
    await expect(page.getByText('-$42.50')).toBeVisible()
  })

  test('filter by category updates transaction list', async ({ page }) => {
    await page.goto('/finance/transactions')
    const initialCount = await page.getByRole('row').count()

    await page.getByTestId('filter-categories').click()
    await page.getByRole('option', { name: /coffee/i }).click()
    await page.keyboard.press('Escape')

    // List should have fewer items
    const filteredCount = await page.getByRole('row').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)

    // URL should reflect filter
    expect(page.url()).toContain('categories=')
  })

  test('budget creation and over-budget alert', async ({ page }) => {
    await page.goto('/finance/budgets')
    await page.getByRole('button', { name: /new budget/i }).click()

    await page.getByLabel(/category/i).click()
    await page.getByRole('option', { name: /entertainment/i }).click()
    await page.getByLabel(/amount/i).fill('10')  // set very low to trigger over-budget
    await page.getByRole('button', { name: /save/i }).click()

    // If there are existing entertainment transactions > $10, over-budget badge should show
    await expect(page.getByTestId('over-budget-badge')).toBeVisible()
  })

  test('CSV import wizard completes successfully', async ({ page }) => {
    await page.goto('/finance/transactions')
    await page.getByRole('button', { name: /import csv/i }).click()

    // Step 1: Upload
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./tests/fixtures/sample-transactions.csv')

    // Step 2: Column mapping (auto-detected)
    await expect(page.getByText('Map CSV Columns')).toBeVisible()
    await page.getByRole('button', { name: /next/i }).click()

    // Step 3: Preview
    await expect(page.getByText('Review Transactions')).toBeVisible()
    const importBtn = page.getByRole('button', { name: /import/i })
    await expect(importBtn).toBeVisible()
    await importBtn.click()

    // Step 4: Complete
    await expect(page.getByText(/import complete/i)).toBeVisible()
    await expect(page.getByText(/transactions imported/i)).toBeVisible()
  })

  test('donut chart segment click filters transactions', async ({ page }) => {
    await page.goto('/finance')

    // Click a donut segment
    const donutChart = page.getByTestId('chart-donut')
    await donutChart.locator('[data-category="food"]').click()

    // Should navigate to transactions with category filter
    await expect(page).toHaveURL(/\/finance\/transactions.*categories=/)
  })
})
```

---

## 16. Components List

### Finance Overview Page

| Component | File Path |
|-----------|-----------|
| `FinanceOverviewPage` | `app/(dashboard)/finance/page.tsx` |
| `FinanceSummaryStats` | `components/finance/finance-summary-stats.tsx` |
| `SpendingDonutChart` | `components/finance/charts/spending-donut.tsx` |
| `MonthlyTrendChart` | `components/finance/charts/monthly-trend-chart.tsx` |
| `BudgetHealthBar` | `components/finance/budget-health-bar.tsx` |
| `AIInsightsPanel` | `components/finance/ai-insights-panel.tsx` |
| `RecentTransactionsList` | `components/finance/recent-transactions-list.tsx` |

### Transactions Page

| Component | File Path |
|-----------|-----------|
| `TransactionsPage` | `app/(dashboard)/finance/transactions/page.tsx` |
| `TransactionFilterBar` | `components/finance/filters/transaction-filter-bar.tsx` |
| `DateRangePicker` | `components/ui/date-range-picker.tsx` |
| `CategoryMultiSelect` | `components/finance/filters/category-multi-select.tsx` |
| `TransactionTable` | `components/finance/transaction-table.tsx` |
| `TransactionRow` | `components/finance/transaction-row.tsx` |
| `TransactionForm` | `components/finance/transaction-form.tsx` |
| `AmountInput` | `components/finance/transaction-form/amount-input.tsx` |
| `CategoryPicker` | `components/finance/transaction-form/category-picker.tsx` |
| `RecurringToggle` | `components/finance/transaction-form/recurring-toggle.tsx` |
| `CSVImportWizard` | `components/finance/csv-import/csv-import-wizard.tsx` |
| `CSVUploadStep` | `components/finance/csv-import/csv-upload-step.tsx` |
| `CSVColumnMapper` | `components/finance/csv-import/csv-column-mapper.tsx` |
| `CSVPreviewStep` | `components/finance/csv-import/csv-preview-step.tsx` |
| `CSVCompleteStep` | `components/finance/csv-import/csv-complete-step.tsx` |

### Budgets Page

| Component | File Path |
|-----------|-----------|
| `BudgetsPage` | `app/(dashboard)/finance/budgets/page.tsx` |
| `BudgetOverviewStrip` | `components/finance/budget-overview-strip.tsx` |
| `BudgetCard` | `components/finance/budget-card.tsx` |
| `BudgetProgressBar` | `components/finance/budget-progress-bar.tsx` |
| `BudgetForm` | `components/finance/budget-form.tsx` |
| `BudgetVsActualChart` | `components/finance/charts/budget-vs-actual-chart.tsx` |

### Shared

| Component | File Path |
|-----------|-----------|
| `Sparkline` | `components/ui/sparkline.tsx` |
| `AnimatedNumber` | `components/ui/animated-number.tsx` |
| `CategoryBadge` | `components/finance/category-badge.tsx` |
| `TransactionTypeBadge` | `components/finance/transaction-type-badge.tsx` |
| `CategoryCreatorInline` | `components/finance/category-creator-inline.tsx` |

---

## 17. State Management

### 17.1 Zustand Store — `useFinanceStore`

```typescript
// stores/finance-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FinanceState {
  // Active filters (synced with URL but also kept here for non-URL contexts)
  activeFilters: TransactionFilters
  setFilter: (key: keyof TransactionFilters, value: unknown) => void
  clearFilters: () => void

  // UI state
  isTransactionFormOpen: boolean
  editingTransactionId: string | null
  openTransactionForm: (transactionId?: string) => void
  closeTransactionForm: () => void

  isCSVImportOpen: boolean
  openCSVImport: () => void
  closeCSVImport: () => void

  // Budget period selection
  budgetPeriod: BudgetPeriod
  budgetMonth: string           // "2026-05"
  setBudgetPeriod: (period: BudgetPeriod) => void
  setBudgetMonth: (month: string) => void

  // Donut chart selection
  selectedCategoryId: string | null
  setSelectedCategory: (id: string | null) => void
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      activeFilters: {},
      setFilter: (key, value) =>
        set((s) => ({ activeFilters: { ...s.activeFilters, [key]: value } })),
      clearFilters: () => set({ activeFilters: {} }),
      isTransactionFormOpen: false,
      editingTransactionId: null,
      openTransactionForm: (id) =>
        set({ isTransactionFormOpen: true, editingTransactionId: id ?? null }),
      closeTransactionForm: () =>
        set({ isTransactionFormOpen: false, editingTransactionId: null }),
      isCSVImportOpen: false,
      openCSVImport: () => set({ isCSVImportOpen: true }),
      closeCSVImport: () => set({ isCSVImportOpen: false }),
      budgetPeriod: 'MONTHLY',
      budgetMonth: getCurrentMonth(),
      setBudgetPeriod: (period) => set({ budgetPeriod: period }),
      setBudgetMonth: (month) => set({ budgetMonth: month }),
      selectedCategoryId: null,
      setSelectedCategory: (id) => set({ selectedCategoryId: id }),
    }),
    { name: 'finance-store', version: 1,
      partialize: (s) => ({
        budgetPeriod: s.budgetPeriod,  // persist period preference
      }),
    },
  ),
)
```

### 17.2 TanStack Query Keys

```typescript
export const financeQueryKeys = {
  all: ['finance'] as const,
  transactions: {
    all: () => [...financeQueryKeys.all, 'transactions'] as const,
    list: (filters: TransactionFilters) => [...financeQueryKeys.transactions.all(), filters] as const,
    detail: (id: string) => [...financeQueryKeys.transactions.all(), id] as const,
    recent: (limit: number) => [...financeQueryKeys.transactions.all(), 'recent', limit] as const,
    sparkline: (days: number) => [...financeQueryKeys.transactions.all(), 'sparkline', days] as const,
  },
  categories: {
    all: () => [...financeQueryKeys.all, 'categories'] as const,
  },
  budgets: {
    all: () => [...financeQueryKeys.all, 'budgets'] as const,
    list: (opts: BudgetQueryOpts) => [...financeQueryKeys.budgets.all(), opts] as const,
  },
  summary: {
    balance: () => [...financeQueryKeys.all, 'balance'] as const,
    spending: (month: string) => [...financeQueryKeys.all, 'spending', month] as const,
    trend: (months: number) => [...financeQueryKeys.all, 'trend', months] as const,
  },
  insights: (month: string) => [...financeQueryKeys.all, 'insights', month] as const,
} as const

// Refresh strategy:
// - balance: staleTime: 0, refetchOnWindowFocus: true
// - transactions.list: staleTime: 30_000
// - budgets.list: staleTime: 60_000
// - insights: staleTime: 300_000 (5 min — AI calls are expensive)
// - trend: staleTime: 300_000 (historical data changes rarely)
```

---

## 18. Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| Finance overview LCP | < 1.5s | RSC fetches all chart data server-side in parallel |
| Transaction list render | < 200ms | TanStack Table with `react-virtual` for rows > 100 |
| CSV import (1000 rows) | < 3s parse + preview | Parsed client-side with Web Worker; batched server import |
| Chart render | < 100ms after data | Recharts with `isAnimationActive` skipped on re-renders, only on mount |
| Filter apply | < 300ms | URL update triggers refetch; TanStack Query cache hit on same filter set |
| Bundle size | < 150KB for finance module | D3 (used by Recharts) lazy-loaded; no import of full D3 |

### RSC Pattern (Finance Overview)

```typescript
// app/(dashboard)/finance/page.tsx — RSC
export default async function FinancePage() {
  const caller = await createCaller()
  const currentMonth = getCurrentMonth()

  const [summary, spendingSummary, monthlyTrend, budgets, recentTransactions, insights] =
    await Promise.all([
      caller.finance.getAccountBalance(),
      caller.finance.getSpendingSummary({ month: currentMonth, groupBy: 'category' }),
      caller.finance.getMonthlyTrend({ months: 12 }),
      caller.finance.getBudgets({ period: 'MONTHLY', month: currentMonth }),
      caller.finance.getRecentTransactions({ limit: 5 }),
      caller.finance.getAIInsights({ month: currentMonth })
        .catch(() => null),  // Non-blocking: AI insights can fail gracefully
    ])

  return (
    <FinanceOverviewClient
      initialData={{ summary, spendingSummary, monthlyTrend, budgets, recentTransactions, insights }}
    />
  )
}
```

### Virtualized Transaction Table

```typescript
// For the transactions page, if there are more than 100 rows,
// TanStack Virtual handles row virtualization:

import { useVirtualizer } from '@tanstack/react-virtual'

// This prevents DOM overload on large transaction histories
// Only renders ~15-20 rows in the DOM at any time
// Smooth scroll maintained with proper itemSize calculation
```

---

*Last updated: 2026-05-22 | Version: 1.0.0*
