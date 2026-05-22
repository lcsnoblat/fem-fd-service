# Mission Control — Database Schema Specification

## 1. Overview

**Database**: PostgreSQL 16  
**ORM**: Prisma 5  
**Pattern**: Single-schema, multi-tenant ready (userId on every table)

All tables include:
- `id` — `cuid()` (collision-resistant, URL-safe)
- `createdAt` / `updatedAt` — auto-managed by Prisma
- `userId` — every user-owned record is scoped to a user

---

## 2. Full Prisma Schema

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Auth.js required fields
  accounts      Account[]
  sessions      Session[]

  // Module relations
  transactions       Transaction[]
  categories         Category[]
  budgets            Budget[]
  recurringTxn       RecurringTransaction[]
  savedRecipes       SavedRecipe[]
  mealPlans          MealPlan[]
  shoppingLists      ShoppingList[]
  priceAlerts        PriceAlert[]
  jobApplications    JobApplication[]
  savedJobs          SavedJob[]
  jobSearchProfile   JobSearchProfile?
  events             Event[]
  tasks              Task[]
  projects           Project[]
  googleCalSync      GoogleCalendarSync?
  albums             Album[]
  images             Image[]
  iotDevices         IoTDevice[]
  deviceSchedules    DeviceSchedule[]
  reminders          Reminder[]
  pushSubscriptions  PushSubscription[]
  agentSessions      AgentSession[]
  mcpServers         MCPServer[]
  agentMemories      AgentMemory[]
  agentProjects      AgentProject[]
  modelProviders     ModelProvider[]
  modelSlots         ModelSlot[]
  modelUsage         ModelUsage[]
  scraperConfigs     ScraperConfig[]
  notifications      AppNotification[]
  settings           UserSettings?

  @@index([email])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─────────────────────────────────────────────
// USER SETTINGS
// ─────────────────────────────────────────────

model UserSettings {
  id                   String   @id @default(cuid())
  userId               String   @unique
  language             String   @default("pt-BR")
  timezone             String   @default("America/Sao_Paulo")
  currency             String   @default("BRL")
  sidebarCollapsed     Boolean  @default(false)
  notificationsEnabled Boolean  @default(true)
  weekStartsOn         Int      @default(0) // 0=Sunday, 1=Monday
  dateFormat           String   @default("dd/MM/yyyy")
  theme                String   @default("light")
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────────

model Transaction {
  id          String          @id @default(cuid())
  userId      String
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  categoryId  String?
  description String
  date        DateTime        @db.Date
  receiptUrl  String?
  notes       String?
  isRecurring Boolean         @default(false)
  recurringId String?
  importedFrom String?        // "csv", "manual", "api"
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user      User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  category  Category?             @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  recurring RecurringTransaction? @relation(fields: [recurringId], references: [id])

  @@index([userId, date])
  @@index([userId, categoryId])
  @@index([userId, type])
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
}

model Category {
  id        String       @id @default(cuid())
  userId    String
  name      String
  color     String       // hex color
  icon      String       // lucide icon name
  type      CategoryType
  isDefault Boolean      @default(false)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  budgets      Budget[]

  @@unique([userId, name])
  @@index([userId])
}

enum CategoryType {
  INCOME
  EXPENSE
  BOTH
}

model Budget {
  id         String      @id @default(cuid())
  userId     String
  categoryId String
  amount     Decimal     @db.Decimal(12, 2)
  period     BudgetPeriod
  startDate  DateTime    @db.Date
  endDate    DateTime?   @db.Date
  alertAt    Int         @default(80) // percentage to alert (0-100)
  isActive   Boolean     @default(true)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([categoryId])
}

enum BudgetPeriod {
  WEEKLY
  MONTHLY
  YEARLY
}

model RecurringTransaction {
  id          String          @id @default(cuid())
  userId      String
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  categoryId  String?
  description String
  frequency   RecurFrequency
  interval    Int             @default(1)
  startDate   DateTime        @db.Date
  endDate     DateTime?       @db.Date
  nextRun     DateTime        @db.Date
  isActive    Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@index([userId, nextRun])
}

enum RecurFrequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  YEARLY
}

// ─────────────────────────────────────────────
// RECIPES
// ─────────────────────────────────────────────

model Recipe {
  id           String   @id @default(cuid())
  title        String
  description  String?
  ingredients  Json     // { name, amount, unit, optional }[]
  instructions Json     // { step, description, imageUrl? }[]
  prepTime     Int?     // minutes
  cookTime     Int?     // minutes
  servings     Int?
  cuisine      String?
  dietary      String[] // vegan, gluten-free, etc.
  difficulty   RecipeDifficulty?
  imageUrl     String?
  sourceUrl    String?
  sourceName   String?
  aiGenerated  Boolean  @default(false)
  nutrition    Json?    // { calories, protein, carbs, fat, fiber }
  tags         String[]
  isPublic     Boolean  @default(false)
  scrapedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  savedBy   SavedRecipe[]
  mealPlans MealPlan[]

  @@index([cuisine])
  @@fulltext([title, description])
}

enum RecipeDifficulty {
  EASY
  MEDIUM
  HARD
}

model SavedRecipe {
  id        String   @id @default(cuid())
  userId    String
  recipeId  String
  notes     String?
  savedAt   DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, recipeId])
  @@index([userId])
}

model MealPlan {
  id       String   @id @default(cuid())
  userId   String
  date     DateTime @db.Date
  recipeId String
  mealType MealType
  servings Int      @default(1)
  notes    String?
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@unique([userId, date, mealType])
  @@index([userId, date])
}

enum MealType {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}

// ─────────────────────────────────────────────
// SHOPPING
// ─────────────────────────────────────────────

model ShoppingList {
  id          String           @id @default(cuid())
  userId      String
  name        String
  status      ShoppingListStatus @default(ACTIVE)
  shareToken  String?          @unique // for read-only sharing
  notes       String?
  completedAt DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  user  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items ShoppingItem[]

  @@index([userId, status])
}

enum ShoppingListStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

model ShoppingItem {
  id             String   @id @default(cuid())
  listId         String
  name           String
  quantity       Decimal? @db.Decimal(8, 2)
  unit           String?
  category       String?  // produce, dairy, meat, etc.
  isChecked      Boolean  @default(false)
  addedFrom      String?  // manual, recipe, ai
  estimatedPrice Decimal? @db.Decimal(10, 2)
  actualPrice    Decimal? @db.Decimal(10, 2)
  notes          String?
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  list ShoppingList @relation(fields: [listId], references: [id], onDelete: Cascade)

  @@index([listId])
  @@index([listId, isChecked])
}

model PriceComparison {
  id        String   @id @default(cuid())
  itemName  String
  storeName String
  price     Decimal  @db.Decimal(10, 2)
  unit      String?
  currency  String   @default("BRL")
  url       String?
  scrapedAt DateTime @default(now())

  @@index([itemName, scrapedAt])
}

model PriceAlert {
  id          String   @id @default(cuid())
  userId      String
  itemName    String
  targetPrice Decimal  @db.Decimal(10, 2)
  isActive    Boolean  @default(true)
  triggeredAt DateTime?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ─────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────

model JobPost {
  id           String   @id @default(cuid())
  title        String
  company      String
  companyLogo  String?
  location     String?
  remote       RemoteType @default(UNKNOWN)
  salaryMin    Int?
  salaryMax    Int?
  salaryCurrency String?
  description  String   @db.Text
  requirements String?  @db.Text
  skills       String[]
  jobType      String?  // full-time, part-time, contract
  source       String   // linkedin, indeed, gupy, etc.
  sourceUrl    String   @unique
  externalId   String?
  postedAt     DateTime?
  scrapedAt    DateTime @default(now())
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  savedBy      SavedJob[]
  applications JobApplication[]

  @@index([source, scrapedAt])
  @@index([remote])
  @@fulltext([title, company, description])
}

enum RemoteType {
  REMOTE
  HYBRID
  ONSITE
  UNKNOWN
}

model SavedJob {
  id        String   @id @default(cuid())
  userId    String
  jobPostId String
  fitScore  Int?     // 0-100, AI-calculated
  notes     String?
  savedAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPost JobPost @relation(fields: [jobPostId], references: [id], onDelete: Cascade)

  @@unique([userId, jobPostId])
  @@index([userId])
}

model JobApplication {
  id             String            @id @default(cuid())
  userId         String
  jobPostId      String
  status         ApplicationStatus @default(WISHLIST)
  appliedAt      DateTime?
  notes          String?
  nextFollowUp   DateTime?
  interviewDates DateTime[]
  offerAmount    Int?
  rejectedReason String?
  coverLetter    String?           @db.Text
  sortOrder      Int               @default(0)
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPost JobPost @relation(fields: [jobPostId], references: [id], onDelete: Cascade)

  @@unique([userId, jobPostId])
  @@index([userId, status])
}

enum ApplicationStatus {
  WISHLIST
  APPLIED
  SCREENING
  INTERVIEW
  OFFER
  ACCEPTED
  REJECTED
  WITHDRAWN
}

model JobSearchProfile {
  id           String   @id @default(cuid())
  userId       String   @unique
  skills       String[]
  locations    String[]
  remote       Boolean  @default(true)
  salaryMin    Int?
  salaryMax    Int?
  jobTypes     String[]
  keywords     String[]
  excludeWords String[]
  lastSearched DateTime?
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────────
// CALENDAR
// ─────────────────────────────────────────────

model Event {
  id            String   @id @default(cuid())
  userId        String
  title         String
  description   String?
  start         DateTime
  end           DateTime
  allDay        Boolean  @default(false)
  color         String?
  location      String?
  url           String?
  googleEventId String?  // for sync
  reminderId    String?
  recurrenceId  String?
  isException   Boolean  @default(false) // modified occurrence of recurring event
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurrence RecurrenceRule?

  @@index([userId, start, end])
  @@index([googleEventId])
}

model RecurrenceRule {
  id        String   @id @default(cuid())
  eventId   String   @unique
  frequency RecurFrequency
  interval  Int      @default(1)
  until     DateTime?
  count     Int?
  byDay     String[] // MON, TUE, etc.
  byMonthDay Int[]
  exDates   DateTime[] // excluded dates

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Task {
  id               String     @id @default(cuid())
  userId           String
  title            String
  description      String?
  dueDate          DateTime?
  priority         Priority   @default(MEDIUM)
  status           TaskStatus @default(TODO)
  tags             String[]
  projectId        String?
  parentId         String?    // for sub-tasks (one level only)
  estimatedMinutes Int?
  actualMinutes    Int?
  completedAt      DateTime?
  sortOrder        Int        @default(0)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project  Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  parent   Task?    @relation("SubTasks", fields: [parentId], references: [id])
  children Task[]   @relation("SubTasks")

  @@index([userId, status])
  @@index([userId, dueDate])
  @@index([projectId])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}

model Project {
  id         String   @id @default(cuid())
  userId     String
  name       String
  color      String   @default("#6366F1")
  emoji      String?
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@index([userId])
}

model GoogleCalendarSync {
  id              String   @id @default(cuid())
  userId          String   @unique
  googleAccountId String
  calendarId      String
  syncToken       String?
  lastSyncAt      DateTime?
  isSyncing       Boolean  @default(false)
  syncError       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────────
// GALLERY
// ─────────────────────────────────────────────

model Album {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  coverImageId String?
  isPublic    Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  images Image[]

  @@index([userId])
}

model Image {
  id            String   @id @default(cuid())
  userId        String
  albumId       String?
  filename      String
  originalName  String
  url           String
  thumbnailUrl  String
  blurHash      String?
  width         Int
  height        Int
  size          Int      // bytes
  mimeType      String
  aiTags        String[]
  aiDescription String?
  exifData      Json?    // camera, GPS, date taken, etc.
  tagsAnalyzed  Boolean  @default(false)
  uploadedAt    DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  album Album? @relation(fields: [albumId], references: [id], onDelete: SetNull)

  @@index([userId, uploadedAt])
  @@index([albumId])
  @@fulltext([aiDescription])
}

// ─────────────────────────────────────────────
// SMART HOME / IOT
// ─────────────────────────────────────────────

model IoTDevice {
  id          String     @id @default(cuid())
  userId      String
  name        String
  type        DeviceType
  provider    String     // myq, shelly, generic, etc.
  apiEndpoint String?
  apiKey      String?    // encrypted
  isOnline    Boolean    @default(false)
  lastSeen    DateTime?
  config      Json       @default("{}")
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  states    DeviceState[]
  logs      AccessLog[]
  schedules DeviceSchedule[]

  @@index([userId])
}

enum DeviceType {
  GARAGE_DOOR
  LIGHT
  THERMOSTAT
  LOCK
  CAMERA
  SWITCH
  SENSOR
}

model DeviceState {
  id         String   @id @default(cuid())
  deviceId   String
  state      Json     // device-specific state object
  recordedAt DateTime @default(now())

  device IoTDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([deviceId, recordedAt])
}

model AccessLog {
  id          String   @id @default(cuid())
  deviceId    String
  userId      String
  action      String
  state       Json
  triggeredBy String   // manual, schedule, automation, webhook
  createdAt   DateTime @default(now())

  device IoTDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([deviceId, createdAt])
}

model DeviceSchedule {
  id             String   @id @default(cuid())
  deviceId       String
  userId         String
  name           String
  action         String
  params         Json     @default("{}")
  cronExpression String
  isActive       Boolean  @default(true)
  nextRun        DateTime?
  lastRun        DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  device IoTDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  user   User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([deviceId])
  @@index([userId])
}

// ─────────────────────────────────────────────
// REMINDERS
// ─────────────────────────────────────────────

model Reminder {
  id          String         @id @default(cuid())
  userId      String
  title       String
  description String?
  dueAt       DateTime
  priority    Priority       @default(MEDIUM)
  status      ReminderStatus @default(PENDING)
  tags        String[]
  linkedTo    Json?          // { type: "task"|"event"|"job", id: string }
  recurrenceId String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  user       User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurrence ReminderRecurrence?
  snoozeLogs SnoozeLog[]

  @@index([userId, dueAt])
  @@index([userId, status])
}

enum ReminderStatus {
  PENDING
  DONE
  SNOOZED
  DISMISSED
}

model ReminderRecurrence {
  id             String         @id @default(cuid())
  reminderId     String         @unique
  frequency      RecurFrequency
  interval       Int            @default(1)
  until          DateTime?
  count          Int?
  nextOccurrence DateTime

  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model SnoozeLog {
  id          String   @id @default(cuid())
  reminderId  String
  snoozedAt   DateTime @default(now())
  snoozedUntil DateTime
  reason      String?

  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@index([reminderId])
}

// ─────────────────────────────────────────────
// AGENT
// ─────────────────────────────────────────────

model AgentSession {
  id            String        @id @default(cuid())
  userId        String
  name          String        @default("New Session")
  status        AgentStatus   @default(IDLE)
  modelSlotId   String?
  messages      Json[]        @default([]) // { role, content, toolCalls? }[]
  context       Json          @default("{}")
  iterationCount Int          @default(0)
  projectId     String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  project AgentProject? @relation(fields: [projectId], references: [id])

  @@index([userId, status])
}

enum AgentStatus {
  IDLE
  RUNNING
  PAUSED
  ERROR
  COMPLETE
}

model MCPServer {
  id             String    @id @default(cuid())
  userId         String
  name           String
  description    String?
  type           MCPServerType
  command        String?   // for stdio: e.g., "npx @modelcontextprotocol/server-filesystem"
  args           String[]  @default([])
  url            String?   // for SSE
  env            Json      @default("{}") // env vars for stdio server
  isActive       Boolean   @default(false)
  availableTools Json[]    @default([]) // cached tool list
  lastConnected  DateTime?
  connectError   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum MCPServerType {
  STDIO
  SSE
  HTTP
}

model AgentMemory {
  id        String    @id @default(cuid())
  userId    String
  key       String
  value     Json
  source    String    @default("session") // session, user, system
  expiresAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
  @@index([userId])
}

model AgentProject {
  id            String   @id @default(cuid())
  userId        String
  name          String
  rootPath      String?  // local path (server-side)
  repoUrl       String?
  description   String?
  config        Json     @default("{}")
  activeSessionId String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions AgentSession[]

  @@index([userId])
}

// ─────────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────────

enum FeatureSlot {
  AGENT
  RECIPES
  SHOPPING
  JOBS
  FINANCE
  REMINDERS
  CALENDAR
  GALLERY
  REPORTS
  GLOBAL_FALLBACK
}

enum ModelProviderType {
  ANTHROPIC
  OPENAI
  GROQ
  GOOGLE
  OLLAMA
  CUSTOM
}

model ModelProvider {
  id        String            @id @default(cuid())
  userId    String
  name      String
  type      ModelProviderType
  baseUrl   String?
  apiKey    String?           // AES-256 encrypted
  isActive  Boolean           @default(false)
  testedAt  DateTime?
  testError String?
  models    Json[]            @default([]) // cached available models
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  user  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  slots ModelSlot[]
  usage ModelUsage[]

  @@unique([userId, type])
  @@index([userId])
}

model ModelSlot {
  id           String      @id @default(cuid())
  userId       String
  feature      FeatureSlot @unique
  providerId   String
  modelId      String
  temperature  Float       @default(0.7)
  maxTokens    Int         @default(4096)
  systemPrompt String?
  customParams Json        @default("{}")
  updatedAt    DateTime    @updatedAt

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider ModelProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model ModelUsage {
  id           String   @id @default(cuid())
  userId       String
  providerId   String
  modelId      String
  feature      FeatureSlot
  inputTokens  Int      @default(0)
  outputTokens Int      @default(0)
  costUsd      Decimal  @db.Decimal(10, 6)
  timestamp    DateTime @default(now())

  user     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider ModelProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([userId, timestamp])
  @@index([providerId, timestamp])
}

// ─────────────────────────────────────────────
// REPORTS / SCRAPERS
// ─────────────────────────────────────────────

enum ScraperTemplate {
  PRICE_TRACKER
  JOB_MONITOR
  NEWS_AGGREGATOR
  COMPETITOR_MONITOR
  PORTFOLIO_TRACKER
  CUSTOM
}

enum NotifyChannel {
  EMAIL
  PUSH
  BOTH
  NONE
}

model ScraperConfig {
  id            String          @id @default(cuid())
  userId        String
  name          String
  template      ScraperTemplate
  config        Json            // template-specific config
  schedule      String          // cron expression
  isActive      Boolean         @default(true)
  notifyOn      NotifyChannel   @default(PUSH)
  outputFormat  String          @default("json") // json, csv, html, pdf
  lastRunAt     DateTime?
  nextRunAt     DateTime?
  successRate   Float?          // 0-1, calculated
  avgDuration   Int?            // milliseconds
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  user   User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  runs   ScraperRun[]

  @@index([userId])
  @@index([nextRunAt, isActive])
}

model ScraperRun {
  id           String      @id @default(cuid())
  scraperId    String
  status       RunStatus   @default(RUNNING)
  startedAt    DateTime    @default(now())
  completedAt  DateTime?
  duration     Int?        // milliseconds
  result       Json?
  errorMessage String?
  rawData      Json?
  screenshotUrl String?    // on failure

  scraper  ScraperConfig  @relation(fields: [scraperId], references: [id], onDelete: Cascade)
  report   ScraperReport?
  pricePoints PricePoint[]

  @@index([scraperId, startedAt])
  @@index([status])
}

enum RunStatus {
  RUNNING
  SUCCESS
  FAILED
  PARTIAL
  CANCELLED
}

model ScraperReport {
  id          String   @id @default(cuid())
  runId       String   @unique
  scraperId   String
  title       String
  summary     String?
  data        Json
  chartData   Json?
  exportUrl   String?
  aiSummary   String?
  generatedAt DateTime @default(now())

  run ScraperRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([scraperId, generatedAt])
}

model PricePoint {
  id        String   @id @default(cuid())
  runId     String
  itemName  String
  price     Decimal  @db.Decimal(10, 2)
  currency  String   @default("BRL")
  storeName String
  url       String?
  inStock   Boolean  @default(true)
  recordedAt DateTime @default(now())

  run ScraperRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([runId])
  @@index([itemName, recordedAt])
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

model AppNotification {
  id        String             @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  data      Json               @default("{}")
  isRead    Boolean            @default(false)
  readAt    DateTime?
  createdAt DateTime           @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

enum NotificationType {
  REMINDER_DUE
  BUDGET_ALERT
  SCRAPER_COMPLETE
  JOB_MATCH
  GARAGE_STATE_CHANGED
  PRICE_ALERT_TRIGGERED
  AGENT_TASK_COMPLETE
  SYSTEM
}
```

---

## 3. Migration Strategy

```bash
# Initial setup
npx prisma migrate dev --name init

# Adding features
npx prisma migrate dev --name add_job_module
npx prisma migrate dev --name add_gallery_module

# Production
npx prisma migrate deploy

# Reset dev database
npx prisma migrate reset
```

### Migration Rules
1. Never drop columns in production — add `deprecated_` prefix, remove in next cycle
2. All new columns must have defaults or be nullable
3. Backfill migrations run separately from schema migrations
4. Test migrations against a copy of production data before applying

---

## 4. Indexes Strategy

| Table | Index | Reason |
|-------|-------|--------|
| Transaction | (userId, date) | Most common query filter |
| Transaction | (userId, categoryId) | Category breakdown |
| Event | (userId, start, end) | Date range calendar queries |
| Task | (userId, dueDate) | Upcoming tasks widget |
| Image | (userId, uploadedAt) | Gallery chronological sort |
| JobPost | (source, scrapedAt) | De-duplication during scraping |
| ScraperConfig | (nextRunAt, isActive) | Worker queue processing |
| ModelUsage | (userId, timestamp) | Usage analytics |
| AppNotification | (userId, isRead) | Unread count badge |

---

## 5. Data Integrity

```sql
-- Enforce decimal precision at DB level (examples)
-- amount DECIMAL(12, 2)  → max 9,999,999,999.99
-- price  DECIMAL(10, 2)  → max 99,999,999.99
-- cost   DECIMAL(10, 6)  → max 9,999.999999 (for micro-amounts)

-- Cascade rules
-- User delete → cascade ALL user data (GDPR compliance)
-- Category delete → SET NULL on transactions (preserve history)
-- Album delete → SET NULL on images (images become uncategorized)
-- MCP Server delete → sessions continue with cached tools
```

---

## 6. Seed Data

```typescript
// packages/db/prisma/seed.ts

async function main() {
  // Create default categories for finance
  const defaultCategories = [
    { name: 'Alimentação', color: '#F97316', icon: 'Utensils', type: 'EXPENSE' },
    { name: 'Transporte', color: '#3B82F6', icon: 'Car', type: 'EXPENSE' },
    { name: 'Moradia', color: '#10B981', icon: 'Home', type: 'EXPENSE' },
    { name: 'Saúde', color: '#EF4444', icon: 'Heart', type: 'EXPENSE' },
    { name: 'Educação', color: '#8B5CF6', icon: 'BookOpen', type: 'EXPENSE' },
    { name: 'Lazer', color: '#EC4899', icon: 'Music', type: 'EXPENSE' },
    { name: 'Salário', color: '#10B981', icon: 'DollarSign', type: 'INCOME' },
    { name: 'Freelance', color: '#6366F1', icon: 'Briefcase', type: 'INCOME' },
  ];

  // Default model slots (Anthropic Haiku for cost efficiency)
  const defaultModelSlots = Object.values(FeatureSlot).map((feature) => ({
    feature,
    modelId: 'claude-haiku-4-5-20251001',
    temperature: feature === 'AGENT' ? 0.3 : 0.7,
    maxTokens: feature === 'AGENT' ? 8192 : 2048,
  }));
}
```

---

*Last updated: 2026-05-22 | Version: 1.0.0*
