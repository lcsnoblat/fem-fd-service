# Mission Control — Dashboard Page Specification

**Route:** `/`  
**File:** `apps/web/app/(dashboard)/page.tsx`  
**Version:** 1.0.0  
**Last updated:** 2026-05-22

---

## 1. Overview

The Dashboard is the entry point and command center of Mission Control. It renders immediately after login and presents a real-time, consolidated snapshot of the user's entire life at a glance — finances, tasks, reminders, job activity, and agent status — within a single, breathing, minimal layout.

### Goals

| Goal | Description |
|------|-------------|
| **Time-to-insight < 5s** | User understands their day within five seconds of page load |
| **Zero navigation required** | All critical information visible without scrolling on desktop |
| **One-click actions** | The most common actions (add transaction, add reminder, open agent) are reachable with one click from the dashboard |
| **Living surface** | Data refreshes in the background; numbers animate when they change |
| **Contextual intelligence** | If it's Monday morning, show this week's events; if a budget is blown, surface a warning |

### Role in the Platform

The dashboard is the only page a user may need to visit daily. Every other module is accessible from here via the Quick Actions panel or the sidebar. The dashboard aggregates read-only snapshots from Finance, Calendar, Reminders, Jobs, and the AI Agent — it does not duplicate full management UIs, but always provides a deep-link into the relevant module.

---

## 2. User Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-D01 | As a user, I want to see my current bank balance and today's net spending as soon as I open the app, so I can make quick financial decisions. | QuickStatCard for balance renders within 1s; shows current balance, today's delta with color coding. |
| US-D02 | As a user, I want to see what tasks are due today and tomorrow from my calendar, so I never miss a deadline. | UpcomingTasks widget shows next 3 tasks sorted by due date with time labels. |
| US-D03 | As a user, I want overdue and due-today reminders highlighted prominently, so I act on them before they lapse. | ActiveReminders widget uses red/amber color coding; overdue items shown first. |
| US-D04 | As a user, I want to add a new expense transaction without leaving the dashboard, so I can log it immediately while the receipt is in my hand. | Quick Actions → "Add Transaction" opens a slide-over form that submits and updates the dashboard widget without a page reload. |
| US-D05 | As a user, I want to see how many job applications I have in each stage (Applied, Interview, Offer), so I know the health of my job search at a glance. | JobApplicationsKanban mini-view shows count badges per column; total count shown in QuickStatCard. |
| US-D06 | As a user, I want to know if my AI agent is currently running a task, so I can monitor its progress without going to the Agent page. | AgentStatus widget shows active session name, elapsed time, last tool called, with a progress indicator. |
| US-D07 | As a user, I want to use Cmd+K to search across all my data (transactions, tasks, reminders, jobs) from the dashboard, so I can find anything instantly. | Command palette opens on Cmd+K; searches across all modules with grouped results; Enter navigates to item. |
| US-D08 | As a user, I want to see an onboarding checklist the first time I open the dashboard, so I know what to set up to get value from the platform. | Empty state shows a 5-step checklist with progress bar; each step links to the relevant module. |

---

## 3. UI Layout

### 3.1 Desktop Layout (≥1280px) — Full Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR                                                                               │
│  [≡ Mission Control]          [🔍 Search... Cmd+K]         [🔔 3] [☀ Lucas ▾]       │
├──────────────┬──────────────────────────────────────────────────────────────────────┤
│              │  MAIN CONTENT AREA (cols 1–12 of 12-col grid)                        │
│   SIDEBAR    │                                                                       │
│   (col 0)    │  ┌─────────────────────────────────────────────────────────────────┐ │
│              │  │ WELCOME HEADER                                                   │ │
│  ⌂ Dashboard│  │  Good morning, Lucas  ·  Thursday, 22 May 2026                   │ │
│  ₿ Finance  │  │  "3 tasks due today · 2 overdue reminders · Agent idle"           │ │
│  🍳 Recipes  │  └─────────────────────────────────────────────────────────────────┘ │
│  🛒 Shopping │                                                                       │
│  💼 Jobs     │  QUICK STATS ROW  [col span 3 each × 4 = 12]                        │
│  📅 Calendar │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐ │
│  🖼 Gallery  │  │ 💰 Balance    │ │ ✓ Tasks Today │ │ 🔔 Reminders │ │ 💼 Jobs  │ │
│  🏠 SmartHom │  │  $4,821.50    │ │  3 due today  │ │  2 overdue   │ │  12 apps │ │
│  ⏰ Reminder │  │  ▼ -$143 today│ │  +1 tomorrow  │ │  1 due today │ │  1 offer │ │
│  🤖 Agent   │  └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘ │
│  ⚙ Models   │                                                                       │
│  📊 Reports  │  MAIN GRID [3 columns]                                               │
│              │                                                                       │
│  ──────────  │  ┌─────────────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│  [+ Add...]  │  │ RECENT TRANSACTIONS      │ │ UPCOMING TASKS   │ │ QUICK ACTIONS│ │
│              │  │  col 1–5 (5 cols)        │ │  col 6–9 (4 cols)│ │  col 10–12  │ │
│              │  │                          │ │                  │ │  (3 cols)   │ │
│              │  │  Jan 22  Coffee   -$4.50 │ │  ⏱ 09:00        │ │ ┌──────────┐ │ │
│              │  │  Jan 22  Salary +$3200   │ │  Team standup    │ │ │ + Expense│ │ │
│              │  │  Jan 21  Groceri  -$67.3 │ │                  │ │ └──────────┘ │ │
│              │  │  Jan 21  Netflix  -$15.9 │ │  ⏱ 14:00        │ │ ┌──────────┐ │ │
│              │  │  Jan 20  Gym      -$50.0 │ │  Code review PR  │ │ │ + Remind │ │ │
│              │  │  ─── sparkline ──────── │ │                  │ │ └──────────┘ │ │
│              │  │  [View all transactions]  │ │  ⏱ Tomorrow     │ │ ┌──────────┐ │ │
│              │  └─────────────────────────┘ │  Send invoice    │ │ │ 🤖 Agent │ │ │
│              │                              │                  │ │ └──────────┘ │ │
│              │  ┌─────────────────────────┐ │  [View calendar] │ │ ┌──────────┐ │ │
│              │  │ ACTIVE REMINDERS         │ └──────────────────┘ │ │ 🏠 Garage│ │ │
│              │  │  col 1–5 (5 cols)        │                      │ └──────────┘ │ │
│              │  │                          │ ┌──────────────────┐ │              │ │
│              │  │ 🔴 OVERDUE               │ │ JOB APPLICATIONS │ │ ┌──────────┐ │ │
│              │  │  Pay electricity bill    │ │  col 6–9 (4 cols)│ │ │ 📊 Report│ │ │
│              │  │  2 days ago              │ │                  │ │ └──────────┘ │ │
│              │  │                          │ │ [8]    [3]  [1]  │ │              │ │
│              │  │ 🟡 TODAY                 │ │ Appli  Inter Offr│ │ AGENT STATUS │ │
│              │  │  Review lease renewal    │ │                  │ │              │ │
│              │  │  Due at 6:00 PM          │ │ ● Frontend Dev   │ │ 🟢 Idle     │ │
│              │  │                          │ │ ● Acme Corp      │ │  No active  │ │
│              │  │  [View all reminders]    │ │ ● Startup XYZ    │ │  session    │ │
│              │  └─────────────────────────┘ │                  │ │              │ │
│              │                              │ [Open tracker]   │ │ WEATHER      │ │
│              │  ACTIVITY FEED               └──────────────────┘ │              │ │
│              │  ┌─────────────────────────────────────────────┐  │ 🌤 22°C     │ │
│              │  │ col 1–9 (9 cols)                             │  │ São Paulo   │ │
│              │  │  🕐 2m ago   Added transaction: Coffee $4.50 │  │ Partly cloud│ │
│              │  │  🕐 1h ago   Reminder snoozed: Electricity   │  └──────────────┘ │
│              │  │  🕐 3h ago   Job saved: Senior Eng @ Stripe  │                   │
│              │  │  🕐 1d ago   Agent session completed (42min) │                   │
│              │  └─────────────────────────────────────────────┘                   │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Tablet Layout (768px–1279px)

```
┌────────────────────────────────────────────────┐
│ TOPBAR  [≡]  [Search Cmd+K]  [🔔][Avatar]      │
├────────────────────────────────────────────────┤
│ Welcome: Good morning, Lucas · Thu 22 May      │
│                                                │
│ QUICK STATS: 2-column, 2-row grid              │
│  ┌────────────────┐  ┌────────────────┐        │
│  │ 💰 $4,821.50   │  │ ✓ 3 due today  │        │
│  └────────────────┘  └────────────────┘        │
│  ┌────────────────┐  ┌────────────────┐        │
│  │ 🔔 2 overdue   │  │ 💼 12 apps     │        │
│  └────────────────┘  └────────────────┘        │
│                                                │
│ ┌────────────────────┐ ┌─────────────────────┐ │
│ │ RECENT TRANSACTIONS│ │ UPCOMING TASKS      │ │
│ │  (6 cols)          │ │  (6 cols)           │ │
│ └────────────────────┘ └─────────────────────┘ │
│                                                │
│ ┌────────────────────┐ ┌─────────────────────┐ │
│ │ ACTIVE REMINDERS   │ │ JOB APPLICATIONS    │ │
│ │  (6 cols)          │ │  (6 cols)           │ │
│ └────────────────────┘ └─────────────────────┘ │
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ ACTIVITY FEED (full width)                 │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ [QUICK ACTIONS — horizontal scroll strip]      │
│  [+Expense] [+Reminder] [Agent] [Garage]       │
└────────────────────────────────────────────────┘
```

### 3.3 Mobile Layout (< 768px)

See Section 12 for detailed mobile spec.

---

## 4. Components List

### Layout Components

| Component | File Path | Notes |
|-----------|-----------|-------|
| `DashboardPage` | `app/(dashboard)/page.tsx` | RSC — async, fetches initial data server-side |
| `DashboardClient` | `components/dashboard/dashboard-client.tsx` | Client shell, manages real-time subscriptions |
| `WelcomeHeader` | `components/dashboard/welcome-header.tsx` | Server component |
| `QuickStatsRow` | `components/dashboard/quick-stats-row.tsx` | Client — animated counters |
| `DashboardGrid` | `components/dashboard/dashboard-grid.tsx` | CSS Grid orchestrator |

### Widget Components

| Component | File Path | Notes |
|-----------|-----------|-------|
| `QuickStatCard` | `components/dashboard/widgets/quick-stat-card.tsx` | Reusable stat tile |
| `RecentTransactions` | `components/dashboard/widgets/recent-transactions.tsx` | Client — sparkline |
| `UpcomingTasks` | `components/dashboard/widgets/upcoming-tasks.tsx` | Client |
| `ActiveReminders` | `components/dashboard/widgets/active-reminders.tsx` | Client — real-time |
| `JobApplicationsKanban` | `components/dashboard/widgets/job-applications-kanban.tsx` | Client |
| `WeatherWidget` | `components/dashboard/widgets/weather-widget.tsx` | Client — optional |
| `AgentStatus` | `components/dashboard/widgets/agent-status.tsx` | Client — WebSocket |
| `QuickActions` | `components/dashboard/widgets/quick-actions.tsx` | Client |
| `ActivityFeed` | `components/dashboard/widgets/activity-feed.tsx` | Client — real-time |

### Shared / UI

| Component | File Path | Notes |
|-----------|-----------|-------|
| `CommandPalette` | `components/layout/command-palette.tsx` | Global — Cmd+K |
| `SlideOver` | `components/ui/slide-over.tsx` | Used by Quick Actions forms |
| `AnimatedNumber` | `components/ui/animated-number.tsx` | Counting animation |
| `Sparkline` | `components/ui/sparkline.tsx` | Mini Recharts wrapper |
| `EmptyState` | `components/dashboard/empty-state.tsx` | Onboarding checklist |
| `SkeletonDashboard` | `components/dashboard/skeleton-dashboard.tsx` | Loading state |

### Forms (Quick Actions)

| Component | File Path | Notes |
|-----------|-----------|-------|
| `QuickAddTransactionForm` | `components/finance/quick-add-transaction-form.tsx` | Used in slide-over |
| `QuickAddReminderForm` | `components/reminders/quick-add-reminder-form.tsx` | Used in slide-over |

---

## 5. Widget Specifications

### 5.1 QuickStatCard

A stat tile occupying 3 columns of the 12-column grid. Four instances render in a horizontal row.

```typescript
// types/dashboard.ts
export interface QuickStatConfig {
  id: 'balance' | 'tasks' | 'reminders' | 'jobs'
  label: string
  value: number | string
  delta?: {
    value: number
    label: string           // e.g., "today", "vs last month"
    direction: 'up' | 'down' | 'neutral'
    isPositive: boolean     // up is good for income, bad for expenses
  }
  icon: LucideIcon
  format: 'currency' | 'count' | 'string'
  href: string              // deep-link to module
  accentColor: string       // Tailwind color class
}
```

**Four instances:**

| Stat | Value Source | Delta | Color | Positive Direction |
|------|-------------|-------|-------|--------------------|
| Balance | `finance.getAccountBalance` | Today's net | Green if positive | up |
| Tasks Due Today | `calendar.getTasksDueToday` count | Overdue count | Amber | down (fewer is better) |
| Active Reminders | `reminders.getDueTodayCount` | Overdue count | Red if overdue | down |
| Job Applications | `jobs.getApplicationCount` | Stage breakdown | Blue | up |

**Behavior:**
- On mount, value animates from 0 to actual value over 800ms (spring easing).
- Delta badge uses green/red/amber color coding.
- Click anywhere on the card navigates to `href`.
- On hover, card lifts 4px with shadow (Framer Motion `whileHover`).
- On data refresh, number re-animates from previous value to new value.

**Skeleton:** Single gray rounded rectangle, full card dimensions.

```typescript
// components/dashboard/widgets/quick-stat-card.tsx
interface QuickStatCardProps {
  config: QuickStatConfig
  isLoading: boolean
}
```

---

### 5.2 RecentTransactions

Displays the last 5 transactions with a sparkline chart showing the 30-day spending trend.

```typescript
// types/dashboard.ts
export interface RecentTransactionItem {
  id: string
  date: Date
  description: string
  amount: number          // positive = income, negative = expense
  type: 'income' | 'expense'
  category: {
    name: string
    color: string         // hex
    icon: string          // Lucide icon name
  }
}
```

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Recent Transactions              [View all →]    │
│─────────────────────────────────────────────────│
│ ☕ Coffee           Jan 22  10:30  -$4.50        │
│ 💼 Salary           Jan 22  09:00  +$3,200.00   │
│ 🛒 Groceries        Jan 21  18:45  -$67.30       │
│ 📺 Netflix          Jan 21  00:00  -$15.90       │
│ 🏋 Gym membership   Jan 20  08:00  -$50.00       │
│─────────────────────────────────────────────────│
│ 30-day spending trend:                          │
│ ╭─────────────────────────────╮                 │
│ │     ∧      ∧                │  Sparkline      │
│ │    / \    / \    /\         │  (Recharts      │
│ │___/   \__/   \__/  \_____   │   AreaChart)    │
│ ╰─────────────────────────────╯                 │
└─────────────────────────────────────────────────┘
```

**tRPC:** `finance.getRecentTransactions({ limit: 5 })` + `finance.getSparklineData({ days: 30 })`

**Behavior:**
- Income rows: text-emerald-500, `+$` prefix.
- Expense rows: text-red-400, `-$` prefix.
- Category icon rendered as a colored dot + Lucide icon.
- Sparkline uses category-agnostic daily total expenses as area fill.
- Skeleton: 5 gray rows + gray rectangle for sparkline.
- "View all →" navigates to `/finance/transactions`.

---

### 5.3 UpcomingTasks

Shows the next 3 tasks from Calendar, sorted by due date/time ascending.

```typescript
// types/dashboard.ts
export interface UpcomingTaskItem {
  id: string
  title: string
  dueAt: Date
  isAllDay: boolean
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  calendarColor: string
}
```

**Layout:**
```
┌──────────────────────────────────────┐
│ Upcoming Tasks          [Calendar →] │
│──────────────────────────────────────│
│ ⏱ Today, 09:00                       │
│ ○ Team standup           HIGH ●      │
│                                      │
│ ⏱ Today, 14:00                       │
│ ○ Code review — PR #142  MED  ●      │
│                                      │
│ ⏱ Tomorrow               LOW  ●      │
│ ○ Send invoice to Acme              │
│                                      │
│ ── + 4 more tasks ──                 │
└──────────────────────────────────────┘
```

**Behavior:**
- Tasks grouped by relative date label: "Today", "Tomorrow", "Thursday", etc.
- Priority badge: red (high), amber (medium), gray (low).
- Clicking a task opens `/calendar?taskId={id}`.
- "Check off" checkbox triggers `calendar.completeTask` mutation with optimistic update.
- Overdue tasks (past due + not completed) shown in red with a `!` badge.

**tRPC:** `calendar.getUpcomingTasks({ limit: 3 })`

---

### 5.4 ActiveReminders

Displays reminders that are overdue or due today, sorted by urgency.

```typescript
// types/dashboard.ts
export interface ActiveReminderItem {
  id: string
  title: string
  dueAt: Date
  isOverdue: boolean
  snoozedUntil: Date | null
  priority: 'low' | 'medium' | 'high'
  recurringInfo: string | null   // e.g., "Every Monday"
}
```

**Layout:**
```
┌──────────────────────────────────────────┐
│ Active Reminders             [All →]     │
│──────────────────────────────────────────│
│ 🔴 OVERDUE · 2 days ago                  │
│  Pay electricity bill                    │
│  [Dismiss] [Snooze 1h]                   │
│                                          │
│ 🟡 TODAY · 6:00 PM                       │
│  Review lease renewal                    │
│  [Dismiss] [Snooze 1h]                   │
│                                          │
│ ── No more active reminders ──           │
└──────────────────────────────────────────┘
```

**Behavior:**
- Overdue: red background tint, `🔴` icon, timestamp says "X days ago".
- Due today: amber background tint, `🟡` icon, shows due time.
- "Dismiss" triggers `reminders.dismiss` mutation; card animates out.
- "Snooze 1h" triggers `reminders.snooze({ duration: 60 })` mutation.
- Real-time updates via WebSocket — if reminder becomes due while page is open, it appears with an animation.
- Push notification badge on topbar bell icon reflects count.

**tRPC:** `reminders.getActiveReminders()`

---

### 5.5 JobApplicationsKanban (Mini View)

A compact read-only Kanban showing column counts and the 3 most recent applications.

```typescript
// types/dashboard.ts
export interface JobApplicationsSnapshot {
  columns: {
    id: string
    name: string              // Applied, Screening, Interview, Offer, Rejected
    count: number
    color: string
  }[]
  recentApplications: {
    id: string
    jobTitle: string
    company: string
    stage: string
    appliedAt: Date
    logoUrl: string | null
  }[]
}
```

**Layout:**
```
┌──────────────────────────────────────────┐
│ Job Applications              [Tracker→] │
│──────────────────────────────────────────│
│ [8]Applied  [3]Screening  [1]Interview   │
│ [0]Offer    [2]Rejected                  │
│──────────────────────────────────────────│
│ 🏢 Frontend Dev · Acme Corp  Applied ●  │
│ 🏢 Sr Engineer · Startup XYZ Interview● │
│ 🏢 Lead Dev · BigCorp       Screening●  │
└──────────────────────────────────────────┘
```

**Behavior:**
- Column count badges are colored per stage (blue, amber, green, emerald, red).
- Clicking a column badge navigates to `/jobs/tracker?stage={id}`.
- Company logos rendered with Next.js Image; fallback to initials avatar.
- "Tracker →" navigates to `/jobs/tracker`.

**tRPC:** `jobs.getDashboardSnapshot()`

---

### 5.6 WeatherWidget

Optional widget shown only when user has granted location or manually set a city.

```typescript
// types/dashboard.ts
export interface WeatherData {
  city: string
  country: string
  temperature: number       // Celsius
  feelsLike: number
  condition: string         // "Partly cloudy"
  icon: string              // weather icon code
  humidity: number
  uvIndex: number
  todayHigh: number
  todayLow: number
}
```

**Layout:**
```
┌──────────────────────┐
│ 🌤 São Paulo    22°C │
│ Partly cloudy        │
│ Feels like 24° · UV3 │
│ H:26° L:18°          │
└──────────────────────┘
```

**Behavior:**
- Fetched server-side using Open-Meteo API (free, no key needed).
- Cached in Redis for 30 minutes.
- If no location configured: widget shows "Set location →" link to settings.
- Weather icon mapped from WMO weather codes to Lucide icons (or custom SVG).

**tRPC:** `dashboard.getWeather()`

---

### 5.7 AgentStatus

Shows the current state of the AI Agent. If idle, shows a prompt to start a session.

```typescript
// types/dashboard.ts
export type AgentSessionStatus = 'idle' | 'running' | 'paused' | 'error'

export interface AgentStatusData {
  status: AgentSessionStatus
  activeSession: {
    id: string
    name: string
    startedAt: Date
    lastActivity: Date
    currentTool: string | null
    completedSteps: number
    totalEstimatedSteps: number | null
  } | null
}
```

**Layout (running state):**
```
┌────────────────────────────────────────┐
│ 🟢 Agent Running          [Open →]    │
│ "Fix bug in issue #42"                 │
│ ████████████░░░░ 8/~12 steps          │
│ Current: read_file(src/api/auth.ts)   │
│ Elapsed: 4m 32s                       │
│ [Pause]               [Cancel]        │
└────────────────────────────────────────┘
```

**Layout (idle state):**
```
┌────────────────────────────────────────┐
│ 🔵 Agent                              │
│ No active session                      │
│ [Start new session →]                  │
└────────────────────────────────────────┘
```

**Behavior:**
- Connects to WebSocket on mount; listens for `agent:token`, `agent:tool-call`, `agent:done`.
- Progress bar animates smoothly between step counts.
- "Open →" navigates to `/agent/{sessionId}`.
- Elapsed time ticks every second via `setInterval`.

**WebSocket events consumed:** `agent:tool-call`, `agent:done`, `agent:error`

---

### 5.8 QuickActions Panel

A vertical stack of action buttons occupying 3 columns on the right side.

```typescript
// types/dashboard.ts
export interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
  variant: 'primary' | 'secondary' | 'ghost'
  action: 'slide-over' | 'navigate' | 'modal'
  target: string            // route or slide-over component name
  shortcut?: string         // keyboard shortcut label
}
```

**Actions defined:**

| Label | Icon | Action | Target | Shortcut |
|-------|------|--------|--------|----------|
| Add Expense | `PlusCircle` | slide-over | `QuickAddTransactionForm` | `N` |
| Add Reminder | `Bell` | slide-over | `QuickAddReminderForm` | `R` |
| Open Agent | `Bot` | navigate | `/agent` | `A` |
| Garage | `Warehouse` | navigate | `/smarthome` | `G` |
| New Report | `BarChart2` | navigate | `/reports/new` | — |

**Behavior:**
- Each button has a hover glow effect using `box-shadow` with the accent color.
- Keyboard shortcuts shown as small badges (e.g., `N`).
- "Add Expense" and "Add Reminder" open a `SlideOver` panel from the right.
- SlideOver forms submit via tRPC mutation; on success, relevant dashboard widgets refetch.

---

### 5.9 ActivityFeed

A chronological reverse feed of all platform events across all modules.

```typescript
// types/dashboard.ts
export type ActivityEventType =
  | 'transaction.created'
  | 'transaction.updated'
  | 'reminder.snoozed'
  | 'reminder.dismissed'
  | 'job.saved'
  | 'job.stage_changed'
  | 'agent.session_started'
  | 'agent.session_completed'
  | 'task.completed'
  | 'report.generated'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  summary: string           // human-readable, e.g., "Added transaction: Coffee $4.50"
  occurredAt: Date
  metadata: Record<string, unknown>
  href: string | null       // deep-link to the item
}
```

**Behavior:**
- Shows last 10 events.
- New events prepend with a slide-in animation.
- Each event has a distinct icon based on `type`.
- Timestamps shown as relative time ("2m ago", "1h ago", "Yesterday").
- Clicking an event navigates to `href` if set.

**tRPC:** `dashboard.getActivityFeed({ limit: 10 })`

---

## 6. Data Model

### 6.1 tRPC Procedures Called by Dashboard

```typescript
// All called in parallel via Promise.all in the RSC page

// Server-side initial fetch (page.tsx — RSC)
const [
  accountBalance,
  tasksDueToday,
  activeReminders,
  jobSnapshot,
  recentTransactions,
  sparklineData,
  agentStatus,
  activityFeed,
  weather,
] = await Promise.all([
  caller.finance.getAccountBalance(),
  caller.calendar.getUpcomingTasks({ limit: 3 }),
  caller.reminders.getActiveReminders(),
  caller.jobs.getDashboardSnapshot(),
  caller.finance.getRecentTransactions({ limit: 5 }),
  caller.finance.getSparklineData({ days: 30 }),
  caller.agent.getActiveSessionStatus(),
  caller.dashboard.getActivityFeed({ limit: 10 }),
  caller.dashboard.getWeather(),
])
```

### 6.2 Procedure Signatures

```typescript
// finance.getAccountBalance
// Input: none (uses session userId)
// Output:
{
  balance: number           // current total across all accounts
  currency: string          // 'BRL' | 'USD' etc.
  todayDelta: number        // net change today
  todayDeltaType: 'income' | 'expense' | 'neutral'
}

// calendar.getUpcomingTasks
// Input: { limit: number }
// Output: UpcomingTaskItem[]

// reminders.getActiveReminders
// Input: none
// Output: ActiveReminderItem[]

// jobs.getDashboardSnapshot
// Input: none
// Output: JobApplicationsSnapshot

// finance.getRecentTransactions
// Input: { limit: number }
// Output: RecentTransactionItem[]

// finance.getSparklineData
// Input: { days: number }
// Output: { date: string; total: number }[]

// agent.getActiveSessionStatus
// Input: none
// Output: AgentStatusData

// dashboard.getActivityFeed
// Input: { limit: number; cursor?: string }
// Output: { events: ActivityEvent[]; nextCursor: string | null }

// dashboard.getWeather
// Input: none (reads user.location from DB)
// Output: WeatherData | null
```

---

## 7. State Management

### 7.1 Zustand Store — `useDashboardStore`

```typescript
// stores/dashboard-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DashboardState {
  // Widget visibility preferences
  hiddenWidgets: string[]
  toggleWidget: (widgetId: string) => void

  // Command palette
  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void

  // Quick actions slide-over
  activeSlideOver: 'transaction' | 'reminder' | null
  openSlideOver: (type: 'transaction' | 'reminder') => void
  closeSlideOver: () => void

  // Last seen activity cursor (for red-dot indicators)
  lastSeenActivityAt: Date | null
  markActivitySeen: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      hiddenWidgets: [],
      toggleWidget: (id) =>
        set((s) => ({
          hiddenWidgets: s.hiddenWidgets.includes(id)
            ? s.hiddenWidgets.filter((w) => w !== id)
            : [...s.hiddenWidgets, id],
        })),
      isCommandPaletteOpen: false,
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
      activeSlideOver: null,
      openSlideOver: (type) => set({ activeSlideOver: type }),
      closeSlideOver: () => set({ activeSlideOver: null }),
      lastSeenActivityAt: null,
      markActivitySeen: () => set({ lastSeenActivityAt: new Date() }),
    }),
    { name: 'dashboard-store', version: 1 },
  ),
)
```

### 7.2 TanStack Query — Key Conventions

```typescript
// Query keys (centralized in lib/query-keys.ts)
export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    balance: () => [...queryKeys.dashboard.all, 'balance'] as const,
    tasks: (limit: number) => [...queryKeys.dashboard.all, 'tasks', limit] as const,
    reminders: () => [...queryKeys.dashboard.all, 'reminders'] as const,
    jobSnapshot: () => [...queryKeys.dashboard.all, 'job-snapshot'] as const,
    recentTransactions: (limit: number) => [...queryKeys.dashboard.all, 'recent-transactions', limit] as const,
    sparkline: (days: number) => [...queryKeys.dashboard.all, 'sparkline', days] as const,
    agentStatus: () => [...queryKeys.dashboard.all, 'agent-status'] as const,
    activityFeed: () => [...queryKeys.dashboard.all, 'activity-feed'] as const,
    weather: () => [...queryKeys.dashboard.all, 'weather'] as const,
  },
} as const

// Refresh strategy
// - balance: staleTime: 0, refetchInterval: 30_000 (real-time financial data)
// - tasks: staleTime: 60_000, refetchOnWindowFocus: true
// - reminders: staleTime: 0, refetchInterval: 15_000
// - agentStatus: staleTime: 0, refetchInterval: 5_000 (or replaced by WS)
// - weather: staleTime: 1_800_000 (30 min)
// - activityFeed: staleTime: 30_000, refetchOnWindowFocus: true
```

### 7.3 Optimistic Updates

```typescript
// When user dismisses a reminder from the dashboard:
const utils = api.useUtils()

const dismiss = api.reminders.dismiss.useMutation({
  onMutate: async ({ reminderId }) => {
    await utils.reminders.getActiveReminders.cancel()
    const prev = utils.reminders.getActiveReminders.getData()

    utils.reminders.getActiveReminders.setData(undefined, (old) =>
      old?.filter((r) => r.id !== reminderId) ?? [],
    )

    return { prev }
  },
  onError: (_err, _vars, ctx) => {
    if (ctx?.prev) utils.reminders.getActiveReminders.setData(undefined, ctx.prev)
  },
  onSettled: () => {
    void utils.reminders.getActiveReminders.invalidate()
  },
})
```

---

## 8. Animations

### 8.1 Staggered Card Entrance

```typescript
// components/dashboard/dashboard-grid.tsx
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,   // 70ms between each card
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

// Wrap DashboardGrid in <motion.div variants={containerVariants}>
// Wrap each widget in <motion.div variants={cardVariants}>
```

### 8.2 Number Counting Animations

```typescript
// components/ui/animated-number.tsx
'use client'

import { useSpring, animated } from '@react-spring/web'

interface AnimatedNumberProps {
  value: number
  format?: (v: number) => string
  duration?: number
}

export function AnimatedNumber({ value, format, duration = 800 }: AnimatedNumberProps) {
  const spring = useSpring({
    from: { val: 0 },
    to: { val: value },
    config: { duration, easing: easeCubicOut },
    reset: false,
  })

  return (
    <animated.span>
      {spring.val.to((v) => (format ? format(v) : Math.round(v).toString()))}
    </animated.span>
  )
}

// Usage in QuickStatCard:
// <AnimatedNumber value={balance} format={(v) => formatCurrency(v, 'BRL')} />
// When value prop changes (e.g., after refetch), spring animates from old to new value
```

### 8.3 Real-Time Updates

```typescript
// components/dashboard/dashboard-client.tsx
'use client'

import { useEffect } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { api } from '@/lib/trpc/client'

export function DashboardClient() {
  const socket = useSocket()
  const utils = api.useUtils()

  useEffect(() => {
    // When a new activity event fires, refetch the feed
    socket.on('notification', () => {
      void utils.dashboard.getActivityFeed.invalidate()
    })

    // When agent emits events, invalidate agent status
    socket.on('agent:tool-call', () => {
      void utils.agent.getActiveSessionStatus.invalidate()
    })
    socket.on('agent:done', () => {
      void utils.agent.getActiveSessionStatus.invalidate()
    })

    return () => {
      socket.off('notification')
      socket.off('agent:tool-call')
      socket.off('agent:done')
    }
  }, [socket, utils])

  return null  // purely side-effectful, no UI
}
```

### 8.4 Reminder Card Exit Animation

```typescript
// When a reminder is dismissed, it animates out:
<AnimatePresence>
  {reminders.map((r) => (
    <motion.div
      key={r.id}
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.25 } }}
    >
      <ReminderRow reminder={r} onDismiss={handleDismiss} />
    </motion.div>
  ))}
</AnimatePresence>
```

---

## 9. Command Palette (Cmd+K)

### 9.1 Overview

The Command Palette is a global search and action interface accessible from anywhere in the platform via `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux). It renders as a centered modal overlay.

### 9.2 Structure

```
┌─────────────────────────────────────────────────────────┐
│  [🔍  Search everything...                     Esc]     │
│─────────────────────────────────────────────────────────│
│  RECENT                                                 │
│  ↪  Coffee $4.50 — Finance                             │
│  ↪  Review lease — Reminders                           │
│                                                         │
│  TRANSACTIONS                                           │
│  💳  Salary Jan 22 · +$3,200.00                        │
│  💳  Netflix · -$15.90                                  │
│                                                         │
│  TASKS                                                  │
│  ✓   Team standup · Today 09:00                        │
│                                                         │
│  ACTIONS                                               │
│  ⚡  Add new transaction          N                    │
│  ⚡  Add new reminder             R                    │
│  ⚡  Open Agent                   A                    │
│  ⚡  Open Garage                  G                    │
│─────────────────────────────────────────────────────────│
│  ↑↓ Navigate  · Enter Open  · Esc Close                │
└─────────────────────────────────────────────────────────┘
```

### 9.3 Search Sources

| Group | Source | tRPC Procedure | Fields Searched |
|-------|---------|---------------|-----------------|
| Transactions | Finance | `finance.search` | description, category, amount |
| Tasks | Calendar | `calendar.searchTasks` | title |
| Reminders | Reminders | `reminders.search` | title |
| Job Applications | Jobs | `jobs.search` | job title, company |
| Navigation | Static | N/A | page names |
| Actions | Static | N/A | quick action labels |

### 9.4 Behavior

```typescript
// components/layout/command-palette.tsx
// - Opens on Cmd+K; closes on Esc or backdrop click
// - Input is auto-focused on open
// - Debounced search: 200ms after last keystroke
// - Results grouped by category, max 3 per group
// - Keyboard navigation: ↑↓ to select, Enter to execute
// - Selected item highlighted with accent background
// - No results: shows "No results for '{query}'" with suggested actions
// - All searches use a single tRPC procedure: dashboard.search({ query })
//   which fans out to all module search procedures server-side
```

```typescript
// tRPC procedure:
// dashboard.search
// Input: { query: string }
// Output:
interface SearchResults {
  groups: {
    label: string
    items: {
      id: string
      title: string
      subtitle: string | null
      href: string
      icon: string            // Lucide icon name
      action?: () => void     // for quick actions
    }[]
  }[]
}
```

---

## 10. Empty State (Onboarding)

Shown when the user has no data across any module (first login or fresh account).

### 10.1 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Welcome to Mission Control, Lucas!                 │
│         Your personal command center is almost ready.          │
│                                                                 │
│  ██████████░░░░░░░░░░  2 / 5 steps complete                    │
│                                                                 │
│  ✅  1. Account created                                         │
│  ✅  2. Google Calendar connected                               │
│  ○   3. Add your first transaction    [Set up Finance →]        │
│  ○   4. Set up your first reminder    [Add Reminder →]          │
│  ○   5. Configure AI models           [Open Models →]          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  💡 Tip: Press Cmd+K anytime to search or take action  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Checklist Items

```typescript
// types/dashboard.ts
export interface OnboardingStep {
  id: string
  label: string
  description: string
  completed: boolean
  href: string
  ctaLabel: string
}

// Steps evaluated server-side in dashboard.getOnboardingStatus
const steps: OnboardingStep[] = [
  {
    id: 'account',
    label: 'Account created',
    description: 'You are logged in!',
    completed: true,        // always true by definition
    href: '/settings',
    ctaLabel: 'View settings',
  },
  {
    id: 'calendar',
    label: 'Connect Google Calendar',
    description: 'Sync your events and tasks',
    completed: hasGoogleCalendarToken,
    href: '/calendar?setup=true',
    ctaLabel: 'Connect calendar',
  },
  {
    id: 'finance',
    label: 'Add your first transaction',
    description: 'Start tracking your spending',
    completed: transactionCount > 0,
    href: '/finance',
    ctaLabel: 'Set up Finance',
  },
  {
    id: 'reminder',
    label: 'Create a reminder',
    description: 'Never miss an important task',
    completed: reminderCount > 0,
    href: '/reminders',
    ctaLabel: 'Add Reminder',
  },
  {
    id: 'models',
    label: 'Configure AI models',
    description: 'Connect your preferred LLM provider',
    completed: hasAnyModelKey,
    href: '/models',
    ctaLabel: 'Open Models',
  },
]
```

### 10.3 Behavior

- Once all 5 steps are complete, the onboarding state is dismissed and never shown again (stored in user preferences in DB).
- Progress bar animates when a step is completed.
- Completed steps show a green checkmark with a scale animation.
- The empty state component is shown instead of the normal widget grid only if `completedSteps < 2` AND `hasNoData === true`.

---

## 11. Keyboard Shortcuts

All shortcuts are active when the dashboard is the focused page. They do not fire if an input is focused.

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open Command Palette |
| `N` | Open "Add Transaction" slide-over |
| `R` | Open "Add Reminder" slide-over |
| `A` | Navigate to Agent (`/agent`) |
| `G` | Navigate to Smart Home / Garage (`/smarthome`) |
| `F` | Navigate to Finance (`/finance`) |
| `J` | Navigate to Jobs (`/jobs/tracker`) |
| `C` | Navigate to Calendar (`/calendar`) |
| `?` | Open keyboard shortcuts reference modal |
| `Esc` | Close any open panel/modal |
| `Tab` | Move focus to next widget |
| `Shift+Tab` | Move focus to previous widget |

**Implementation:**

```typescript
// hooks/use-dashboard-shortcuts.ts
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardStore } from '@/stores/dashboard-store'

export function useDashboardShortcuts() {
  const router = useRouter()
  const { openCommandPalette, openSlideOver } = useDashboardStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement?.tagName === 'INPUT'
        || document.activeElement?.tagName === 'TEXTAREA'
      if (isInputFocused) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openCommandPalette()
        return
      }

      switch (e.key) {
        case 'n': openSlideOver('transaction'); break
        case 'r': openSlideOver('reminder'); break
        case 'a': router.push('/agent'); break
        case 'g': router.push('/smarthome'); break
        case 'f': router.push('/finance'); break
        case 'j': router.push('/jobs/tracker'); break
        case 'c': router.push('/calendar'); break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openCommandPalette, openSlideOver, router])
}
```

---

## 12. Mobile Layout (< 768px)

### 12.1 Layout Rules

| Rule | Value |
|------|-------|
| Grid | Single column (12 cols → 1 col effective) |
| Sidebar | Hidden; replaced by bottom navigation bar |
| Topbar | Simplified: logo + bell icon + avatar only |
| Widgets shown | QuickStats, RecentTransactions, UpcomingTasks, ActiveReminders |
| Widgets hidden | ActivityFeed (accessible via dedicated tab), WeatherWidget (collapsed to a line in header) |

### 12.2 Mobile Wireframe

```
┌─────────────────────────────────┐
│ Mission Control  [🔔2]  [Lucas] │
├─────────────────────────────────┤
│ 🌤 22°C · Good morning, Lucas  │
│ Thursday, 22 May 2026           │
├─────────────────────────────────┤
│ QUICK STATS — horizontal scroll │
│ ┌────────┐┌────────┐┌────────┐  │
│ │$4,821  ││3 tasks ││2 remind│  │
│ └────────┘└────────┘└────────┘  │
│                     → swipe     │
├─────────────────────────────────┤
│ ACTIVE REMINDERS                │
│ 🔴 Pay electricity (overdue)    │
│   [Dismiss] [Snooze]            │
│ 🟡 Review lease · 6PM           │
│   [Dismiss] [Snooze]            │
├─────────────────────────────────┤
│ UPCOMING TASKS                  │
│ ⏱ 09:00  Team standup          │
│ ⏱ 14:00  Code review PR        │
│ ⏱ Tomorrow  Send invoice        │
├─────────────────────────────────┤
│ RECENT TRANSACTIONS             │
│ Coffee        -$4.50  Jan 22   │
│ Salary    +$3,200.00  Jan 22   │
│ Groceries    -$67.30  Jan 21   │
│            [View all]           │
├─────────────────────────────────┤
│ QUICK ACTIONS                   │
│ [+Expense]  [+Reminder]  [More] │
├─────────────────────────────────┤
│ ⌂ Home  ₿ Finance  ✓ Tasks  ⋯  │
└─────────────────────────────────┘
```

### 12.3 Mobile-Specific Behaviors

- Quick Stats scroll horizontally (overflow-x: auto, snap-x, snap-mandatory).
- Each QuickStatCard is `min-width: 160px` on mobile.
- "Add Expense" / "Add Reminder" open full-screen bottom sheets instead of slide-overs.
- Command Palette triggered by tapping the search icon in the topbar.
- No widget visibility customization on mobile (simplified to fixed set).
- Bottom navigation: Home, Finance, Tasks, More (opens a bottom sheet with all module links).

---

## 13. Testing

### 13.1 Unit Tests (Vitest)

```typescript
// tests/unit/widgets/quick-stat-card.test.tsx
import { render, screen } from '@testing-library/react'
import { QuickStatCard } from '@/components/dashboard/widgets/quick-stat-card'
import { describe, it, expect } from 'vitest'

describe('QuickStatCard', () => {
  it('renders the label and formatted value', () => {
    render(<QuickStatCard config={{
      id: 'balance',
      label: 'Balance',
      value: 4821.5,
      format: 'currency',
      icon: DollarSign,
      href: '/finance',
      accentColor: 'emerald',
    }} isLoading={false} />)

    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByText(/4.821/)).toBeInTheDocument()  // locale formatting
  })

  it('renders skeleton when isLoading is true', () => {
    render(<QuickStatCard config={{ ... }} isLoading={true} />)
    expect(document.querySelector('[data-testid="skeleton"]')).toBeInTheDocument()
  })

  it('shows positive delta in green', () => {
    const { container } = render(<QuickStatCard config={{
      ...baseConfig,
      delta: { value: 200, label: 'today', direction: 'up', isPositive: true },
    }} isLoading={false} />)

    const badge = container.querySelector('[data-testid="delta-badge"]')
    expect(badge?.className).toMatch(/emerald|green/)
  })
})
```

```typescript
// tests/unit/widgets/active-reminders.test.tsx
describe('ActiveReminders', () => {
  it('shows overdue reminders first', () => {
    const reminders = [
      { id: '1', title: 'Due today', isOverdue: false, dueAt: todayAt6pm, ... },
      { id: '2', title: 'Overdue task', isOverdue: true, dueAt: twoDaysAgo, ... },
    ]
    render(<ActiveReminders reminders={reminders} />)
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Overdue task')
  })

  it('calls dismiss mutation on dismiss click', async () => {
    const mockDismiss = vi.fn()
    render(<ActiveReminders reminders={[mockReminder]} onDismiss={mockDismiss} />)
    await userEvent.click(screen.getByText('Dismiss'))
    expect(mockDismiss).toHaveBeenCalledWith('reminder-id-1')
  })
})
```

```typescript
// tests/unit/hooks/use-dashboard-shortcuts.test.ts
describe('useDashboardShortcuts', () => {
  it('opens command palette on Cmd+K', () => {
    const { openCommandPalette } = renderHook(() => useDashboardShortcuts())
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(useDashboardStore.getState().isCommandPaletteOpen).toBe(true)
  })

  it('does not fire shortcuts when input is focused', () => {
    renderHook(() => useDashboardShortcuts())
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    fireEvent.keyDown(window, { key: 'n' })
    expect(useDashboardStore.getState().activeSlideOver).toBeNull()
  })
})
```

### 13.2 Integration Tests

```typescript
// tests/integration/dashboard/dashboard-data.test.ts
// Tests tRPC procedures that aggregate data for the dashboard

describe('dashboard.getActivityFeed', () => {
  it('returns last 10 events across all modules', async () => {
    const caller = createCaller({ session: testSession })
    const { events } = await caller.dashboard.getActivityFeed({ limit: 10 })
    expect(events.length).toBeLessThanOrEqual(10)
    // Events sorted by occurredAt desc
    for (let i = 1; i < events.length; i++) {
      expect(events[i-1]!.occurredAt >= events[i]!.occurredAt).toBe(true)
    }
  })
})

describe('reminders.dismiss', () => {
  it('marks reminder as dismissed and removes it from active list', async () => {
    const caller = createCaller({ session: testSession })
    const reminder = await createTestReminder({ userId: testUser.id, dueAt: new Date() })
    await caller.reminders.dismiss({ reminderId: reminder.id })
    const active = await caller.reminders.getActiveReminders()
    expect(active.find((r) => r.id === reminder.id)).toBeUndefined()
  })
})
```

### 13.3 E2E Tests (Playwright)

```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Assumes authenticated via Playwright auth state
  })

  test('loads all widgets within 3 seconds', async ({ page }) => {
    await expect(page.getByTestId('widget-balance')).toBeVisible({ timeout: 3000 })
    await expect(page.getByTestId('widget-tasks')).toBeVisible({ timeout: 3000 })
    await expect(page.getByTestId('widget-reminders')).toBeVisible({ timeout: 3000 })
    await expect(page.getByTestId('widget-jobs')).toBeVisible({ timeout: 3000 })
  })

  test('opens command palette on Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+k')
    await expect(page.getByRole('combobox', { name: /search/i })).toBeVisible()
  })

  test('quick action: add transaction', async ({ page }) => {
    await page.keyboard.press('n')
    await expect(page.getByRole('dialog', { name: /add transaction/i })).toBeVisible()
    await page.getByLabel('Amount').fill('42.50')
    await page.getByLabel('Description').fill('Test coffee')
    await page.getByRole('button', { name: /save/i }).click()
    // Widget should update
    await expect(page.getByText('Test coffee')).toBeVisible({ timeout: 2000 })
  })

  test('dismissing reminder removes it from widget', async ({ page }) => {
    const reminderTitle = await page.getByTestId('active-reminder-0').textContent()
    await page.getByTestId('dismiss-reminder-0').click()
    await expect(page.getByText(reminderTitle!)).not.toBeVisible({ timeout: 1000 })
  })

  test('mobile: quick stats scroll horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    const statsRow = page.getByTestId('quick-stats-row')
    const scrollWidth = await statsRow.evaluate((el) => el.scrollWidth)
    const clientWidth = await statsRow.evaluate((el) => el.clientWidth)
    expect(scrollWidth).toBeGreaterThan(clientWidth)
  })
})
```

---

## 14. Performance

### 14.1 React Server Components

The `page.tsx` root is an async RSC that:
1. Calls all tRPC procedures in parallel (`Promise.all`).
2. Passes initial data as props to Client Components.
3. Client Components hydrate from initial data instantly (no loading flash for above-the-fold content).

```typescript
// app/(dashboard)/page.tsx — RSC
import { createCaller } from '@/lib/trpc/server'
import { DashboardGrid } from '@/components/dashboard/dashboard-grid'

export default async function DashboardPage() {
  const caller = await createCaller()

  // Parallel server-side data fetch
  const [balance, tasks, reminders, jobs, transactions, sparkline, agentStatus, feed, weather] =
    await Promise.all([
      caller.finance.getAccountBalance(),
      caller.calendar.getUpcomingTasks({ limit: 3 }),
      caller.reminders.getActiveReminders(),
      caller.jobs.getDashboardSnapshot(),
      caller.finance.getRecentTransactions({ limit: 5 }),
      caller.finance.getSparklineData({ days: 30 }),
      caller.agent.getActiveSessionStatus(),
      caller.dashboard.getActivityFeed({ limit: 10 }),
      caller.dashboard.getWeather(),
    ])

  return (
    <DashboardGrid
      initialData={{ balance, tasks, reminders, jobs, transactions, sparkline, agentStatus, feed, weather }}
    />
  )
}
```

### 14.2 Lazy Loading

```typescript
// Heavy widgets lazy-loaded to keep initial bundle lean
import dynamic from 'next/dynamic'

const AgentStatus = dynamic(
  () => import('@/components/dashboard/widgets/agent-status'),
  { loading: () => <AgentStatusSkeleton />, ssr: false },
)

const JobApplicationsKanban = dynamic(
  () => import('@/components/dashboard/widgets/job-applications-kanban'),
  { loading: () => <KanbanSkeleton />, ssr: false },
)

// Recharts is lazy-loaded within the sparkline component
const SparklineChart = dynamic(
  () => import('@/components/ui/sparkline').then((m) => ({ default: m.Sparkline })),
  { ssr: false },
)
```

### 14.3 Skeleton Specifics

Each widget renders its own skeleton that exactly matches its loaded dimensions, preventing layout shift (CLS = 0).

```typescript
// components/dashboard/skeleton-dashboard.tsx
// Rendered server-side as the Suspense fallback

export function SkeletonDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Quick Stats Row */}
      <div className="col-span-12 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      {/* Main widgets */}
      <Skeleton className="col-span-5 h-[280px] rounded-xl" />
      <Skeleton className="col-span-4 h-[280px] rounded-xl" />
      <Skeleton className="col-span-3 h-[280px] rounded-xl" />
      <Skeleton className="col-span-5 h-[220px] rounded-xl" />
      <Skeleton className="col-span-4 h-[220px] rounded-xl" />
      {/* Activity feed */}
      <Skeleton className="col-span-9 h-[140px] rounded-xl" />
    </div>
  )
}
```

### 14.4 Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 1.5s (initial data server-rendered) |
| CLS | 0 (skeletons match exact widget dimensions) |
| FID / INP | < 50ms (no heavy JS on initial load) |
| TTI | < 2s |
| Bundle size (initial) | < 200KB gzipped |
| Widget data load | < 500ms (parallel server-side fetches) |
| Real-time latency | < 200ms (WebSocket event to UI update) |

---

*Last updated: 2026-05-22 | Version: 1.0.0*
