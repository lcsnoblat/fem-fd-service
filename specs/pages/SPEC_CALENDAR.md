# SPEC_CALENDAR.md — Mission Control: Calendar Module

**Version:** 1.0.0
**Status:** Ready for Implementation
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, dnd-kit, Vercel AI SDK

---

## 1. Overview

The Calendar module is the temporal backbone of Mission Control. It provides a unified view of tasks, events, and reminders with full bidirectional Google Calendar synchronization. Users can switch between month, week, day, and agenda views, create events by clicking on time slots, drag events between dates and times, and manage a full-featured task list anchored to due dates. The module surfaces AI-powered scheduling suggestions based on free time analysis and intelligent task breakdown from plain-language descriptions.

### Core Capabilities
- Full calendar (month / week / day / agenda views)
- Task management with priority, tags, projects, and time estimates
- Recurring events with full RFC 5545 recurrence rule support
- Bidirectional Google Calendar sync (OAuth 2.0, 15-minute background polling)
- AI time-blocking suggestions and task decomposition
- Drag-and-drop via dnd-kit (events across time slots, tasks onto dates)
- Animated view transitions (Framer Motion)

---

## 2. User Stories

1. **As a user**, I want to view all my events and tasks in a monthly calendar grid so that I can understand my schedule at a glance and spot busy vs. free weeks.

2. **As a user**, I want to switch to a weekly view with an hourly grid so that I can see exactly when my day is blocked and find open time slots for focused work.

3. **As a user**, I want to connect my Google Calendar so that events I create in Mission Control automatically appear in Google Calendar and vice versa, keeping everything synchronized without manual effort.

4. **As a user**, I want to create a task with a due date, priority, and time estimate directly from the calendar so that I can commit to when I will do the work, not just what the work is.

5. **As a user**, I want to drag an event from one time slot to another in the week view so that I can reschedule meetings quickly without opening an edit form.

6. **As a user**, I want the AI to analyze my free time and suggest where to block time for important tasks so that I can maintain focus time without manually scanning my calendar.

7. **As a user**, I want to see recurring events rendered correctly across the calendar (e.g., "Team Standup every weekday") so that I can rely on the calendar for habitual commitments without recreating them.

---

## 3. UI Layout

### 3.1 Full-Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ MISSION CONTROL                                              [User Avatar] [⚙️]  │
├──────────┬──────────────────────────────────────────────────┬───────────────────┤
│ NAV      │ CALENDAR TOOLBAR                                 │ TASK PANEL        │
│          │                                                  │                   │
│ Dashboard│ [< Prev] [Today] [Next >]   May 2026            │ ┌ Tasks ─────────┐ │
│ Calendar │ [Month] [Week] [Day] [Agenda]   [+ New Event]   │ │ Filter: [All▼] │ │
│ Gallery  │                                                  │ │ Sort: [Due▼]   │ │
│ Smart    ├──────────────────────────────────────────────────┤ │                │ │
│ Home     │                                                  │ │ ▸ OVERDUE (2)  │ │
│ Reminders│  CALENDAR GRID (main content area)              │ │ ● Write docs   │ │
│ Settings │                                                  │ │   ↳ Due: Mon   │ │
│          │  (changes between Month / Week / Day / Agenda)  │ │   🔴 urgent    │ │
│          │                                                  │ │                │ │
│          │                                                  │ │ ▸ TODAY (3)    │ │
│          │                                                  │ │ ● Review PR    │ │
│          │                                                  │ │   🟠 high      │ │
│          │                                                  │ │ ● Team lunch   │ │
│          │                                                  │ │   🟡 medium    │ │
│          │                                                  │ │ ● Deploy fix   │ │
│          │                                                  │ │   🟠 high      │ │
│          │                                                  │ │                │ │
│          │                                                  │ │ ▸ THIS WEEK(5) │ │
│          │                                                  │ │ ● ...          │ │
│          │                                                  │ └────────────────┘ │
│          │                                                  │                   │
│          │                          [+] FAB (bottom-right) │ MINI CALENDAR     │
│          │                                                  │ ┌────────────────┐ │
│          │                                                  │ │  ◀ May 2026 ▶  │ │
│          │                                                  │ │ Su Mo Tu We Th │ │
│          │                                                  │ │  3  4  5  6  7 │ │
│          │                                                  │ │ 10 11 12 13 14 │ │
│          │                                                  │ │ 17 18 19 20 21 │ │
│          │                                                  │ │ 24 25 26 27 28 │ │
│          │                                                  │ └────────────────┘ │
└──────────┴──────────────────────────────────────────────────┴───────────────────┘
```

### 3.2 Month View Grid

```
┌────────────────────────────────────────────────────────────────┐
│  Sun       Mon       Tue       Wed       Thu       Fri    Sat  │
├────────┬─────────┬─────────┬─────────┬─────────┬────────┬─────┤
│        │         │         │    1    │    2    │   3    │  4  │
│        │         │         │ ┌──────┐│ ┌──────┐│        │     │
│        │         │         │ │Standup││ │Standup││        │     │
│        │         │         │ └──────┘│ └──────┘│        │     │
│        │         │         │ ● Task  │         │        │     │
├────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────┤
│   5    │    6    │    7    │    8    │    9    │   10   │ 11  │
│        │ ┌──────┐│         │ ┌──────┐│         │        │     │
│        │ │Meetng ││         │ │Standup││         │        │     │
│        │ └──────┘│         │ └──────┘│         │        │     │
│        │ +2 more │         │ ● Task  │         │        │     │
├────────┴─────────┴─────────┴─────────┴─────────┴────────┴─────┤
│  ... (remaining weeks) ...                                     │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Week View Grid

```
┌──────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│      │  SUN 18  │  MON 19  │  TUE 20  │  WED 21  │  THU 22  │  FRI 23  │  SAT 24  │
├──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 7am  │          │          │          │          │          │          │          │
├──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 8am  │          │ ┌──────┐ │          │ ┌──────┐ │          │          │          │
│      │          │ │Standup│ │          │ │Standup│ │          │          │          │
│      │          │ └──────┘ │          │ └──────┘ │          │          │          │
├──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 9am  │          │          │          │ ┌──────┐ │          │          │          │
│      │          │          │          │ │Review │ │          │          │          │
│      │          │          │          │ │ PR   │ │          │          │          │
│      │          │          │          │ └──────┘ │          │          │          │
├──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 10am │          │ ┌──────────────────┐│          │          │          │          │
│      │          │ │  Deep Work Block ││          │          │          │          │
│      │          │ │  (AI suggested)  ││          │          │          │          │
│      │          │ └──────────────────┘│          │          │          │          │
├──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│  ... │ ...      │ ...      │ ...      │ ...      │ ...      │ ...      │ ...      │
├──────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│10pm  │          │          │          │          │          │          │          │
└──────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 3.4 Event Create Modal

```
┌────────────────────────────────────────────────────────┐
│  New Event                                        [✕]  │
├────────────────────────────────────────────────────────┤
│  Title: [________________________]                     │
│  Date:  [May 22, 2026     ] Time: [09:00] → [10:00]   │
│  [ ] All day                                           │
│  Location: [________________________]                  │
│  Description: [____________________________________]   │
│               [____________________________________]   │
│  Color: [● Blue] [● Green] [● Red] [● Purple] [● Gray]│
│  Recurrence: [Does not repeat ▼]                       │
│  Reminder: [15 minutes before ▼]                       │
│  Calendar: [My Calendar ▼]                             │
│                                                        │
│  [Cancel]                              [Create Event]  │
└────────────────────────────────────────────────────────┘
```

---

## 4. Data Model

### 4.1 Prisma Schema

```prisma
model Event {
  id            String    @id @default(cuid())
  userId        String
  title         String
  description   String?
  start         DateTime
  end           DateTime
  allDay        Boolean   @default(false)
  color         String    @default("#3B82F6") // hex color
  location      String?
  googleEventId String?   @unique
  reminderId    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurrence    RecurrenceRule?
  reminder      Reminder?       @relation(fields: [reminderId], references: [id])

  @@index([userId, start, end])
  @@index([googleEventId])
}

model Task {
  id               String      @id @default(cuid())
  userId           String
  title            String
  description      String?
  dueDate          DateTime?
  priority         Priority    @default(medium)
  status           TaskStatus  @default(todo)
  tags             String[]
  projectId        String?
  estimatedMinutes Int?
  actualMinutes    Int?
  completedAt      DateTime?
  sortOrder        Int         @default(0)
  parentTaskId     String?     // one level deep sub-tasks
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project     Project? @relation(fields: [projectId], references: [id])
  parentTask  Task?    @relation("SubTasks", fields: [parentTaskId], references: [id])
  subTasks    Task[]   @relation("SubTasks")

  @@index([userId, status])
  @@index([userId, dueDate])
  @@index([userId, projectId])
}

model Project {
  id         String   @id @default(cuid())
  userId     String
  name       String
  color      String   @default("#6B7280")
  emoji      String?
  isArchived Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks Task[]

  @@index([userId])
}

model RecurrenceRule {
  id        String            @id @default(cuid())
  eventId   String            @unique
  frequency RecurrenceFreq
  interval  Int               @default(1)
  until     DateTime?
  count     Int?
  byDay     String[]          // ["MO", "TU", "WE", "TH", "FR"] for weekdays

  event     Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model GoogleCalendarSync {
  id               String    @id @default(cuid())
  userId           String    @unique
  googleCalendarId String
  syncToken        String?   // incremental sync token from Google
  lastSyncAt       DateTime?
  isEnabled        Boolean   @default(true)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Priority {
  low
  medium
  high
  urgent
}

enum TaskStatus {
  todo
  in_progress
  done
}

enum RecurrenceFreq {
  daily
  weekly
  monthly
  yearly
}
```

### 4.2 TypeScript Types

```typescript
// types/calendar.ts

export type EventColor =
  | "#3B82F6" // blue
  | "#10B981" // green
  | "#EF4444" // red
  | "#8B5CF6" // purple
  | "#F59E0B" // amber
  | "#6B7280"; // gray

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  color: EventColor;
  location: string | null;
  googleEventId: string | null;
  recurrence: RecurrenceRule | null;
  createdAt: Date;
}

export interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "done";
  tags: string[];
  projectId: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  completedAt: Date | null;
  parentTaskId: string | null;
  subTasks: CalendarTask[];
}

export interface RecurrenceRule {
  id: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  until: Date | null;
  count: number | null;
  byDay: string[];
}

export type CalendarView = "month" | "week" | "day" | "agenda";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TaskFilters {
  status?: ("todo" | "in_progress" | "done")[];
  priority?: ("low" | "medium" | "high" | "urgent")[];
  projectId?: string;
  dateRange?: DateRange;
  tags?: string[];
  search?: string;
}

export interface GoogleSyncStatus {
  isConnected: boolean;
  lastSyncAt: Date | null;
  syncToken: string | null;
  calendarId: string | null;
}

export interface TimeBlock {
  start: Date;
  end: Date;
  durationMinutes: number;
  suggestedTask?: CalendarTask;
  reason: string;
}
```

---

## 5. Views

### 5.1 Month View

**Component:** `MonthView.tsx`

**Behavior:**
- 6-row × 7-column grid, each cell = one calendar day
- Cell header: day number (bold if today, circled; muted if outside current month)
- Events rendered inline as pill-shaped chips, color-coded by event color, sorted by start time
- Maximum 3 events visible per cell; overflow shown as "+N more" chip that opens a day popover
- Tasks with `dueDate` on that day shown with a bullet indicator after events (grey dot)
- Clicking a day header navigates to that day's Day view
- Clicking an empty cell opens the `CreateEventModal` with that date pre-filled
- Clicking an event opens the `EventDetailPanel` (right-side drawer)

**Overflow Popover:**
```
┌─────────────────────────────┐
│  Monday, May 19             │
│  ──────────────────────     │
│  9:00 AM  Team Standup      │
│  10:00 AM Design Review     │
│  12:00 PM Lunch with Alex   │
│  2:00 PM  Sprint Planning   │
│  ● Write Q2 report (task)   │
│                             │
│  [+ Add event]              │
└─────────────────────────────┘
```

**State:**
- `currentDate: Date` — determines which month is shown
- `selectedDate: Date | null` — highlighted date
- Events and tasks are fetched for `[startOfMonth - 7 days, endOfMonth + 7 days]` to cover partial weeks

### 5.2 Week View

**Component:** `WeekView.tsx`

**Behavior:**
- Hourly grid from 07:00 to 22:00 (configurable in settings)
- Each column = one day (Sun–Sat, configurable start day)
- Time slots are 60px tall per hour; 30-min slots = 30px
- Events positioned absolutely within their column, top/height calculated from start/end times
- Overlapping events: column-split algorithm (max 3 per cell before overlap indicator)
- Current time: horizontal red line with dot at actual time position
- Draggable events: `useDraggable` from dnd-kit, snaps to 15-minute intervals
- Clicking an empty time slot opens `CreateEventModal` with exact time pre-filled
- All-day events shown in a dedicated row at the top of the grid

**Drag Behavior:**
- `onDragStart`: event opacity drops to 0.5, ghost element follows cursor
- `onDragOver`: ghost snaps to nearest 15-min slot with time preview tooltip ("10:30 AM – 11:30 AM")
- `onDragEnd`: optimistic update → tRPC `updateEvent` mutation → rollback on error with toast

### 5.3 Day View

**Component:** `DayView.tsx`

**Behavior:**
- Single column for the selected day
- Same hourly grid as week view (full width)
- Tasks due that day shown in a sidebar column at right
- Time tracking: click on a task → start timer; click again → stop; auto-logs `actualMinutes`
- "Add task for today" CTA at bottom of task column
- Previous/Next day navigation arrows

### 5.4 Agenda View

**Component:** `AgendaView.tsx`

**Behavior:**
- Chronological list grouped by date heading
- Each date section: date header, then events sorted by start time, then tasks sorted by priority
- Events show: start–end time, title, color dot, location if present
- Tasks show: bullet + title, due time if set, priority badge, project name
- Infinite scroll: loads 30 days at a time, appends as user scrolls
- "Jump to date" datepicker in toolbar
- Empty state per date: muted "No events" text

```
┌─────────────────────────────────────────────────────────┐
│ AGENDA                               [Jump to date 📅]  │
├─────────────────────────────────────────────────────────┤
│  TODAY — Thursday, May 22                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ 9:00–9:30   ● Team Standup          [Zoom]    │    │
│  │ 11:00–12:00 ● Product Review        [Office]  │    │
│  │ ● Task: Deploy hotfix               🔴 urgent  │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  FRIDAY, May 23                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │ 14:00–15:00 ● 1:1 with Manager               │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  SATURDAY, May 24                                       │
│  No events                                              │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Google Calendar Integration

### 6.1 OAuth Setup

**Scopes required:**
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

**Auth flow:**
1. User clicks "Connect Google Calendar" in Settings or the Calendar toolbar
2. Redirect to Google OAuth consent screen (via NextAuth or custom OAuth handler)
3. Exchange auth code for `access_token` + `refresh_token`
4. Store encrypted `refresh_token` in DB (on `User` model or dedicated `OAuthToken` table)
5. `GoogleCalendarSync` record created for the user

**Token refresh:**
- Access tokens expire in 1 hour; refresh via Google token endpoint before each API call
- If refresh fails (revoked), set `isEnabled = false` and send re-auth notification

### 6.2 Bidirectional Sync Architecture

```
Mission Control DB  ←──────────────────────→  Google Calendar API
      │                                                │
      │  CREATE event in MC                           │
      │  → POST /calendars/{calId}/events             │
      │  → store googleEventId on Event               │
      │                                                │
      │  UPDATE event in MC                           │
      │  → PATCH /calendars/{calId}/events/{eventId}  │
      │                                                │
      │  DELETE event in MC                           │
      │  → DELETE /calendars/{calId}/events/{eventId} │
      │                                                │
      │  PULL from Google (incremental sync)          │
      │  → GET /calendars/{calId}/events              │
      │     ?syncToken={token}                         │
      │  → upsert Event records by googleEventId      │
      │  → store new syncToken                        │
```

### 6.3 Sync Frequency

| Trigger | Behavior |
|---------|----------|
| Manual ("Sync Now" button) | Immediate incremental sync |
| App load | Incremental sync if `lastSyncAt` > 15 min ago |
| Background (Vercel Cron) | Every 15 minutes via `GET /api/cron/sync-calendar` |
| Post-event mutation | Push to Google immediately after local write |

### 6.4 Conflict Resolution

- Strategy: **last-write-wins** based on `updatedAt` timestamp
- When Google event `updated` timestamp > local `updatedAt`: Google wins, local record updated
- When local `updatedAt` > Google event `updated`: local wins, push to Google
- Notification: if a conflict is resolved, a toast appears: "1 event updated by Google Calendar sync"
- Edge case: event deleted on Google but modified locally → recreate on Google with conflict note

### 6.5 Sync Error Handling

```typescript
type SyncResult = {
  synced: number;
  errors: Array<{
    googleEventId: string;
    error: string;
    action: "create" | "update" | "delete";
  }>;
  newSyncToken: string;
};
```

---

## 7. tRPC Procedures

### Router: `calendarRouter`

```typescript
// server/routers/calendar.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
});

const EventColorSchema = z.enum([
  "#3B82F6",
  "#10B981",
  "#EF4444",
  "#8B5CF6",
  "#F59E0B",
  "#6B7280",
]);

const RecurrenceSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).default(1),
  until: z.date().optional(),
  count: z.number().int().optional(),
  byDay: z.array(z.string()).optional(),
});

export const calendarRouter = createTRPCRouter({
  // ── Events ──────────────────────────────────────────────

  getEvents: protectedProcedure
    .input(DateRangeSchema)
    .query(async ({ ctx, input }) => {
      // Returns events in range + expanded recurrence instances
    }),

  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        start: z.date(),
        end: z.date(),
        allDay: z.boolean().default(false),
        color: EventColorSchema.optional(),
        location: z.string().optional(),
        recurrence: RecurrenceSchema.optional(),
        reminderId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Create in DB
      // 2. Push to Google Calendar if connected
      // 3. Return created event
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          start: z.date().optional(),
          end: z.date().optional(),
          color: EventColorSchema.optional(),
          location: z.string().optional(),
        }),
        updateMode: z.enum(["this", "this_and_following", "all"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Handles single / series updates for recurring events
    }),

  deleteEvent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        deleteMode: z.enum(["this", "this_and_following", "all"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  // ── Tasks ────────────────────────────────────────────────

  getTasks: protectedProcedure
    .input(
      z.object({
        status: z.array(z.enum(["todo", "in_progress", "done"])).optional(),
        priority: z
          .array(z.enum(["low", "medium", "high", "urgent"]))
          .optional(),
        projectId: z.string().optional(),
        dateRange: DateRangeSchema.optional(),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
        includeSubTasks: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {}),

  createTask: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        tags: z.array(z.string()).default([]),
        projectId: z.string().optional(),
        estimatedMinutes: z.number().int().positive().optional(),
        parentTaskId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.date().nullable().optional(),
          priority: z
            .enum(["low", "medium", "high", "urgent"])
            .optional(),
          status: z.enum(["todo", "in_progress", "done"]).optional(),
          tags: z.array(z.string()).optional(),
          projectId: z.string().nullable().optional(),
          estimatedMinutes: z.number().int().optional(),
          actualMinutes: z.number().int().optional(),
          sortOrder: z.number().int().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {}),

  completeTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        actualMinutes: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Sets status = done, completedAt = now(), stores actualMinutes
    }),

  reorderTasks: protectedProcedure
    .input(
      z.object({
        taskIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Updates sortOrder for all tasks in batch
    }),

  // ── Projects ─────────────────────────────────────────────

  getProjects: protectedProcedure.query(async ({ ctx }) => {}),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string(),
        emoji: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  updateProject: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          color: z.string().optional(),
          emoji: z.string().optional(),
          isArchived: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  // ── Google Calendar ──────────────────────────────────────

  syncGoogleCalendar: protectedProcedure
    .input(z.object({ force: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      // Returns SyncResult
    }),

  getGoogleSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    // Returns GoogleSyncStatus
  }),

  disconnectGoogleCalendar: protectedProcedure.mutation(
    async ({ ctx }) => {
      // Revoke token, delete GoogleCalendarSync record
    }
  ),

  // ── Aggregate ────────────────────────────────────────────

  getUpcoming: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(30).default(7) }))
    .query(async ({ ctx, input }) => {
      // Returns { events: CalendarEvent[], tasks: CalendarTask[] }
      // for the next N days, merged and sorted by date/time
    }),
});
```

---

## 8. Task Management Features

### 8.1 Priority Color Coding

| Priority | Color | Tailwind Class | Badge |
|----------|-------|----------------|-------|
| urgent | Red | `bg-red-500` | 🔴 URGENT |
| high | Orange | `bg-orange-500` | 🟠 HIGH |
| medium | Yellow | `bg-yellow-400` | 🟡 MEDIUM |
| low | Gray | `bg-gray-400` | ⚪ LOW |

### 8.2 Sub-Tasks (One Level Deep)

- Parent tasks show a expand/collapse chevron when they have sub-tasks
- Sub-tasks render indented under parent, with a connecting line (CSS `before:border-l`)
- Completing all sub-tasks prompts: "All sub-tasks done — mark parent as complete?"
- Sub-tasks inherit parent's `projectId` by default
- Sub-tasks cannot have their own sub-tasks (enforced at API level)

```typescript
// Task tree rendering type
interface TaskWithSubTasks extends CalendarTask {
  subTasks: CalendarTask[]; // max 1 level
  completionPercent: number; // derived: done subTasks / total subTasks
}
```

### 8.3 Time Tracking

- "Start Timer" button on task card (stopwatch icon)
- Active timer: shows elapsed time in task card header, pulsing dot indicator
- Stop timer: auto-updates `actualMinutes` (adds to existing value for multiple sessions)
- Timer state stored in Zustand `calendarStore`:
  ```typescript
  interface TimerState {
    activeTaskId: string | null;
    startedAt: Date | null;
    accumulatedSeconds: number;
  }
  ```
- Timer persists across page navigations (not across browser refresh — use localStorage for persistence)

### 8.4 Drag to Reorder (Task List)

- Task list is a `SortableContext` (dnd-kit)
- Vertical drag handle on left of each task card (drag-handle icon, shows on hover)
- Drag updates `sortOrder` optimistically, debounced batch update to server (500ms)

### 8.5 Drag Task to Calendar Date

- Tasks in the right panel are `Draggable` items
- Calendar day cells are `Droppable` targets
- Dropping a task on a date sets `dueDate` to that date
- Visual feedback: day cell highlights with blue border on drag-over

---

## 9. AI Features

### 9.1 Time Blocking Suggestions

**Trigger:** User clicks "Suggest Time Blocks" button in the week view toolbar or task panel.

**Implementation:**
```typescript
// server/actions/ai-time-blocking.ts

async function generateTimeBlockSuggestions(
  userId: string,
  weekStart: Date
): Promise<TimeBlock[]> {
  // 1. Fetch all events for the week (busy times)
  // 2. Fetch all incomplete tasks with estimatedMinutes
  // 3. Calculate free slots (minimum 30 min blocks)
  // 4. Call Vercel AI SDK with structured output

  const prompt = `
    You are a productivity assistant. The user has the following free time slots this week:
    ${JSON.stringify(freeSlots)}
    
    They have these pending tasks (with time estimates):
    ${JSON.stringify(pendingTasks)}
    
    Suggest which tasks to schedule in which time slots. 
    Consider task priority (urgent > high > medium > low).
    Prefer morning slots for deep work (complex, high-priority tasks).
    Group related tasks (same project) when possible.
  `;

  const result = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.array(
      z.object({
        slotStart: z.string().datetime(),
        slotEnd: z.string().datetime(),
        taskId: z.string(),
        reason: z.string(),
      })
    ),
    prompt,
  });

  return result.object;
}
```

**UI Display:**
- Suggested blocks rendered as dashed-border events in week view with "✨ AI" badge
- Accept button (✓) → converts to real time-blocked event
- Dismiss button (✕) → removes suggestion
- "Accept All" CTA in suggestions panel

### 9.2 Task Breakdown from Description

**Trigger:** User types or pastes a task description, clicks "Break down with AI" or presses `Cmd+Shift+B`.

**Example:**
```
Input: "Prepare and deliver Q2 product roadmap presentation for board meeting"

Output:
  → Research Q2 metrics and KPIs (45 min)
  → Outline presentation structure (30 min)
  → Write slide content (90 min)
  → Design slides in Figma (60 min)
  → Practice run-through (30 min)
  → Incorporate feedback (45 min)
```

**Implementation:**
```typescript
const taskBreakdownTool = {
  name: "create_subtasks",
  description: "Break a complex task into actionable sub-tasks",
  parameters: z.object({
    subTasks: z.array(
      z.object({
        title: z.string(),
        estimatedMinutes: z.number().int(),
        priority: z.enum(["low", "medium", "high", "urgent"]),
      })
    ),
  }),
};
```

---

## 10. Drag and Drop

### 10.1 Setup

```typescript
// Uses dnd-kit for all DnD interactions
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
```

### 10.2 Draggable Event (Week View)

```typescript
interface DraggableEventData {
  type: "event";
  eventId: string;
  originalStart: Date;
  originalEnd: Date;
  durationMinutes: number;
}
```

- Drag handle: full event card surface
- Constraint: drag only within same column (same day) or cross-column (different day)
- Snap: 15-minute increments (`snapToGrid` modifier)
- While dragging: event in place becomes `opacity-30`, drag overlay shows full card
- Cross-day drag: updates both `start` and `end` dates

### 10.3 Droppable Calendar Slots

```typescript
// Each 15-minute slot in week view
interface SlotDroppableData {
  type: "calendar-slot";
  date: Date;
  hour: number;
  minute: 0 | 15 | 30 | 45;
}

// Each day cell in month view
interface DayCellDroppableData {
  type: "calendar-day";
  date: Date;
}
```

### 10.4 Keyboard Accessibility

- All draggable items support keyboard navigation
- `Space` to pick up, arrow keys to move between slots, `Enter` to drop, `Escape` to cancel
- Screen reader announcements: "Picked up Team Standup, currently at Monday 9:00 AM. Press arrow keys to move."

---

## 11. Animations

### 11.1 Month Navigation Transition

```typescript
// Slide animation between months using Framer Motion
const monthVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

// direction: +1 = forward (next month), -1 = backward (prev month)
```

### 11.2 Event Creation Scale-In

```typescript
const eventPillVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};
```

### 11.3 View Switch Transition

- Month ↔ Week ↔ Day: cross-fade with `opacity` 0 → 1 over 150ms
- `AnimatePresence` wraps each view component with `key={currentView}`

### 11.4 Task Complete Animation

```typescript
// Checkbox check animation
const checkVariants: Variants = {
  unchecked: { pathLength: 0 },
  checked: {
    pathLength: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// Task row strikethrough + fade out
const taskRowVariants: Variants = {
  active: { opacity: 1, height: "auto" },
  completed: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.4, delay: 0.5 },
  },
};
```

### 11.5 Modal Animations

- `CreateEventModal` and `EventDetailPanel`: slide up from bottom on mobile, scale-in from center on desktop
- Backdrop: `opacity` 0 → 0.5 over 150ms

---

## 12. State Management

### 12.1 Zustand Store

```typescript
// store/calendarStore.ts

interface CalendarStore {
  // View state
  currentView: CalendarView;
  currentDate: Date;
  selectedDate: Date | null;
  viewDirection: 1 | -1; // for animation direction

  // UI state
  isCreateEventOpen: boolean;
  isEventDetailOpen: boolean;
  selectedEventId: string | null;
  selectedTaskId: string | null;
  isTaskPanelOpen: boolean;

  // Filters
  taskFilters: TaskFilters;

  // Timer
  timer: TimerState;

  // Actions
  setView: (view: CalendarView) => void;
  navigateForward: () => void;
  navigateBackward: () => void;
  navigateToToday: () => void;
  setSelectedDate: (date: Date | null) => void;
  openCreateEvent: (date?: Date) => void;
  closeCreateEvent: () => void;
  openEventDetail: (eventId: string) => void;
  closeEventDetail: () => void;
  setTaskFilters: (filters: Partial<TaskFilters>) => void;
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
}
```

### 12.2 TanStack Query Keys

```typescript
// lib/query-keys.ts

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (range: DateRange) => ["calendar", "events", range] as const,
  tasks: (filters: TaskFilters) => ["calendar", "tasks", filters] as const,
  projects: () => ["calendar", "projects"] as const,
  upcoming: (days: number) => ["calendar", "upcoming", days] as const,
  syncStatus: () => ["calendar", "sync-status"] as const,
};
```

---

## 13. Testing

### 13.1 Recurrence Logic Unit Tests

```typescript
// __tests__/recurrence.test.ts

describe("expandRecurrenceRule", () => {
  it("expands daily recurrence within date range", () => {
    const rule: RecurrenceRule = {
      frequency: "daily",
      interval: 1,
      until: addDays(new Date(), 7),
    };
    const instances = expandRecurrenceRule(rule, startOfWeek, endOfWeek);
    expect(instances).toHaveLength(7);
  });

  it("expands weekly recurrence on specific days (MO, WE, FR)", () => {
    const rule: RecurrenceRule = {
      frequency: "weekly",
      interval: 1,
      byDay: ["MO", "WE", "FR"],
    };
    // Verify only Mon, Wed, Fri instances generated
  });

  it("respects count limit for monthly recurrence", () => {
    const rule: RecurrenceRule = {
      frequency: "monthly",
      interval: 1,
      count: 3,
    };
    const instances = expandRecurrenceRule(rule, startDate, farFutureDate);
    expect(instances).toHaveLength(3);
  });

  it("handles yearly recurrence leap year edge case", () => {
    // Feb 29 event — should skip non-leap years or adjust to Feb 28
  });
});
```

### 13.2 Google Sync Mock Tests

```typescript
// __tests__/google-sync.test.ts

describe("syncGoogleCalendar", () => {
  const mockGoogleCalendarClient = {
    events: {
      list: vi.fn(),
      insert: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };

  it("creates local events from Google when no local record exists", async () => {
    mockGoogleCalendarClient.events.list.mockResolvedValue({
      data: { items: [googleEventFixture], nextSyncToken: "abc123" },
    });
    const result = await syncGoogleCalendar(userId, mockGoogleCalendarClient);
    expect(result.synced).toBe(1);
    // verify DB record created
  });

  it("pushes local event to Google on first sync", async () => {
    // Event with no googleEventId
    const result = await syncGoogleCalendar(userId, mockGoogleCalendarClient);
    expect(mockGoogleCalendarClient.events.insert).toHaveBeenCalled();
  });

  it("resolves conflict with last-write-wins", async () => {
    // Google updated at T+2, local updated at T+1 → Google wins
  });

  it("handles 410 Gone (invalid sync token) by performing full resync", async () => {
    mockGoogleCalendarClient.events.list.mockRejectedValueOnce({ code: 410 });
    // Verify full sync triggered, syncToken reset
  });
});
```

### 13.3 Drag and Drop E2E Tests (Playwright)

```typescript
// e2e/calendar-drag-drop.spec.ts

test("drag event to new time slot in week view", async ({ page }) => {
  await page.goto("/calendar");
  await page.click('[data-testid="view-week"]');

  const event = page.locator('[data-testid="event-standup"]');
  const targetSlot = page.locator('[data-testid="slot-monday-10am"]');

  await event.dragTo(targetSlot);

  // Verify event moved
  await expect(page.locator('[data-testid="event-standup"]')).toHaveAttribute(
    "data-start",
    "2026-05-19T10:00:00"
  );
});

test("drag task to calendar date sets due date", async ({ page }) => {
  await page.goto("/calendar");
  const task = page.locator('[data-testid="task-write-docs"]');
  const targetDay = page.locator('[data-testid="day-cell-2026-05-25"]');

  await task.dragTo(targetDay);

  await expect(page.locator('[data-testid="task-write-docs-due"]')).toHaveText(
    "May 25"
  );
});
```

### 13.4 Task Management Unit Tests

```typescript
describe("task completion", () => {
  it("sets completedAt timestamp on completion", async () => {});
  it("prompts to complete parent when all sub-tasks done", async () => {});
  it("accumulates actualMinutes across multiple timer sessions", async () => {});
  it("enforces max one level of sub-task nesting", async () => {});
});
```

---

## 14. File Structure

```
app/
  (app)/
    calendar/
      page.tsx                    # CalendarPage — view switcher + layout
      loading.tsx
      error.tsx
      _components/
        CalendarToolbar.tsx
        MonthView.tsx
        WeekView.tsx
        DayView.tsx
        AgendaView.tsx
        MiniCalendar.tsx
        TaskPanel.tsx
        TaskCard.tsx
        TaskCreateForm.tsx
        EventDetailPanel.tsx
        CreateEventModal.tsx
        RecurrenceEditor.tsx
        GoogleSyncBadge.tsx
        TimeBlockSuggestions.tsx
        DragOverlayContent.tsx
      _hooks/
        useCalendarEvents.ts
        useCalendarTasks.ts
        useDragDrop.ts
        useTimeTracker.ts
        useRecurrenceExpander.ts
      _utils/
        recurrence.ts
        timeBlocking.ts
        calendarGrid.ts

server/
  routers/
    calendar.ts

store/
  calendarStore.ts

types/
  calendar.ts
```

---

## 15. Performance Considerations

- **Recurrence Expansion:** Only expand recurring events within the visible date range on the server — never expand infinitely
- **Virtualization:** Agenda view uses `@tanstack/react-virtual` for lists > 100 items
- **Optimistic Updates:** All mutations use `useMutation` with `onMutate` optimistic update + `onError` rollback
- **Prefetching:** On hover of next/prev month navigation, prefetch events for that month
- **Google API Rate Limits:** Cache sync calls, minimum 60 seconds between auto-syncs per user

---

*End of SPEC_CALENDAR.md*
