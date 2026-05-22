# Mission Control — Testing Strategy Specification

## 1. Testing Philosophy

> **"Test behavior, not implementation. Every test should answer: does this work for the user?"**

Tests are written for confidence, not coverage metrics. We prioritize:
1. **Critical path E2E tests** — the flows that must never break
2. **Business logic unit tests** — calculation, validation, state machines
3. **Integration tests** — API procedures working with real DB
4. **Skip**: testing framework internals, trivial getters/setters

**Coverage target**: 80% lines for `lib/` and `services/`, not enforced on UI components.

---

## 2. Test Stack

| Layer | Tool | Config |
|-------|------|--------|
| Unit + Integration | Vitest 2 | `vitest.config.ts` |
| React components | React Testing Library | `@testing-library/react` |
| E2E | Playwright 1.45+ | `playwright.config.ts` |
| API mocking | MSW 2 (Mock Service Worker) | For component tests |
| DB testing | Prisma + test database | Isolated test DB |
| Fixtures | Vitest `@faker-js/faker` | Realistic test data |
| Snapshot | Vitest built-in | UI regression |

---

## 3. Test File Conventions

```
tests/
├── unit/
│   ├── lib/
│   │   ├── finance.calculations.test.ts
│   │   ├── recurrence.test.ts
│   │   ├── scraper-schedule.test.ts
│   │   └── ai-cost-calculator.test.ts
│   ├── components/
│   │   ├── TransactionForm.test.tsx
│   │   ├── BudgetProgress.test.tsx
│   │   └── RecipeCard.test.tsx
│   └── utils/
│       ├── date.test.ts
│       └── encryption.test.ts
│
├── integration/
│   ├── trpc/
│   │   ├── finance.router.test.ts
│   │   ├── reminders.router.test.ts
│   │   ├── jobs.router.test.ts
│   │   └── agent.router.test.ts
│   └── scrapers/
│       ├── price-scraper.test.ts
│       └── job-scraper.test.ts
│
└── e2e/
    ├── auth.spec.ts
    ├── finance-flow.spec.ts
    ├── shopping-flow.spec.ts
    ├── reminder-flow.spec.ts
    ├── agent-session.spec.ts
    └── garage-control.spec.ts
```

**Naming convention**: `[subject].[type].test.ts` for unit, `[module].router.test.ts` for integration, `[flow].spec.ts` for E2E.

---

## 4. Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**', 'services/**'],
      exclude: ['lib/db/**', '**/*.d.ts'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
    pool: 'forks', // isolate DB tests
  },
});
```

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { resetTestDb, seedTestDb } from './helpers/db';

beforeAll(async () => {
  await resetTestDb();
  await seedTestDb();
});

beforeEach(async () => {
  // Reset to clean state between tests if needed
});
```

---

## 5. Unit Tests — Business Logic

### 5.1 Finance Calculations

```typescript
// tests/unit/lib/finance.calculations.test.ts

describe('getBudgetProgress', () => {
  it('returns 0% when no transactions in period', () => {
    const result = getBudgetProgress({
      budget: { amount: 1000, period: 'MONTHLY' },
      transactions: [],
      date: new Date('2026-05-01'),
    });
    expect(result).toEqual({ spent: 0, percentage: 0, isOverBudget: false });
  });

  it('returns correct percentage for partial spend', () => {
    const result = getBudgetProgress({
      budget: { amount: 1000, period: 'MONTHLY' },
      transactions: [{ amount: 400 }, { amount: 250 }],
      date: new Date('2026-05-15'),
    });
    expect(result.percentage).toBe(65);
    expect(result.isOverBudget).toBe(false);
  });

  it('flags over-budget correctly', () => {
    const result = getBudgetProgress({
      budget: { amount: 500, period: 'MONTHLY' },
      transactions: [{ amount: 600 }],
      date: new Date('2026-05-01'),
    });
    expect(result.isOverBudget).toBe(true);
    expect(result.percentage).toBe(120);
  });
});

describe('groupTransactionsByCategory', () => {
  it('groups correctly with multiple categories', () => { ... });
  it('handles transactions without category', () => { ... });
  it('calculates totals correctly', () => { ... });
});

describe('calculateMonthlyTrend', () => {
  it('returns 12 months of data', () => { ... });
  it('fills missing months with zero', () => { ... });
});
```

### 5.2 Recurrence Calculations

```typescript
// tests/unit/lib/recurrence.test.ts

describe('getNextOccurrence', () => {
  it('returns next day for daily recurrence', () => {
    const next = getNextOccurrence({
      frequency: 'DAILY',
      interval: 1,
      from: new Date('2026-05-22'),
    });
    expect(next).toEqual(new Date('2026-05-23'));
  });

  it('skips weekends for weekday-only recurrence', () => { ... });
  it('handles monthly recurrence crossing month boundaries', () => { ... });
  it('respects until date (returns null when past until)', () => { ... });
  it('handles count limit (returns null when count reached)', () => { ... });
  it('handles "last day of month" correctly', () => { ... });
});

describe('getOccurrencesInRange', () => {
  it('returns all occurrences within date range', () => { ... });
  it('excludes exDates', () => { ... });
  it('handles infinite recurrence with range limit', () => { ... });
});
```

### 5.3 Agentic Loop State Machine

```typescript
// tests/unit/lib/agent-loop.test.ts

describe('AgentLoop', () => {
  const mockLLM = createMockLLM();
  const mockTools = createMockToolRegistry();

  it('returns text response when no tool calls', async () => {
    mockLLM.mockResponse({ type: 'text', content: 'Hello!' });
    const result = await runAgentLoop({
      llm: mockLLM,
      tools: mockTools,
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    expect(result.type).toBe('text');
    expect(result.content).toBe('Hello!');
    expect(result.iterations).toBe(1);
  });

  it('executes tool calls and feeds results back', async () => {
    mockLLM
      .mockResponse({ type: 'tool_use', tool: 'readFile', input: { path: '/foo.ts' } })
      .mockResponse({ type: 'text', content: 'File contains X' });
    mockTools.register('readFile', async () => 'file contents here');

    const result = await runAgentLoop({ llm: mockLLM, tools: mockTools, messages: [...] });
    expect(result.iterations).toBe(2);
    expect(mockTools.calls()).toHaveLength(1);
  });

  it('stops at max iterations and returns error', async () => {
    mockLLM.alwaysRespond({ type: 'tool_use', tool: 'readFile', input: {} });
    const result = await runAgentLoop({
      llm: mockLLM, tools: mockTools, messages: [...], maxIterations: 5,
    });
    expect(result.type).toBe('error');
    expect(result.reason).toBe('max_iterations');
  });

  it('handles tool execution errors gracefully', async () => { ... });
  it('respects safe mode and skips dangerous tools without approval', async () => { ... });
});
```

### 5.4 Encryption

```typescript
// tests/unit/utils/encryption.test.ts

describe('encryptApiKey / decryptApiKey', () => {
  it('round-trips correctly', () => {
    const original = 'sk-ant-api03-XXXX';
    const encrypted = encryptApiKey(original);
    expect(encrypted).not.toBe(original);
    expect(decryptApiKey(encrypted)).toBe(original);
  });

  it('different encryptions of same value are different (IV randomness)', () => {
    const enc1 = encryptApiKey('same-key');
    const enc2 = encryptApiKey('same-key');
    expect(enc1).not.toBe(enc2);
    expect(decryptApiKey(enc1)).toBe(decryptApiKey(enc2));
  });

  it('throws on tampered ciphertext', () => {
    expect(() => decryptApiKey('corrupted')).toThrow();
  });
});
```

---

## 6. Integration Tests — tRPC Routers

Integration tests use a real test database (separate from dev, reset between test suites).

### 6.1 Finance Router

```typescript
// tests/integration/trpc/finance.router.test.ts

describe('finance router', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestContext(); // creates user, authenticated session
  });

  describe('getTransactions', () => {
    it('returns empty array for new user', async () => {
      const result = await ctx.caller.finance.getTransactions({
        page: 1, pageSize: 20,
      });
      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('filters by date range', async () => {
      await seedTransactions(ctx.userId, [
        { date: '2026-05-01', amount: 100 },
        { date: '2026-04-15', amount: 200 },
      ]);
      const result = await ctx.caller.finance.getTransactions({
        dateRange: { from: '2026-05-01', to: '2026-05-31' },
      });
      expect(result.transactions).toHaveLength(1);
    });

    it('throws UNAUTHORIZED without session', async () => {
      const unauthCtx = await createUnauthContext();
      await expect(unauthCtx.caller.finance.getTransactions({}))
        .rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('createTransaction', () => {
    it('creates transaction and returns it', async () => {
      const input = {
        amount: 85.50,
        type: 'EXPENSE' as const,
        description: 'Supermercado',
        date: '2026-05-22',
      };
      const result = await ctx.caller.finance.createTransaction(input);
      expect(result.amount.toNumber()).toBe(85.50);
      expect(result.userId).toBe(ctx.userId);
    });

    it('validates amount is positive', async () => {
      await expect(ctx.caller.finance.createTransaction({
        amount: -50,
        type: 'EXPENSE',
        description: 'Test',
        date: '2026-05-22',
      })).rejects.toThrow();
    });

    it('does not create transaction for another user', async () => { ... });
  });
});
```

### 6.2 Scraper Integration (Mocked Playwright)

```typescript
// tests/integration/scrapers/price-scraper.test.ts

describe('PriceScraper', () => {
  beforeEach(() => {
    vi.mock('playwright', () => createPlaywrightMock());
  });

  it('extracts prices from mock HTML', async () => {
    setupPlaywrightMock({
      url: 'https://www.mercadolivre.com.br/...',
      html: `<span class="price-tag-fraction">89</span>
             <span class="price-tag-cents">90</span>`,
    });

    const result = await scrapePrices({ itemName: 'arroz 1kg', stores: ['mercadolivre'] });
    expect(result).toHaveLength(1);
    expect(result[0].price).toBe(89.90);
    expect(result[0].storeName).toBe('Mercado Livre');
  });

  it('handles scraper timeout gracefully', async () => {
    setupPlaywrightMock({ delay: 35000 }); // exceeds 30s timeout
    const result = await scrapePrices({ itemName: 'test', stores: ['mercadolivre'] });
    expect(result).toHaveLength(0);
  });

  it('respects rate limiting between requests', async () => { ... });
});
```

---

## 7. Playwright E2E Tests

### 7.1 Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,      // sequential for auth stability
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    storageState: 'tests/e2e/auth.json', // saved login state
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: '**/setup.spec.ts' },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
      dependencies: ['setup'],
    },
  ],
});
```

### 7.2 Auth Setup (Global)

```typescript
// tests/e2e/setup.spec.ts

test('authenticate', async ({ page }) => {
  // Use test credentials that bypass Google OAuth in test env
  await page.goto('/api/auth/test-signin');
  await page.waitForURL('/');
  await page.context().storageState({ path: 'tests/e2e/auth.json' });
});
```

### 7.3 Critical Path: Finance Flow

```typescript
// tests/e2e/finance-flow.spec.ts

test.describe('Finance Module', () => {
  test('user can add and view a transaction', async ({ page }) => {
    await page.goto('/finance');
    await expect(page.getByRole('heading', { name: 'Finance' })).toBeVisible();

    // Open add transaction dialog
    await page.getByRole('button', { name: 'Add Transaction' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill form
    await page.getByLabel('Amount').fill('125.50');
    await page.getByLabel('Description').fill('Supermercado Extra');
    await page.getByRole('button', { name: 'Expense' }).click(); // type toggle
    await page.getByLabel('Category').click();
    await page.getByRole('option', { name: 'Alimentação' }).click();

    // Submit
    await page.getByRole('button', { name: 'Save' }).click();

    // Verify transaction appears
    await expect(page.getByText('Supermercado Extra')).toBeVisible();
    await expect(page.getByText('R$ 125,50')).toBeVisible();
  });

  test('budget alert shows when over 80%', async ({ page }) => { ... });
  test('CSV import creates multiple transactions', async ({ page }) => { ... });
  test('charts update after adding transaction', async ({ page }) => { ... });
  test('transaction filter by date range works', async ({ page }) => { ... });
});
```

### 7.4 Critical Path: Reminder + Push Notification

```typescript
// tests/e2e/reminder-flow.spec.ts

test.describe('Reminders', () => {
  test('creates a reminder with recurrence', async ({ page }) => {
    await page.goto('/reminders');
    await page.getByRole('button', { name: 'New Reminder' }).click();

    await page.getByLabel('Title').fill('Weekly report');
    await page.getByLabel('Due date').fill('2026-05-25');
    await page.getByLabel('Repeat').click();
    await page.getByRole('option', { name: 'Weekly' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Weekly report')).toBeVisible();
    await expect(page.getByText('Repeats weekly')).toBeVisible();
  });

  test('snooze moves reminder to future time', async ({ page }) => { ... });
  test('completing reminder removes it from active list', async ({ page }) => { ... });
});
```

### 7.5 Critical Path: Agent Session

```typescript
// tests/e2e/agent-session.spec.ts

test.describe('Agent Module', () => {
  test('sends a message and receives streamed response', async ({ page }) => {
    await page.goto('/agent');

    // Type message
    await page.getByPlaceholder('Message the agent...').fill('What is 2 + 2?');
    await page.keyboard.press('Enter');

    // Wait for streaming response
    const responseEl = page.locator('[data-testid="agent-response"]').last();
    await expect(responseEl).toContainText('4', { timeout: 15000 });
  });

  test('tool call is shown in trace panel', async ({ page }) => { ... });
  test('cancel stops ongoing agent task', async ({ page }) => { ... });
  test('connecting MCP server shows its tools', async ({ page }) => { ... });
});
```

### 7.6 Critical Path: Garage Door

```typescript
// tests/e2e/garage-control.spec.ts

test.describe('Smart Home — Garage Door', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the garage API
    await page.route('**/api/trpc/smarthome.getDeviceState*', async (route) => {
      await route.fulfill({ json: { state: 'closed', battery: 85 } });
    });
  });

  test('shows closed state and open button', async ({ page }) => {
    await page.goto('/smarthome');
    await expect(page.getByText('Closed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open' })).toBeVisible();
  });

  test('open button shows confirmation dialog', async ({ page }) => {
    await page.goto('/smarthome');
    await page.getByRole('button', { name: 'Open' }).click();
    await expect(page.getByRole('dialog', { name: 'Open garage?' })).toBeVisible();
    await expect(page.getByText('Are you sure you want to open')).toBeVisible();
  });
});
```

---

## 8. Component Tests

```typescript
// tests/unit/components/BudgetProgress.test.tsx

describe('BudgetProgress', () => {
  it('renders correct percentage', () => {
    render(<BudgetProgress budget={1000} spent={650} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '65');
    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('shows warning color when over 80%', () => {
    render(<BudgetProgress budget={1000} spent={850} />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-warning');
  });

  it('shows error color when over budget', () => {
    render(<BudgetProgress budget={1000} spent={1100} />);
    expect(screen.getByRole('progressbar')).toHaveClass('bg-error');
    expect(screen.getByText('Over budget')).toBeInTheDocument();
  });
});
```

---

## 9. Test Utilities & Helpers

```typescript
// tests/helpers/db.ts
export async function createTestContext(overrides?: Partial<User>) {
  const user = await db.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      ...overrides,
    },
  });
  const session = await createTestSession(user.id);
  const caller = appRouter.createCaller({ session, db, services });
  return { user, userId: user.id, session, caller };
}

// tests/helpers/fixtures.ts
export const transactionFactory = {
  build: (overrides?: Partial<Transaction>): CreateTransactionInput => ({
    amount: faker.number.float({ min: 5, max: 5000, fractionDigits: 2 }),
    type: 'EXPENSE',
    description: faker.commerce.product(),
    date: faker.date.recent().toISOString().split('T')[0]!,
    ...overrides,
  }),
  buildMany: (count: number, overrides?: Partial<Transaction>) =>
    Array.from({ length: count }, () => transactionFactory.build(overrides)),
};

// tests/helpers/mocks.ts
export function createMockLLM() {
  const responses: AIResponse[] = [];
  return {
    mockResponse: (r: AIResponse) => { responses.push(r); return this; },
    alwaysRespond: (r: AIResponse) => { /* infinite mock */ },
    generate: vi.fn().mockImplementation(() => responses.shift()),
  };
}
```

---

## 10. CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml

name: Test Suite

on: [push, pull_request]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: mission_control_test
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx prisma migrate deploy
        env: { DATABASE_URL: postgresql://postgres:test@localhost/mission_control_test }
      - run: npm run test:unit
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    needs: unit-and-integration
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 11. Test Coverage Thresholds

| Module | Lines | Functions | Branches |
|--------|-------|-----------|----------|
| `lib/finance/` | 90% | 90% | 85% |
| `lib/recurrence/` | 95% | 95% | 90% |
| `lib/ai/` | 80% | 80% | 70% |
| `lib/encryption/` | 100% | 100% | 100% |
| `lib/scrapers/` | 75% | 75% | 65% |
| `services/` | 80% | 80% | 70% |
| `components/ui/` | 60% | 60% | 50% |

---

## 12. Pre-commit Hook Tests

```json
// package.json scripts
{
  "test": "vitest run",
  "test:unit": "vitest run tests/unit",
  "test:integration": "vitest run tests/integration",
  "test:e2e": "playwright test",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

```bash
# .husky/pre-commit
npm run lint
npm run typecheck
npm run test:unit  # only unit tests on commit (fast, < 30s)
```

---

*Last updated: 2026-05-22 | Version: 1.0.0*
