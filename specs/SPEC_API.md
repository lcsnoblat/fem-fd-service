# Mission Control — API Specification

## 1. Overview

The API layer uses **tRPC v11** for all client-server communication, providing end-to-end TypeScript type safety. All procedures are protected by authentication middleware. File uploads use pre-signed URLs directly to R2 (no data passes through the Next.js server for uploads).

Real-time communication uses **Socket.io** for streaming (Agent tokens, IoT state, scraper progress).

---

## 2. tRPC Context

```typescript
// lib/trpc/context.ts
export type TRPCContext = {
  session: Session | null;
  userId: string | null;
  db: PrismaClient;
  redis: Redis;
  services: {
    finance: FinanceService;
    recipes: RecipesService;
    shopping: ShoppingService;
    jobs: JobsService;
    calendar: CalendarService;
    gallery: GalleryService;
    smarthome: SmartHomeService;
    reminders: RemindersService;
    agent: AgentService;
    models: ModelsService;
    reports: ReportsService;
    notifications: NotificationsService;
  };
};

// Authenticated procedure — throws UNAUTHORIZED if no session
const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, userId: ctx.session.user.id } });
});
```

---

## 3. Input Validation Schemas

All inputs validated with **Zod**. Schemas co-located with router files.

```typescript
// Common schemas (shared across modules)
const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const cuidSchema = z.string().cuid();
```

---

## 4. Finance Router

```typescript
// Procedures
finance.getTransactions({
  page?: number,
  pageSize?: number,
  dateRange?: { from?: string, to?: string },
  categoryId?: string,
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  search?: string,
  sortBy?: 'date' | 'amount' | 'description',
  sortOrder?: 'asc' | 'desc',
}) → {
  transactions: Transaction[],
  total: number,
  totalIncome: Decimal,
  totalExpense: Decimal,
  nextPage: number | null,
}

finance.getTransactionById(id: string) → Transaction

finance.createTransaction({
  amount: number,           // positive, max 9_999_999_999.99
  type: TransactionType,
  categoryId?: string,
  description: string,      // min 1, max 200
  date: string,             // ISO date "YYYY-MM-DD"
  receiptUrl?: string,
  notes?: string,
  isRecurring?: boolean,
}) → Transaction

finance.updateTransaction({
  id: string,
  amount?: number,
  type?: TransactionType,
  categoryId?: string | null,
  description?: string,
  date?: string,
  notes?: string,
}) → Transaction

finance.deleteTransaction(id: string) → { success: true }

finance.bulkDeleteTransactions(ids: string[]) → { deleted: number }

finance.getCategories() → Category[]

finance.createCategory({
  name: string,             // min 1, max 50
  color: string,            // hex color
  icon: string,             // lucide icon name
  type: CategoryType,
}) → Category

finance.updateCategory({
  id: string,
  name?: string,
  color?: string,
  icon?: string,
}) → Category

finance.deleteCategory(id: string) → { success: true }

finance.getBudgets() → (Budget & { spent: Decimal, percentage: number })[]

finance.createBudget({
  categoryId: string,
  amount: number,
  period: BudgetPeriod,
  startDate: string,
  alertAt?: number,         // 0-100, default 80
}) → Budget

finance.updateBudget({ id: string, amount?: number, alertAt?: number }) → Budget

finance.getSpendingSummary({
  month: string,            // "YYYY-MM"
}) → {
  totalIncome: Decimal,
  totalExpense: Decimal,
  balance: Decimal,
  byCategory: { category: Category, spent: Decimal, percentage: number }[],
}

finance.getMonthlyTrend({ months?: number }) → {
  month: string,
  income: Decimal,
  expense: Decimal,
  balance: Decimal,
}[]

finance.importFromCSV({
  data: string,             // CSV content
  mapping: {
    date: string,           // column name
    amount: string,
    description: string,
    type?: string,
    category?: string,
  },
  preview?: boolean,        // if true, returns preview without saving
}) → {
  imported: number,
  skipped: number,
  errors: { row: number, message: string }[],
  transactions?: Transaction[], // only if preview: true
}

finance.autoCategorizeSuggestion(description: string) → { categoryId: string, confidence: number }
```

---

## 5. Recipes Router

```typescript
recipes.searchRecipes({
  query?: string,
  cuisine?: string,
  dietary?: string[],
  maxPrepTime?: number,     // minutes
  difficulty?: RecipeDifficulty,
  page?: number,
  pageSize?: number,
}) → {
  recipes: Recipe[],
  total: number,
  source: 'db' | 'scraped' | 'ai',
}

recipes.getRecipeById(id: string) → Recipe

recipes.saveRecipe({ recipeId: string, notes?: string }) → SavedRecipe
recipes.unsaveRecipe(recipeId: string) → { success: true }
recipes.getSavedRecipes({ page?: number, pageSize?: number }) → { recipes: (Recipe & { savedAt: Date, notes?: string })[], total: number }

recipes.getMealPlan({ weekStart: string }) → MealPlan[]

recipes.addToMealPlan({
  recipeId: string,
  date: string,
  mealType: MealType,
  servings?: number,
}) → MealPlan

recipes.removeFromMealPlan({ date: string, mealType: MealType }) → { success: true }

recipes.generateShoppingListFromMealPlan({
  weekStart: string,
  listName?: string,
}) → ShoppingList   // creates and returns a new shopping list

recipes.suggestFromIngredients({
  ingredients: string[],   // list of ingredients user has
  dietary?: string[],
}) → Recipe[]              // AI-generated or matched recipes

recipes.generateRecipe({
  prompt: string,          // e.g., "pasta with mushrooms, under 30 minutes"
  dietary?: string[],
}) → Recipe                // AI-generated recipe (streamed)
```

---

## 6. Shopping Router

```typescript
shopping.getLists({ status?: ShoppingListStatus }) → ShoppingList[]
shopping.createList({ name: string }) → ShoppingList
shopping.archiveList(id: string) → ShoppingList
shopping.deleteList(id: string) → { success: true }
shopping.generateShareToken(id: string) → { shareUrl: string }

shopping.getListItems(listId: string) → ShoppingItem[]
shopping.addItem({
  listId: string,
  name: string,
  quantity?: number,
  unit?: string,
  notes?: string,
}) → ShoppingItem

shopping.updateItem({
  id: string,
  name?: string,
  quantity?: number,
  unit?: string,
  isChecked?: boolean,
  actualPrice?: number,
  notes?: string,
}) → ShoppingItem

shopping.deleteItem(id: string) → { success: true }
shopping.checkItem(id: string) → ShoppingItem
shopping.uncheckItem(id: string) → ShoppingItem
shopping.reorderItems({ listId: string, orderedIds: string[] }) → { success: true }
shopping.bulkAddItems({ listId: string, items: { name: string, quantity?: number, unit?: string }[] }) → ShoppingItem[]

shopping.comparePrices(itemName: string) → {
  results: PriceComparison[],
  bestPrice: PriceComparison,
  cached: boolean,
  cachedAt?: Date,
}

shopping.setPriceAlert({ itemName: string, targetPrice: number }) → PriceAlert
shopping.removePriceAlert(id: string) → { success: true }

shopping.getAISuggestions(listId: string) → {
  suggestions: { name: string, reason: string }[],
}
```

---

## 7. Jobs Router

```typescript
jobs.searchJobs({
  query?: string,
  skills?: string[],
  remote?: RemoteType,
  salaryMin?: number,
  location?: string,
  datePostedWithin?: number,  // days
  source?: string[],
  page?: number,
  pageSize?: number,
}) → { jobs: JobPost[], total: number }

jobs.getJobById(id: string) → JobPost

jobs.saveJob({ jobPostId: string, notes?: string }) → SavedJob
jobs.unsaveJob(jobPostId: string) → { success: true }
jobs.getSavedJobs({ page?: number, pageSize?: number }) → { jobs: (JobPost & { savedAt: Date, fitScore?: number })[], total: number }

jobs.getApplications({ status?: ApplicationStatus }) → (JobApplication & { jobPost: JobPost })[]
jobs.createApplication({ jobPostId: string, notes?: string }) → JobApplication
jobs.updateApplicationStatus({
  id: string,
  status: ApplicationStatus,
  notes?: string,
  nextFollowUp?: string,
  interviewDate?: string,
  offerAmount?: number,
}) → JobApplication
jobs.addApplicationNote({ id: string, note: string }) → JobApplication
jobs.reorderApplications({ status: ApplicationStatus, orderedIds: string[] }) → { success: true }

jobs.getSearchProfile() → JobSearchProfile
jobs.updateSearchProfile({
  skills?: string[],
  locations?: string[],
  remote?: boolean,
  salaryMin?: number,
  salaryMax?: number,
  jobTypes?: string[],
  keywords?: string[],
  excludeWords?: string[],
}) → JobSearchProfile

jobs.getAIFitScore(jobPostId: string) → { score: number, reasons: string[], missingSkills: string[] }
jobs.generateCoverLetter({ jobPostId: string, tone?: string }) → { content: string }  // streamed
jobs.generateInterviewQuestions(jobPostId: string) → { questions: string[] }
jobs.triggerScrape() → { jobId: string }  // background job ID
```

---

## 8. Calendar Router

```typescript
calendar.getEvents({
  start: string,
  end: string,
}) → Event[]

calendar.createEvent({
  title: string,
  description?: string,
  start: string,
  end: string,
  allDay?: boolean,
  color?: string,
  location?: string,
  recurrence?: {
    frequency: RecurFrequency,
    interval?: number,
    until?: string,
    count?: number,
    byDay?: string[],
  },
}) → Event

calendar.updateEvent({
  id: string,
  title?: string,
  description?: string,
  start?: string,
  end?: string,
  color?: string,
  location?: string,
  updateMode?: 'single' | 'this-and-future' | 'all', // for recurring events
}) → Event

calendar.deleteEvent({ id: string, deleteMode?: 'single' | 'this-and-future' | 'all' }) → { success: true }

calendar.getTasks({
  status?: TaskStatus,
  priority?: Priority,
  projectId?: string,
  dueBefore?: string,
  dueAfter?: string,
  tags?: string[],
}) → Task[]

calendar.createTask({
  title: string,
  description?: string,
  dueDate?: string,
  priority?: Priority,
  tags?: string[],
  projectId?: string,
  estimatedMinutes?: number,
}) → Task

calendar.updateTask({
  id: string,
  title?: string,
  description?: string,
  dueDate?: string | null,
  priority?: Priority,
  status?: TaskStatus,
  tags?: string[],
  actualMinutes?: number,
}) → Task

calendar.completeTask(id: string) → Task
calendar.deleteTask(id: string) → { success: true }

calendar.getProjects() → Project[]
calendar.createProject({ name: string, color?: string, emoji?: string }) → Project
calendar.updateProject({ id: string, name?: string, color?: string, emoji?: string }) → Project
calendar.archiveProject(id: string) → Project

calendar.getUpcoming({ days?: number }) → {
  events: Event[],
  tasks: Task[],
  reminders: Reminder[],
}

calendar.syncGoogleCalendar() → { synced: number, errors: number }
calendar.disconnectGoogleCalendar() → { success: true }
```

---

## 9. Gallery Router

```typescript
gallery.getAlbums() → Album[]
gallery.createAlbum({ name: string, description?: string }) → Album
gallery.updateAlbum({ id: string, name?: string, description?: string, coverImageId?: string }) → Album
gallery.deleteAlbum(id: string) → { success: true }

gallery.getImages({
  albumId?: string,
  tags?: string[],
  search?: string,
  dateRange?: { from?: string, to?: string },
  page?: number,
  pageSize?: number,
}) → { images: Image[], total: number }

gallery.getUploadUrl({
  filename: string,
  contentType: string,
  size: number,
}) → {
  uploadUrl: string,        // pre-signed R2 URL
  imageId: string,
  thumbnailKey: string,
}  // Client uploads directly to R2, then calls confirmUpload

gallery.confirmUpload({
  imageId: string,
  albumId?: string,
  width: number,
  height: number,
}) → Image

gallery.deleteImages(ids: string[]) → { deleted: number }
gallery.moveImages({ ids: string[], albumId: string | null }) → { moved: number }
gallery.analyzeImage(id: string) → Image  // triggers AI analysis, updates tags
gallery.searchByContent(query: string) → Image[]  // semantic AI search
```

---

## 10. Smart Home Router

```typescript
smarthome.getDevices() → IoTDevice[]
smarthome.addDevice({
  name: string,
  type: DeviceType,
  provider: string,
  apiEndpoint?: string,
  apiKey?: string,
  config?: Record<string, unknown>,
}) → IoTDevice
smarthome.updateDevice({ id: string, name?: string, config?: Record<string, unknown> }) → IoTDevice
smarthome.removeDevice(id: string) → { success: true }
smarthome.testConnection(id: string) → { success: boolean, error?: string, latencyMs?: number }

smarthome.getDeviceState(id: string) → {
  state: Record<string, unknown>,
  isOnline: boolean,
  lastUpdated: Date,
}

smarthome.controlDevice({
  id: string,
  action: 'open' | 'close' | 'stop' | 'toggle' | 'set',
  params?: Record<string, unknown>,
}) → {
  success: boolean,
  newState?: Record<string, unknown>,
}

smarthome.getAccessLog({
  deviceId: string,
  page?: number,
  pageSize?: number,
}) → { logs: AccessLog[], total: number }

smarthome.getSchedules(deviceId: string) → DeviceSchedule[]
smarthome.createSchedule({
  deviceId: string,
  name: string,
  action: string,
  cronExpression: string,
  params?: Record<string, unknown>,
}) → DeviceSchedule
smarthome.updateSchedule({ id: string, isActive?: boolean, cronExpression?: string }) → DeviceSchedule
smarthome.deleteSchedule(id: string) → { success: true }
```

---

## 11. Reminders Router

```typescript
reminders.getReminders({
  status?: ReminderStatus | ReminderStatus[],
  priority?: Priority,
  tags?: string[],
  dateRange?: { from?: string, to?: string },
  search?: string,
}) → Reminder[]

reminders.createReminder({
  title: string,
  description?: string,
  dueAt: string,            // ISO datetime
  priority?: Priority,
  tags?: string[],
  recurrence?: {
    frequency: RecurFrequency,
    interval?: number,
    until?: string,
    count?: number,
  },
}) → Reminder

reminders.updateReminder({
  id: string,
  title?: string,
  description?: string,
  dueAt?: string,
  priority?: Priority,
  tags?: string[],
}) → Reminder

reminders.completeReminder(id: string) → Reminder  // creates next occurrence if recurring
reminders.dismissReminder(id: string) → Reminder
reminders.snoozeReminder({
  id: string,
  until: string,            // ISO datetime
  reason?: string,
}) → Reminder

reminders.deleteReminder(id: string) → { success: true }
reminders.bulkComplete(ids: string[]) → { completed: number }

reminders.subscribeNotifications({
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string,
}) → { success: true }

reminders.unsubscribeNotifications(endpoint: string) → { success: true }

reminders.parseNaturalLanguage(text: string) → {
  title: string,
  dueAt: string,
  recurrence?: { frequency: RecurFrequency, interval?: number },
  priority?: Priority,
  confidence: number,
}

reminders.getAISuggestions() → {
  suggestions: { title: string, dueAt: string, reason: string }[],
}
```

---

## 12. Agent Router

```typescript
agent.getSessions({ page?: number, pageSize?: number }) → { sessions: AgentSession[], total: number }
agent.getSession(id: string) → AgentSession
agent.createSession({ name?: string, projectId?: string }) → AgentSession
agent.deleteSession(id: string) → { success: true }

// Sending a message triggers the agentic loop server-side.
// Response is streamed via WebSocket (not tRPC), but this
// procedure initiates the loop:
agent.sendMessage({
  sessionId: string,
  content: string,
}) → { jobId: string }  // stream via WS events

agent.cancelSession(sessionId: string) → { success: true }

agent.getMCPServers() → MCPServer[]
agent.addMCPServer({
  name: string,
  description?: string,
  type: MCPServerType,
  command?: string,
  args?: string[],
  url?: string,
  env?: Record<string, string>,
}) → MCPServer
agent.connectMCPServer(id: string) → { tools: MCPTool[] }
agent.disconnectMCPServer(id: string) → { success: true }
agent.removeMCPServer(id: string) → { success: true }
agent.getMCPTools(serverId: string) → MCPTool[]

agent.getMemory() → AgentMemory[]
agent.setMemory({ key: string, value: unknown, expiresAt?: string }) → AgentMemory
agent.deleteMemory(key: string) → { success: true }
agent.clearMemory() → { success: true }

agent.getProjects() → AgentProject[]
agent.createProject({
  name: string,
  rootPath?: string,
  repoUrl?: string,
  description?: string,
}) → AgentProject
agent.setActiveProject(projectId: string | null) → { success: true }
```

---

## 13. Models Router

```typescript
models.getProviders() → (ModelProvider & { hasKey: boolean, apiKey?: never })[]
models.addProvider({
  name: string,
  type: ModelProviderType,
  baseUrl?: string,
  apiKey?: string,
}) → ModelProvider
models.updateProvider({ id: string, apiKey?: string, isActive?: boolean }) → ModelProvider
models.removeProvider(id: string) → { success: true }
models.testProvider(id: string) → { success: boolean, latencyMs?: number, error?: string }
models.listAvailableModels(providerId: string) → { id: string, name: string, contextLength: number, description?: string }[]

models.getModelSlots() → ModelSlot[]
models.updateModelSlot({
  feature: FeatureSlot,
  providerId: string,
  modelId: string,
  temperature?: number,
  maxTokens?: number,
  systemPrompt?: string,
}) → ModelSlot

models.getOllamaModels() → OllamaModel[]
models.pullOllamaModel(name: string) → { jobId: string }  // streams progress via WS
models.deleteOllamaModel(name: string) → { success: true }
models.checkOllamaHealth() → { available: boolean, version?: string, models?: string[] }

models.getUsage({
  dateRange?: { from: string, to: string },
  groupBy?: 'day' | 'week' | 'month' | 'feature' | 'provider',
}) → {
  totalInputTokens: number,
  totalOutputTokens: number,
  totalCostUsd: number,
  breakdown: { label: string, inputTokens: number, outputTokens: number, costUsd: number }[],
}

models.setBudgetAlert({ limitUsd: number, notifyAt: number }) → { success: true }
```

---

## 14. Reports Router

```typescript
reports.getScrapers() → ScraperConfig[]
reports.createScraper({
  name: string,
  template: ScraperTemplate,
  config: Record<string, unknown>,
  schedule: string,           // cron expression
  notifyOn?: NotifyChannel,
  outputFormat?: string,
}) → ScraperConfig
reports.updateScraper({
  id: string,
  name?: string,
  config?: Record<string, unknown>,
  schedule?: string,
  isActive?: boolean,
  notifyOn?: NotifyChannel,
}) → ScraperConfig
reports.deleteScraper(id: string) → { success: true }
reports.toggleScraper({ id: string, isActive: boolean }) → ScraperConfig

reports.runNow(scraperId: string) → { runId: string }  // triggers immediately

reports.getScraperRuns({
  scraperId: string,
  page?: number,
  pageSize?: number,
}) → { runs: ScraperRun[], total: number }

reports.getLatestReport(scraperId: string) → ScraperReport | null

reports.exportReport({
  runId: string,
  format: 'pdf' | 'csv' | 'json',
}) → { url: string, expiresAt: Date }

reports.getScraperStats(scraperId: string) → {
  successRate: number,
  avgDuration: number,
  lastRun: Date | null,
  nextRun: Date | null,
  totalRuns: number,
}

reports.validateCronExpression(cron: string) → {
  valid: boolean,
  description?: string,   // human-readable: "Every day at 9am"
  nextRuns?: Date[],       // next 5 runs
  error?: string,
}

reports.getPriceHistory({
  scraperId: string,
  itemName: string,
  days?: number,
}) → PricePoint[]
```

---

## 15. Notifications Router

```typescript
notifications.getNotifications({
  unreadOnly?: boolean,
  page?: number,
  pageSize?: number,
}) → { notifications: AppNotification[], total: number, unreadCount: number }

notifications.markAsRead(ids: string[]) → { updated: number }
notifications.markAllAsRead() → { updated: number }
notifications.deleteNotification(id: string) → { success: true }
notifications.clearAll() → { deleted: number }
```

---

## 16. WebSocket Events (Socket.io)

```typescript
// Server → Client
interface ServerToClientEvents {
  // Agent streaming
  'agent:token':       (data: { sessionId: string, token: string }) => void;
  'agent:tool-call':   (data: { sessionId: string, tool: string, input: unknown }) => void;
  'agent:tool-result': (data: { sessionId: string, tool: string, result: unknown }) => void;
  'agent:done':        (data: { sessionId: string, fullText: string }) => void;
  'agent:error':       (data: { sessionId: string, error: string }) => void;

  // Smart Home
  'iot:state':         (data: { deviceId: string, state: unknown, timestamp: Date }) => void;
  'iot:online':        (data: { deviceId: string }) => void;
  'iot:offline':       (data: { deviceId: string }) => void;

  // Scraper
  'scraper:progress':  (data: { runId: string, step: string, progress: number }) => void;
  'scraper:complete':  (data: { runId: string, scraperId: string }) => void;
  'scraper:error':     (data: { runId: string, error: string }) => void;

  // Ollama pull
  'ollama:pull':       (data: { model: string, status: string, percent: number }) => void;
  'ollama:complete':   (data: { model: string }) => void;

  // Notifications
  'notification':      (data: AppNotification) => void;
}

// Client → Server
interface ClientToServerEvents {
  'agent:send':        (data: { sessionId: string, content: string }) => void;
  'agent:cancel':      (data: { sessionId: string }) => void;
  'iot:subscribe':     (data: { deviceId: string }) => void;
  'iot:unsubscribe':   (data: { deviceId: string }) => void;
}
```

---

## 17. Error Codes

```typescript
// tRPC error codes used across the API
type AppErrorCode =
  | 'UNAUTHORIZED'          // not authenticated
  | 'FORBIDDEN'             // authenticated but not authorized
  | 'NOT_FOUND'             // resource doesn't exist
  | 'BAD_REQUEST'           // invalid input (Zod errors bubble up)
  | 'CONFLICT'              // duplicate resource (unique constraint)
  | 'PRECONDITION_FAILED'   // e.g., budget exists for category before delete
  | 'TOO_MANY_REQUESTS'     // rate limited
  | 'INTERNAL_SERVER_ERROR' // unexpected error (logged, sanitized message)
  | 'EXTERNAL_SERVICE_ERROR'// third-party API failure
  | 'TIMEOUT';              // operation timed out (scraper, agent)
```

---

## 18. Rate Limiting

```typescript
// Applied at Next.js middleware level via Redis
const rateLimits = {
  default:           { requests: 100, window: '1m' },
  'trpc.agent.*':    { requests: 20, window: '1m' },   // AI calls are expensive
  'trpc.models.*':   { requests: 10, window: '1m' },   // API key operations
  'trpc.reports.*':  { requests: 5, window: '1m' },    // Scraper triggers
  'api/auth/*':      { requests: 10, window: '5m' },   // Auth endpoints
};
```

---

*Last updated: 2026-05-22 | Version: 1.0.0*
