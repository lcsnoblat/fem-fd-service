# Mission Control — Reminders Module Specification

## 1. Overview

The Reminders module provides a complete personal reminder system with push notifications, recurring schedules, snooze management, priority levels, and AI-powered suggestions. It integrates tightly with the Calendar module (reminders appear as events) and the Dashboard (overdue reminders shown in the widget).

Reminders are designed for quick creation and frictionless completion. The primary interaction model is: create → get notified → act (complete/snooze/dismiss).

---

## 2. User Stories

```
US-R01: As a user, I want to create a reminder in under 15 seconds using natural language like "call dentist tomorrow at 3pm".
US-R02: As a user, I want to receive a push notification on my browser/phone when a reminder is due, even if the app is closed.
US-R03: As a user, I want to set recurring reminders (daily, weekly, monthly) that auto-generate the next occurrence when I complete one.
US-R04: As a user, I want to snooze a reminder for 15 minutes, 1 hour, or until tomorrow morning without opening the app.
US-R05: As a user, I want to see all overdue and today's reminders at the top of my list so I don't miss anything.
US-R06: As a user, I want to organize reminders with tags and filter by tag to see only work or personal reminders.
US-R07: As a user, I want AI to suggest reminders based on patterns ("You haven't reviewed your budget this month").
US-R08: As a user, I want to bulk-complete reminders when I've dealt with a whole category at once.
```

---

## 3. UI Layout

### 3.1 Main Reminders Page (`/reminders`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Reminders                                    [+ New Reminder]        │
│  Never forget what matters                                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [All] [Today (3)] [Upcoming] [Done] [🏷 Tags ▾]   [🔍 Search]      │
│                                                                      │
│  ─── OVERDUE ────────────────────────────────────────── [2 items]   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 🔴 Call dentist                  21/05 10:00  [Done][Snooze]│   │
│  │    Priority: High · Personal                                 │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ 🔴 Pay electricity bill          20/05 08:00  [Done][Snooze]│   │
│  │    Priority: Urgent · Finance                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ─── TODAY ──────────────────────────────────────────── [3 items]   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 🟡 Weekly budget review          22/05 18:00  [Done][Snooze]│   │
│  │    Priority: Medium · Finance · Repeats weekly               │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ 🔵 Team standup notes            22/05 09:00  [Done][Snooze]│   │
│  │    Priority: Low · Work                                      │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ 🟠 Gym session                   22/05 07:00  [Done][Snooze]│   │
│  │    Priority: High · Health · Repeats daily                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ─── UPCOMING ────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 🔵 Call mom                      Sun 25/05 18:00  [Edit][⋮] │   │
│  │    Priority: Medium · Personal · Repeats weekly              │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ 🔵 Car insurance renewal         30/05 09:00  [Edit][⋮]     │   │
│  │    Priority: Urgent · Finance                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ╔══════════════════════════════════════════════════════════════╗   │
│  ║ 💡 AI Suggestion                                             ║   │
│  ║ "You haven't reviewed your budget this month. Want to set   ║   │
│  ║  a reminder for Friday at 7pm?"     [Add] [Dismiss]         ║   │
│  ╚══════════════════════════════════════════════════════════════╝   │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Create/Edit Reminder Dialog

```
┌─────────────────────────────────────────────────┐
│  New Reminder                               [✕] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Title                                          │
│  ┌─────────────────────────────────────────┐   │
│  │ Call dentist to schedule checkup        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Or describe in natural language:               │
│  ┌─────────────────────────────────────────┐   │
│  │ 💬 remind me to...                      │   │
│  └─────────────────────────────────────────┘   │
│  [✨ Parse with AI]                              │
│                                                 │
│  Due Date & Time                                │
│  ┌─────────────────┐  ┌──────────────────┐    │
│  │  23/05/2026  ▾  │  │  10:00  ▾        │    │
│  └─────────────────┘  └──────────────────┘    │
│                                                 │
│  Priority:  [Low] [●Medium] [High] [Urgent]     │
│                                                 │
│  Tags:  [+ Add tag]  [work ×] [finance ×]       │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ 🔁 Repeat                           [  ] │  │
│  └──────────────────────────────────────────┘  │
│  (if toggled on:)                               │
│  Frequency: [Daily ▾]  Every [1] [day(s)]       │
│  Ends: [Never ●] [On date] [After N times]      │
│                                                 │
│  Description (optional)                         │
│  ┌─────────────────────────────────────────┐   │
│  │ Add notes...                            │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Cancel]                          [Save Reminder] │
└─────────────────────────────────────────────────┘
```

### 3.3 Snooze Options Panel

```
Snooze until:
  [15 minutes]  [30 minutes]
  [1 hour]      [3 hours]
  [Tomorrow 9am]  [Next week]
  [Custom date/time...]
```

---

## 4. Data Model

```typescript
// Full Prisma schema (from SPEC_DATABASE.md — repeated here for completeness)

model Reminder {
  id           String         @id @default(cuid())
  userId       String
  title        String         // max 200 chars
  description  String?        // max 2000 chars
  dueAt        DateTime
  priority     Priority       @default(MEDIUM)
  status       ReminderStatus @default(PENDING)
  tags         String[]
  linkedTo     Json?          // { type: "task" | "event" | "job", id: string }
  recurrenceId String?        // links to ReminderRecurrence
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  user       User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  recurrence ReminderRecurrence?
  snoozeLogs SnoozeLog[]

  @@index([userId, dueAt])
  @@index([userId, status])
}

enum ReminderStatus {
  PENDING    // active, not yet acted on
  DONE       // completed by user
  SNOOZED    // snoozed until a future time
  DISMISSED  // dismissed without completing
}

model ReminderRecurrence {
  id             String         @id @default(cuid())
  reminderId     String         @unique
  frequency      RecurFrequency // DAILY | WEEKLY | BIWEEKLY | MONTHLY | YEARLY
  interval       Int            @default(1)    // e.g., every 2 weeks
  until          DateTime?      // end date (optional)
  count          Int?           // max occurrences (optional)
  byDay          String[]       // ["MON", "WED"] for specific days
  nextOccurrence DateTime       // when to create the next reminder

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
  id           String   @id @default(cuid())
  reminderId   String
  snoozedAt    DateTime @default(now())
  snoozedUntil DateTime
  reason       String?  // "15min" | "1h" | "tomorrow" | "custom"

  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@index([reminderId])
}
```

---

## 5. Push Notifications

### 5.1 Architecture

```
BullMQ Worker (runs every minute)
    │
    ├── SELECT reminders WHERE dueAt <= now() AND status = PENDING
    │   AND userId IN (SELECT userId FROM PushSubscription)
    │
    ├── For each due reminder:
    │   ├── Get all push subscriptions for userId
    │   ├── Send push notification via web-push (VAPID)
    │   └── Mark reminder as notified (add flag to avoid re-sending)
    │
    └── Handle failed subscriptions:
        └── If 410 Gone → delete subscription from DB
```

### 5.2 Notification Payload

```typescript
interface PushPayload {
  title: string;           // Reminder title
  body: string;            // "Due now" or "Due at HH:mm"
  icon: '/icon-192.png';
  badge: '/badge-72.png';
  tag: string;             // reminder ID (replaces duplicate notifications)
  data: {
    url: string;           // "/reminders" or "/reminders?id=xxx"
    reminderId: string;
  };
  actions: [
    { action: 'complete', title: '✓ Mark Done' },
    { action: 'snooze-1h', title: '⏰ Snooze 1h' },
  ];
}
```

### 5.3 Service Worker Handling

```typescript
// public/sw.js

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'complete') {
    // POST to API to mark reminder done (background fetch)
    event.waitUntil(
      fetch('/api/reminders/complete', {
        method: 'POST',
        body: JSON.stringify({ reminderId: event.notification.data.reminderId }),
      })
    );
    return;
  }

  if (event.action === 'snooze-1h') {
    event.waitUntil(
      fetch('/api/reminders/snooze', {
        method: 'POST',
        body: JSON.stringify({
          reminderId: event.notification.data.reminderId,
          minutes: 60,
        }),
      })
    );
    return;
  }

  // Default: open app
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 5.4 Subscription Flow (First-time)

```
User visits /reminders
    │
    ├── Check: is push supported? (browser check)
    ├── Check: is user already subscribed? (DB check)
    │
    └── If not subscribed:
        ├── Show banner: "Enable notifications to never miss a reminder"
        ├── [Enable Notifications] button
        ├── On click → requestPermission()
        │   ├── If granted → subscribe to push service
        │   │   └── POST subscription to tRPC reminders.subscribeNotifications
        │   └── If denied → show inline info: "You can enable in browser settings"
        └── Remember decision in localStorage (don't show banner again if denied)
```

### 5.5 VAPID Setup

```typescript
// lib/notifications/vapid.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + process.env.CONTACT_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<void> {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload),
    { TTL: 3600, urgency: 'high' }, // 1h TTL for reminder notifications
  );
}
```

---

## 6. Recurrence System

### 6.1 Creating Next Occurrence

```typescript
// lib/reminders/recurrence.ts

export function getNextOccurrence(
  current: DateTime,
  rule: ReminderRecurrence,
): DateTime | null {
  const { frequency, interval, until, count } = rule;

  // Check termination conditions
  if (until && current >= until) return null;
  if (count !== null && count <= 0) return null;

  const next = match(frequency, {
    DAILY:     () => addDays(current, interval),
    WEEKLY:    () => addWeeks(current, interval),
    BIWEEKLY:  () => addWeeks(current, interval * 2),
    MONTHLY:   () => addMonths(current, interval),
    YEARLY:    () => addYears(current, interval),
  });

  if (until && next > until) return null;
  return next;
}

// Called when a recurring reminder is completed:
export async function createNextOccurrence(
  reminderId: string,
  db: PrismaClient,
): Promise<Reminder | null> {
  const reminder = await db.reminder.findUniqueOrThrow({
    where: { id: reminderId },
    include: { recurrence: true },
  });

  if (!reminder.recurrence) return null;

  const next = getNextOccurrence(reminder.dueAt, reminder.recurrence);
  if (!next) return null;

  // Decrement count if count-based
  if (reminder.recurrence.count !== null) {
    if (reminder.recurrence.count <= 1) return null; // last one
    await db.reminderRecurrence.update({
      where: { id: reminder.recurrence.id },
      data: { count: { decrement: 1 }, nextOccurrence: next },
    });
  }

  // Create new reminder for next occurrence
  return db.reminder.create({
    data: {
      userId: reminder.userId,
      title: reminder.title,
      description: reminder.description,
      dueAt: next,
      priority: reminder.priority,
      status: 'PENDING',
      tags: reminder.tags,
      linkedTo: reminder.linkedTo,
      recurrenceId: reminder.recurrence.id,
    },
  });
}
```

### 6.2 Frequency Options (User-Facing)

| Option | Backend Value | Description |
|--------|--------------|-------------|
| Daily | DAILY, interval: 1 | Every day |
| Weekdays | DAILY, byDay: [MON-FRI] | Mon-Fri only |
| Weekly | WEEKLY, interval: 1 | Same day every week |
| Every 2 weeks | BIWEEKLY, interval: 1 | Biweekly |
| Monthly | MONTHLY, interval: 1 | Same date each month |
| Yearly | YEARLY, interval: 1 | Same date each year |
| Custom | User-configured | Any combination |

---

## 7. tRPC Procedures

```typescript
// server/routers/reminders.ts

export const remindersRouter = router({

  // Get all reminders with flexible filtering
  getReminders: authedProcedure
    .input(z.object({
      status: z.union([
        z.nativeEnum(ReminderStatus),
        z.array(z.nativeEnum(ReminderStatus)),
      ]).optional(),
      priority: z.nativeEnum(Priority).optional(),
      tags: z.array(z.string()).optional(),
      dateRange: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      }).optional(),
      search: z.string().max(200).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.services.reminders.getReminders(ctx.userId, input);
    }),

  // Create reminder (with optional recurrence)
  createReminder: authedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      dueAt: z.string().datetime(),
      priority: z.nativeEnum(Priority).default('MEDIUM'),
      tags: z.array(z.string().max(50)).max(10).default([]),
      recurrence: z.object({
        frequency: z.nativeEnum(RecurFrequency),
        interval: z.number().int().min(1).max(365).default(1),
        endType: z.enum(['never', 'date', 'count']).default('never'),
        until: z.string().datetime().optional(),
        count: z.number().int().min(1).max(1000).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.reminders.createReminder(ctx.userId, input);
    }),

  updateReminder: authedProcedure
    .input(z.object({
      id: z.string().cuid(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      dueAt: z.string().datetime().optional(),
      priority: z.nativeEnum(Priority).optional(),
      tags: z.array(z.string().max(50)).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.reminders.updateReminder(ctx.userId, input.id, input);
    }),

  // Complete: marks done + creates next occurrence for recurring
  completeReminder: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.reminders.completeReminder(ctx.userId, input.id);
    }),

  // Snooze: changes dueAt to future time + logs the snooze
  snoozeReminder: authedProcedure
    .input(z.object({
      id: z.string().cuid(),
      until: z.string().datetime(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.reminders.snoozeReminder(ctx.userId, input.id, input.until, input.reason);
    }),

  dismissReminder: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.reminders.dismissReminder(ctx.userId, input.id);
    }),

  deleteReminder: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.reminders.deleteReminder(ctx.userId, input.id);
      return { success: true };
    }),

  bulkComplete: authedProcedure
    .input(z.object({ ids: z.array(z.string().cuid()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.reminders.bulkComplete(ctx.userId, input.ids);
    }),

  // Push notification subscription management
  subscribeNotifications: authedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.reminders.subscribePush(ctx.userId, input);
      return { success: true };
    }),

  unsubscribeNotifications: authedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.services.reminders.unsubscribePush(ctx.userId, input.endpoint);
      return { success: true };
    }),

  // AI: parse natural language into structured reminder
  parseNaturalLanguage: authedProcedure
    .input(z.object({ text: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.reminders.parseNL(input.text);
    }),

  // AI: proactive reminder suggestions
  getAISuggestions: authedProcedure
    .query(async ({ ctx }) => {
      return ctx.services.reminders.getSuggestions(ctx.userId);
    }),
});
```

---

## 8. Components

```
components/reminders/
├── ReminderList/
│   ├── index.tsx              # Grouped list (Overdue / Today / Upcoming)
│   ├── ReminderGroup.tsx      # Section header + items
│   ├── ReminderRow.tsx        # Single reminder item
│   ├── StatusBadge.tsx        # Priority color dot + label
│   └── RecurrenceBadge.tsx    # "Repeats weekly" chip
├── ReminderForm/
│   ├── index.tsx              # Create/Edit dialog
│   ├── NLInput.tsx            # Natural language input + parse button
│   ├── RecurrenceConfig.tsx   # Frequency, interval, end condition
│   └── TagInput.tsx           # Tag multi-input with autocomplete
├── SnoozeMenu.tsx             # Popover with snooze duration options
├── ReminderFilters.tsx        # Tab bar + tag filter + search
├── AISuggestionBanner.tsx     # AI suggestion card at bottom
├── NotificationPermissionBanner.tsx
└── BulkActionBar.tsx          # Appears when items selected
```

---

## 9. AI Features

### 9.1 Natural Language Parsing

```typescript
// lib/reminders/nlp.ts

const PARSE_SYSTEM_PROMPT = `
You are a reminder parsing assistant. Given a natural language reminder description,
extract the structured fields. Return valid JSON only.

Current date: {currentDate}
Current time: {currentTime}
User timezone: {timezone}

Output format:
{
  "title": "Clean title (imperative verb form)",
  "dueAt": "ISO 8601 datetime string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "recurrence": null | {
    "frequency": "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    "interval": number
  },
  "confidence": 0.0 - 1.0
}
`;

// Examples of NL parsing:
// "call dentist tomorrow at 3pm" →
//   { title: "Call dentist", dueAt: "2026-05-23T15:00:00", priority: "MEDIUM", confidence: 0.95 }

// "remind me to check budget every friday at 7pm" →
//   { title: "Check budget", dueAt: "2026-05-24T19:00:00",
//     recurrence: { frequency: "WEEKLY", interval: 1 }, confidence: 0.90 }

// "urgent: renew car insurance before May 30" →
//   { title: "Renew car insurance", dueAt: "2026-05-30T09:00:00",
//     priority: "URGENT", confidence: 0.88 }
```

### 9.2 Proactive Suggestions

```typescript
// lib/reminders/suggestions.ts

async function generateSuggestions(userId: string): Promise<Suggestion[]> {
  const context = await gatherContext(userId);
  // context includes: recent transactions, upcoming events,
  //                   last month's reminders, completed reminders

  const prompt = buildSuggestionPrompt(context);
  const result = await generateObject({
    model: haikuModel,
    schema: z.object({
      suggestions: z.array(z.object({
        title: z.string(),
        dueAt: z.string(),
        reason: z.string(), // shown to user
        priority: z.nativeEnum(Priority),
      })).max(3),
    }),
    prompt,
  });

  return result.object.suggestions;
}

// Example suggestions generated:
// - "Review budget" (you haven't done it this month)
// - "Pay credit card" (you have a transaction pattern showing it's due)
// - "Book dentist" (you completed "call dentist" 6 months ago)
```

---

## 10. Filters & Tabs

| Tab | Filter Applied |
|-----|---------------|
| All | status: [PENDING, SNOOZED] |
| Today | dueAt: today AND status: [PENDING, SNOOZED] |
| Upcoming | dueAt: > today AND status: PENDING |
| Done | status: DONE (last 30 days) |

**Grouping within "All" and "Today":**
1. Overdue (dueAt < now, status PENDING/SNOOZED) — red header
2. Today (dueAt = today, status PENDING/SNOOZED) — yellow header
3. Upcoming (dueAt > today, status PENDING) — blue header

**Tag filter**: Multi-select dropdown; shows union of all tags in user's reminders.

**Search**: Debounced (300ms), fuzzy match on title + description.

---

## 11. Snooze Options

```typescript
type SnoozePreset = {
  label: string;
  getValue: (now: Date) => Date;
};

const snoozePresets: SnoozePreset[] = [
  { label: '15 minutes',   getValue: (now) => addMinutes(now, 15) },
  { label: '30 minutes',   getValue: (now) => addMinutes(now, 30) },
  { label: '1 hour',       getValue: (now) => addHours(now, 1) },
  { label: '3 hours',      getValue: (now) => addHours(now, 3) },
  { label: 'Tomorrow 9am', getValue: (now) => setHours(addDays(startOfDay(now), 1), 9) },
  { label: 'Next week',    getValue: (now) => addWeeks(now, 1) },
];
// Plus "Custom..." which opens a date-time picker
```

When a reminder is snoozed:
1. `dueAt` is updated to the snooze time
2. `status` remains `PENDING` (or is set back from SNOOZED)
3. A `SnoozeLog` entry is created
4. The reminder moves from "Overdue/Today" to "Upcoming" visually

---

## 12. Quick Create — Keyboard Shortcut

**Global shortcut**: `Cmd+R` (Mac) / `Ctrl+R` (Windows/Linux)

Opens a minimal quick-create modal from anywhere in the app:

```
┌─────────────────────────────────────────────┐
│  ✚ New Reminder                        [✕] │
├─────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │
│  │ 💬 What do you need to remember?      │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  [✨ AI Parse]  or fill manually below:     │
│                                             │
│  Due: [Today ▾ 22/05]  at [09:00 ▾]        │
│  Priority: [○Low] [●Med] [○High] [○Urgent] │
│                                             │
│  [Cancel]                      [Save  ⏎]   │
└─────────────────────────────────────────────┘
```

Pressing Enter saves immediately. Pressing Escape closes without saving.

---

## 13. Calendar Integration

- All reminders with a `dueAt` appear in the Calendar module as non-editable events (read-only, distinct visual style — dotted border)
- Completing/dismissing a reminder from Calendar reflects in Reminders list
- The Calendar `getUpcoming` procedure includes reminders in its response
- Dashboard upcoming widget shows both tasks and reminders together

---

## 14. Animations

| Element | Animation |
|---------|-----------|
| Reminder completed | Row fades out + slide up (collapse), height animated to 0 |
| Reminder snoozed | Moves from Overdue/Today section to Upcoming (animate position) |
| New reminder created | Slides down into correct group (Framer Motion layout animation) |
| Overdue group | Red left border pulses gently (1s ease-in-out infinite, opacity 0.5→1) |
| AI suggestion | Fades in from bottom, slides up |
| Snooze menu | Popover scales in from button origin |
| Priority dot | Color transition 200ms when priority changed |

---

## 15. Edge Cases

| Scenario | Handling |
|----------|----------|
| Push subscription expired/gone | Remove from DB on 410 response, re-prompt user |
| Recurring reminder with count=1 | Complete it and don't create next occurrence |
| Snooze overdue reminder to past | Prevent — validate snooze time is in future |
| Complete recurring reminder twice quickly | Idempotent: check status before creating next occurrence |
| Reminder due while app is closed | Push notification fires; app syncs on next open |
| Natural language parse fails | Fall back to showing empty form (low confidence) |
| Tags with same name different case | Normalize to lowercase before storing |
| Bulk complete includes recurring | Create all next occurrences (may be slow — show progress) |

---

## 16. Mobile Behavior

- **Full-screen**: Reminders page is mobile-optimized, no sidebar
- **Swipe actions**: Swipe-right → complete, Swipe-left → snooze options appear
- **FAB**: Large "+" button bottom-right → opens quick create modal
- **Notification tap**: Deep-links directly to the reminder detail
- **Action notification buttons**: "Mark Done" and "Snooze 1h" buttons in push notification work without opening app (service worker intercepts)

---

## 17. Testing

### Unit Tests

```typescript
// tests/unit/lib/recurrence.test.ts

describe('getNextOccurrence', () => {
  it('DAILY: returns tomorrow', () => {
    const result = getNextOccurrence(new Date('2026-05-22'), {
      frequency: 'DAILY', interval: 1,
    });
    expect(result).toEqual(new Date('2026-05-23'));
  });

  it('WEEKLY with interval 2: returns in 2 weeks', () => {
    const result = getNextOccurrence(new Date('2026-05-22'), {
      frequency: 'WEEKLY', interval: 2,
    });
    expect(result).toEqual(new Date('2026-06-05'));
  });

  it('returns null when past until date', () => {
    const result = getNextOccurrence(new Date('2026-05-22'), {
      frequency: 'DAILY', interval: 1,
      until: new Date('2026-05-21'),
    });
    expect(result).toBeNull();
  });

  it('returns null when count is 0', () => {
    const result = getNextOccurrence(new Date('2026-05-22'), {
      frequency: 'WEEKLY', interval: 1, count: 0,
    });
    expect(result).toBeNull();
  });

  it('MONTHLY: handles month boundary correctly (Jan 31 → Feb 28)', () => { ... });
});

describe('groupRemindersByStatus', () => {
  it('separates overdue, today, upcoming correctly', () => { ... });
  it('snoozed reminder with past snooze time appears in overdue', () => { ... });
});
```

### Integration Tests

```typescript
// tests/integration/trpc/reminders.router.test.ts

describe('createReminder', () => {
  it('creates basic reminder', async () => { ... });
  it('creates recurring reminder with recurrence record', async () => { ... });
  it('rejects past dueAt for new reminders', async () => { ... });
});

describe('completeReminder', () => {
  it('marks reminder as done', async () => { ... });
  it('creates next occurrence for recurring reminder', async () => { ... });
  it('does not create next occurrence when count=1', async () => { ... });
});

describe('snoozeReminder', () => {
  it('updates dueAt and logs snooze', async () => { ... });
  it('rejects snooze to past time', async () => { ... });
});

describe('subscribeNotifications', () => {
  it('saves push subscription', async () => { ... });
  it('overwrites existing subscription for same endpoint', async () => { ... });
});
```

### E2E Tests

```typescript
// tests/e2e/reminder-flow.spec.ts

test('creates reminder via form and sees it in list')
test('creates recurring reminder and verifies "Repeats weekly" badge')
test('completes reminder and verifies it disappears from active list')
test('snoozes reminder and verifies it moves to Upcoming')
test('uses natural language input to parse reminder')
test('bulk completes multiple reminders')
test('overdue reminders appear in red section at top')
```

---

*Last updated: 2026-05-22 | Version: 1.0.0*
