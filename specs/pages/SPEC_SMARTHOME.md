# SPEC_SMARTHOME.md — Mission Control: Smart Home Module

**Version:** 1.0.0
**Status:** Ready for Implementation
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, WebSocket / SSE

---

## 1. Overview

The Smart Home module provides a real-time IoT device control panel within Mission Control. Its primary focus is garage door management (supporting myQ, Shelly, and generic REST APIs), with an extensible architecture for future device types including smart lights, thermostats, door locks, and cameras. The module features an animated garage door widget with live state polling, access logging, time-based scheduling, trigger-based automations, and mobile-optimized controls suitable for use as a PWA shortcut on a home screen.

### Core Capabilities
- Device management: add/configure/remove IoT devices with encrypted API key storage
- Garage door: open / close / stop with animated state machine visualization
- Real-time state: WebSocket subscription (when supported) with 5-second polling fallback
- Access logging: every action recorded with actor, trigger source, timestamp
- Scheduling: cron-based automations ("close at 10pm if open")
- Push notifications: door opened/closed alerts via Web Push
- Security: confirmation dialogs, auto-close timer, access log audit trail
- Mobile-first: PWA manifest entry, large touch targets, quick action from notification

---

## 2. User Stories

1. **As a user**, I want to see my garage door's current state (open/closed/opening/closing) as a large animated widget on my dashboard so that I can immediately know if I left it open without opening any app.

2. **As a user**, I want to tap a single large "Close" button from my phone's home screen PWA shortcut so that I can quickly close the garage without navigating menus.

3. **As a user**, I want to set a schedule that automatically closes the garage at 10 PM every night if it is open so that I never accidentally leave it open overnight.

4. **As a user**, I want to receive a push notification whenever my garage door opens or closes so that I am alerted to unexpected activity even when the app is closed.

5. **As a user**, I want to view a timestamped access log showing every open and close event, who triggered it, and whether it was manual or scheduled so that I have a full audit trail for security.

---

## 3. UI Layout

### 3.1 Full-Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ MISSION CONTROL                                              [User Avatar] [⚙️]  │
├──────────┬──────────────────────────────────────────────────────────────────────┤
│ NAV      │ SMART HOME                                    [+ Add Device]         │
│          ├──────────────────────────────────────────────────────────────────────┤
│ Dashboard│ STATUS BAR                                                           │
│ Calendar │ [● Online: 2]  [○ Offline: 0]  [⚠ Warning: 0]  Last sync: 3s ago   │
│ Gallery  ├──────────────────────────────────────────────────────────────────────┤
│ Smart    │                                                                      │
│ Home     │  GARAGE DOOR HERO WIDGET (full-width, prominent)                    │
│ Reminders│ ┌────────────────────────────────────────────────────────────────┐  │
│ Settings │ │  🏠 Main Garage                                    ● CLOSED    │  │
│          │ │                                                                │  │
│          │ │         [ANIMATED GARAGE DOOR SVG - closed state]             │  │
│          │ │              ┌──────────────────────────┐                     │  │
│          │ │              │ ████████████████████████ │                     │  │
│          │ │              │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │                     │  │
│          │ │              │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │                     │  │
│          │ │              └──────────────────────────┘                     │  │
│          │ │                                                                │  │
│          │ │  Last opened: Today at 7:42 AM (14 min ago)                  │  │
│          │ │  Connection: ● myQ API  Battery: 🔋 85%                       │  │
│          │ │                                                                │  │
│          │ │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│          │ │  │    OPEN     │  │    CLOSE    │  │    STOP     │           │  │
│          │ │  │    (56px)   │  │    (56px)   │  │   (56px)    │           │  │
│          │ │  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│          │ └────────────────────────────────────────────────────────────────┘  │
│          │                                                                      │
│          │  OTHER DEVICES                                                       │
│          │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│          │ │ 💡 Living Rm │ │ 🌡 Thermostat│ │ 🔒 Front Lock│                 │
│          │ │   ON · 75%   │ │    72°F      │ │    LOCKED    │                 │
│          │ │  [Toggle]    │ │  [↑] [↓]     │ │  [Unlock]    │                 │
│          │ └──────────────┘ └──────────────┘ └──────────────┘                 │
│          │                                                                      │
│          │  ACCESS LOG                                    [View All →]          │
│          │ ┌────────────────────────────────────────────────────────────────┐  │
│          │ │ Today 7:42 AM  OPEN   Main Garage  by You (manual)            │  │
│          │ │ Today 7:41 AM  CLOSE  Main Garage  by Schedule (10pm rule)    │  │
│          │ │ Yesterday 9:15 PM OPEN Main Garage by You (manual)            │  │
│          │ │ Yesterday 10:00 PM CLOSE Main Garage by Schedule              │  │
│          │ └────────────────────────────────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Add Device Panel (Slide-in Drawer)

```
┌────────────────────────────────────────────────────────────┐
│  Add New Device                                      [✕]   │
├────────────────────────────────────────────────────────────┤
│  Device Type:                                              │
│  [● Garage Door] [ Light] [ Thermostat] [ Lock] [ Camera] │
│                                                            │
│  Provider:                                                 │
│  [myQ (Chamberlain/LiftMaster) ▼]                         │
│  Options: myQ | Shelly | Generic REST                      │
│                                                            │
│  Device Name:                                              │
│  [Main Garage________________________]                     │
│                                                            │
│  API Configuration:                                        │
│  API Endpoint: [https://________________]                  │
│  API Key: [•••••••••••••••••••••••••••]  [👁]             │
│                                                            │
│  [Test Connection]  ← runs testConnection procedure        │
│  ✓ Connection successful (myQ: 2 devices found)           │
│                                                            │
│  Device:                                                   │
│  [Main Garage Door (ID: abc123) ▼]                        │
│                                                            │
│  [Cancel]                         [Add Device]             │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Schedule Configuration

```
┌────────────────────────────────────────────────────────────┐
│  Device Schedules — Main Garage              [+ Add Rule]  │
├────────────────────────────────────────────────────────────┤
│  ● Close at 10:00 PM every day (if open)     [✏] [⏸] [🗑] │
│    Next run: Tonight at 10:00 PM                          │
│                                                            │
│  ● Open at 7:00 AM Mon–Fri                   [✏] [⏸] [🗑] │
│    Next run: Tomorrow at 7:00 AM                          │
│                                                            │
│  ○ Close at 11:00 PM on weekends (paused)    [✏] [▶] [🗑] │
│    Paused — tap to resume                                 │
├────────────────────────────────────────────────────────────┤
│  New Schedule                                              │
│  Action: [Close ▼]  at  [10 ▼]:[00 ▼] [PM ▼]            │
│  Days: [✓Mon] [✓Tue] [✓Wed] [✓Thu] [✓Fri] [ Sat] [ Sun] │
│  Condition: [✓ Only if currently open]                    │
│                                                            │
│  [Save Schedule]                                           │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Garage Door Integration

### 4.1 Supported Providers

| Provider | API Type | Auth Method | WebSocket? | Notes |
|----------|----------|-------------|------------|-------|
| myQ (Chamberlain/LiftMaster) | REST | API Key + Account | No | Poll every 5s |
| Shelly | REST | Basic Auth or API Key | Yes (MQTT) | WebSocket preferred |
| Generic REST | REST (configurable) | API Key (header/query) | No | User-configured endpoints |

### 4.2 Provider Adapter Architecture

```typescript
// server/lib/iot/providers/types.ts

export type GarageDoorState =
  | "closed"
  | "opening"
  | "open"
  | "closing"
  | "stopped"
  | "unknown"
  | "error";

export type GarageDoorAction = "open" | "close" | "stop";

export interface DeviceProvider {
  readonly name: string;
  readonly supportsWebSocket: boolean;

  /** Test API credentials — resolves true or throws with error message */
  testConnection(config: ProviderConfig): Promise<ProviderTestResult>;

  /** Get current door state */
  getState(config: ProviderConfig): Promise<GarageDoorState>;

  /** Send a command */
  sendCommand(config: ProviderConfig, action: GarageDoorAction): Promise<void>;

  /** Subscribe to real-time state changes (if supportsWebSocket) */
  subscribe?(
    config: ProviderConfig,
    onState: (state: GarageDoorState) => void
  ): () => void; // returns unsubscribe function
}

export interface ProviderConfig {
  apiEndpoint: string;
  apiKey: string; // decrypted
  deviceId: string; // provider-specific device identifier
  extra?: Record<string, unknown>; // provider-specific extra config
}

export interface ProviderTestResult {
  success: boolean;
  devices?: Array<{ id: string; name: string; type: string }>;
  error?: string;
}
```

### 4.3 myQ Provider Implementation

```typescript
// server/lib/iot/providers/myq.ts

import { DeviceProvider, GarageDoorState } from "./types";

const MYQ_STATE_MAP: Record<string, GarageDoorState> = {
  "1": "open",
  "2": "closed",
  "3": "stopped",
  "4": "opening",
  "5": "closing",
  "9": "error",
};

export const myQProvider: DeviceProvider = {
  name: "myQ",
  supportsWebSocket: false,

  async testConnection(config) {
    const res = await fetch(`${config.apiEndpoint}/api/v5.1/my/account`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "MyQ-Calfee": "auto",
      },
    });
    if (!res.ok) return { success: false, error: `Auth failed: ${res.status}` };
    const data = await res.json();
    return { success: true, devices: data.items ?? [] };
  },

  async getState(config) {
    const res = await fetch(
      `${config.apiEndpoint}/api/v5.1/my/account/devices/${config.deviceId}`,
      {
        headers: { Authorization: `Bearer ${config.apiKey}`, "MyQ-Calfee": "auto" },
      }
    );
    if (!res.ok) return "error";
    const data = await res.json();
    const stateCode = String(data.state.reported_composite_state ?? 0);
    return MYQ_STATE_MAP[stateCode] ?? "unknown";
  },

  async sendCommand(config, action) {
    const actionMap: Record<string, string> = {
      open: "open",
      close: "close",
      stop: "stop",
    };
    await fetch(
      `${config.apiEndpoint}/api/v5.1/my/account/devices/${config.deviceId}/actions`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "MyQ-Calfee": "auto",
        },
        body: JSON.stringify({ action_type: actionMap[action] }),
      }
    );
  },
};
```

### 4.4 Generic REST Provider

```typescript
// server/lib/iot/providers/generic-rest.ts
// The user configures endpoint templates in device.config (Json field)

interface GenericRestConfig {
  stateUrl: string;           // GET this URL to get state
  stateJsonPath: string;      // JSONPath to extract state value e.g. "$.door_state"
  stateValueMap: Record<string, GarageDoorState>;
  openUrl: string;            // PUT/POST this URL to open
  closeUrl: string;
  stopUrl?: string;
  method: "GET" | "POST" | "PUT";
  authHeader: string;         // e.g. "Authorization: Bearer {apiKey}"
}
```

### 4.5 API Key Encryption

```typescript
// server/lib/encryption.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex"); // 32-byte key

export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptApiKey(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
```

---

## 5. Data Model

### 5.1 Prisma Schema

```prisma
model IoTDevice {
  id          String     @id @default(cuid())
  userId      String
  name        String
  type        DeviceType
  provider    String     // "myq" | "shelly" | "generic"
  apiEndpoint String
  apiKey      String     // AES-256-GCM encrypted
  deviceId    String?    // Provider-specific device identifier
  isOnline    Boolean    @default(false)
  lastSeen    DateTime?
  config      Json?      // Provider-specific configuration (GenericRestConfig, etc.)
  sortOrder   Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  states      DeviceState[]
  accessLogs  AccessLog[]
  schedules   DeviceSchedule[]
  automations DeviceAutomation[]

  @@index([userId])
  @@index([userId, type])
}

model DeviceState {
  id         String   @id @default(cuid())
  deviceId   String
  state      Json     // { door: "open" | "closed" | ... } or { brightness: 75, on: true }
  recordedAt DateTime @default(now())

  device     IoTDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([deviceId, recordedAt])
}

model AccessLog {
  id          String        @id @default(cuid())
  deviceId    String
  userId      String?       // null if triggered by automation/schedule
  action      String        // "open" | "close" | "stop" | "state_change"
  stateBefore String?       // state before action
  stateAfter  String?       // state after action
  triggeredBy TriggerSource
  metadata    Json?         // additional context (schedule name, automation name)
  createdAt   DateTime      @default(now())

  device      IoTDevice     @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  user        User?         @relation(fields: [userId], references: [id])

  @@index([deviceId, createdAt])
  @@index([userId, createdAt])
}

model DeviceSchedule {
  id             String    @id @default(cuid())
  deviceId       String
  name           String
  action         String    // "open" | "close" | "stop"
  cronExpression String    // e.g. "0 22 * * *" for 10pm daily
  condition      Json?     // e.g. { "onlyIfState": "open" }
  isActive       Boolean   @default(true)
  nextRun        DateTime?
  lastRun        DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  device         IoTDevice @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([deviceId])
  @@index([nextRun])
}

model DeviceAutomation {
  id        String    @id @default(cuid())
  userId    String
  deviceId  String?   // optional: automation may involve multiple devices
  name      String
  trigger   Json      // { type: "state_change", deviceId: "...", state: "open" }
  action    Json      // { deviceId: "...", command: "close", delay: 300 }
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  device    IoTDevice? @relation(fields: [deviceId], references: [id])

  @@index([userId])
}

enum DeviceType {
  garage
  light
  thermostat
  lock
  camera
}

enum TriggerSource {
  manual    // user clicked button in app
  schedule  // cron schedule fired
  automation // automation rule triggered
  api       // external API call
}
```

### 5.2 TypeScript Types

```typescript
// types/smarthome.ts

export type GarageDoorState =
  | "closed"
  | "opening"
  | "open"
  | "closing"
  | "stopped"
  | "unknown"
  | "error";

export type DeviceType = "garage" | "light" | "thermostat" | "lock" | "camera";

export interface IoTDevice {
  id: string;
  userId: string;
  name: string;
  type: DeviceType;
  provider: string;
  apiEndpoint: string;
  // apiKey is NEVER returned to the client — only existence confirmed
  hasApiKey: boolean;
  deviceId: string | null;
  isOnline: boolean;
  lastSeen: Date | null;
  config: Record<string, unknown> | null;
  sortOrder: number;
  createdAt: Date;
}

export interface GarageDeviceState {
  door: GarageDoorState;
  battery?: number;     // 0-100
  wifiStrength?: number; // dBm
  lastUpdated: Date;
}

export interface AccessLogEntry {
  id: string;
  deviceId: string;
  deviceName: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  stateBefore: string | null;
  stateAfter: string | null;
  triggeredBy: "manual" | "schedule" | "automation" | "api";
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface DeviceSchedule {
  id: string;
  deviceId: string;
  name: string;
  action: string;
  cronExpression: string;
  condition: { onlyIfState?: string } | null;
  isActive: boolean;
  nextRun: Date | null;
  lastRun: Date | null;
}

export interface DeviceAutomation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  isActive: boolean;
}

export type AutomationTrigger =
  | { type: "state_change"; deviceId: string; state: string }
  | { type: "schedule"; cronExpression: string }
  | { type: "sensor"; deviceId: string; threshold: number; comparator: "gt" | "lt" };

export type AutomationAction = {
  deviceId: string;
  command: string;
  delaySeconds?: number;
  params?: Record<string, unknown>;
};

// State machine transitions
export const VALID_TRANSITIONS: Record<GarageDoorState, GarageDoorState[]> = {
  closed:  ["opening"],
  opening: ["open", "stopped", "error"],
  open:    ["closing"],
  closing: ["closed", "stopped", "error"],
  stopped: ["opening", "closing"],
  unknown: ["closed", "open", "opening", "closing", "error"],
  error:   ["unknown"],
};
```

---

## 6. tRPC Procedures

### Router: `smartHomeRouter`

```typescript
// server/routers/smarthome.ts

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const DeviceTypeSchema = z.enum(["garage", "light", "thermostat", "lock", "camera"]);

const ProviderSchema = z.enum(["myq", "shelly", "generic"]);

export const smartHomeRouter = createTRPCRouter({
  // ── Device CRUD ──────────────────────────────────────────

  getDevices: protectedProcedure.query(async ({ ctx }) => {
    // Returns IoTDevice[] (apiKey NEVER included in response)
    // Includes latest DeviceState for each device
  }),

  addDevice: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: DeviceTypeSchema,
        provider: ProviderSchema,
        apiEndpoint: z.string().url(),
        apiKey: z.string().min(1),
        deviceId: z.string().optional(),
        config: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Test connection before saving
      // 2. Encrypt apiKey with AES-256-GCM
      // 3. Create IoTDevice record
      // 4. Perform initial state fetch
    }),

  updateDevice: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          apiKey: z.string().optional(), // will be re-encrypted
          config: z.record(z.unknown()).optional(),
          sortOrder: z.number().int().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  removeDevice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Cascades to DeviceState, AccessLog, DeviceSchedule, DeviceAutomation
    }),

  // ── Device State ─────────────────────────────────────────

  getDeviceState: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .query(async ({ ctx, input }) => {
      // 1. Decrypt API key
      // 2. Call provider.getState()
      // 3. Save new DeviceState record
      // 4. Update IoTDevice.isOnline, lastSeen
      // 5. Return GarageDeviceState
    }),

  subscribeDeviceState: protectedProcedure
    .input(z.object({ deviceId: z.string() }))
    .subscription(async function* ({ ctx, input }) {
      // Server-Sent Events or WebSocket subscription
      // For providers without WebSocket: yield polled state every 5s
      // For Shelly with MQTT: yield on each MQTT message
      while (true) {
        const state = await getDeviceStateFromProvider(input.deviceId, ctx);
        yield state;
        await sleep(5000);
      }
    }),

  // ── Device Control ────────────────────────────────────────

  controlDevice: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        action: z.enum(["open", "close", "stop", "toggle", "set"]),
        params: z.record(z.unknown()).optional(), // e.g. { brightness: 75 }
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Fetch device + decrypt API key
      // 2. Validate state transition (e.g., can't "open" if already "opening")
      // 3. Check confirmation required setting (throw requiresConfirmation if set)
      // 4. Call provider.sendCommand()
      // 5. Log to AccessLog with triggeredBy: "manual"
      // 6. Send push notification if configured
      // 7. Return updated state
    }),

  // ── Access Log ───────────────────────────────────────────

  getAccessLog: protectedProcedure
    .input(
      z.object({
        deviceId: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      // Cursor-based pagination, newest first
      // Returns { entries: AccessLogEntry[], nextCursor: string | null }
    }),

  // ── Schedules ────────────────────────────────────────────

  createSchedule: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
        name: z.string().min(1).max(100),
        action: z.enum(["open", "close", "stop"]),
        cronExpression: z.string(), // validated against cron syntax
        condition: z
          .object({ onlyIfState: z.string().optional() })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Validate cron expression
      // 2. Calculate nextRun from cron
      // 3. Create DeviceSchedule record
    }),

  updateSchedule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          name: z.string().optional(),
          action: z.enum(["open", "close", "stop"]).optional(),
          cronExpression: z.string().optional(),
          condition: z.object({ onlyIfState: z.string().optional() }).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {}),

  deleteSchedule: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {}),

  toggleSchedule: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {}),

  // ── Connection Testing ───────────────────────────────────

  testConnection: protectedProcedure
    .input(
      z.object({
        provider: ProviderSchema,
        apiEndpoint: z.string().url(),
        apiKey: z.string(),
        config: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Returns ProviderTestResult (does NOT save to DB)
    }),
});
```

---

## 7. Garage Door Widget

### 7.1 Animated Door SVG State Machine

```typescript
// components/GarageDoorWidget.tsx

// Door panel positions (CSS animation values)
const DOOR_POSITIONS: Record<GarageDoorState, number> = {
  closed:  0,   // 0% raised
  opening: 50,  // animating 0 → 100
  open:    100, // 100% raised
  closing: 50,  // animating 100 → 0
  stopped: 25,  // mid-position (configurable)
  unknown: 0,
  error:   0,
};

// Framer Motion animation for door panels
const doorPanelVariants: Variants = {
  closed:  { y: 0 },
  opening: { y: [0, -120], transition: { duration: 8, ease: "linear", repeat: 0 } },
  open:    { y: -120 },
  closing: { y: [-120, 0], transition: { duration: 8, ease: "linear", repeat: 0 } },
  stopped: { y: -60 },
  unknown: { y: 0, opacity: 0.5 },
  error:   { y: 0, opacity: 0.3 },
};
```

### 7.2 Status Indicator Colors

| State | Color | Tailwind | Pulsing? |
|-------|-------|----------|----------|
| closed | Green | `text-green-500` | No |
| opening | Yellow | `text-yellow-400` | Yes |
| open | Red | `text-red-500` | Yes — warning |
| closing | Yellow | `text-yellow-400` | Yes |
| stopped | Orange | `text-orange-500` | Yes |
| unknown | Gray | `text-gray-400` | No |
| error | Red | `text-red-600` | Yes — fast |

### 7.3 Control Buttons

```typescript
// Touch target minimum: 56px × 56px (per Apple HIG and Material Design)
// Buttons disabled during transitions (opening/closing state)

interface ControlButtonProps {
  action: "open" | "close" | "stop";
  currentState: GarageDoorState;
  onClick: () => void;
  isLoading: boolean;
}

function isActionAllowed(action: GarageDoorAction, state: GarageDoorState): boolean {
  const allowedActions: Record<GarageDoorState, GarageDoorAction[]> = {
    closed:  ["open"],
    open:    ["close"],
    opening: ["stop"],
    closing: ["stop"],
    stopped: ["open", "close"],
    unknown: ["open", "close"],
    error:   [],
  };
  return allowedActions[state].includes(action);
}
```

### 7.4 Confirmation Dialog (Open Action)

```typescript
interface GarageConfirmSettings {
  requireConfirmForOpen: boolean;   // default: true
  requireConfirmForClose: boolean;  // default: false
  autoCloseMinutes: number | null;  // null = disabled
}

// If requireConfirmForOpen = true:
// Before sending "open" command, show modal:
// "Open main garage door? This will be logged."
// [Cancel]  [Open Door]
```

---

## 8. Security Features

### 8.1 Confirmation Dialog System

```typescript
// Confirmation is configurable per-device in device settings
// Stored in IoTDevice.config as: { confirmationRequired: { open: true, close: false } }

// Implementation:
// 1. User clicks "Open"
// 2. If confirmationRequired.open: open confirmation modal
// 3. Modal shows: device name, action, access will be logged
// 4. Confirm → send command → log action
// 5. Cancel → no command sent, no log entry
```

### 8.2 Auto-Close Timer

```typescript
// When door is opened (state transitions to "open"):
// If autoCloseMinutes is configured, schedule a delayed close

// Server implementation: Vercel Cron or Upstash QStash delayed job
async function scheduleAutoClose(deviceId: string, minutes: number): Promise<void> {
  await qstash.publishJSON({
    url: `${env.NEXTAUTH_URL}/api/webhooks/auto-close`,
    body: { deviceId, scheduledAt: new Date().toISOString() },
    delay: minutes * 60, // seconds
  });
}

// The webhook checks current state before closing:
// If state is still "open" → send close command
// If already closed → no-op (no spurious close)
```

### 8.3 Access Notifications

```typescript
// When controlDevice is called (any trigger):
// If user has push subscriptions with "smartHome" notification type enabled:
// Send push notification

const buildNotificationPayload = (log: AccessLogEntry): PushPayload => ({
  title: `Garage Door ${log.action === "open" ? "Opened" : "Closed"}`,
  body: `${log.deviceName} — ${formatTime(log.createdAt)} by ${log.triggeredBy}`,
  icon: "/icons/garage-door.png",
  badge: "/icons/badge.png",
  data: {
    url: "/smarthome",
    logId: log.id,
  },
  actions: [
    { action: "view-log", title: "View Log" },
    { action: "close-door", title: "Close Door" }, // only if state is "open"
  ],
});
```

---

## 9. Scheduling System

### 9.1 Cron Job Execution

```typescript
// app/api/cron/run-device-schedules/route.ts
// Triggered by Vercel Cron: every minute

export async function GET(request: Request) {
  // Verify cron secret header
  const now = new Date();

  // Find all active schedules where nextRun <= now
  const dueSchedules = await db.deviceSchedule.findMany({
    where: {
      isActive: true,
      nextRun: { lte: now },
    },
    include: { device: true },
  });

  for (const schedule of dueSchedules) {
    await executeSchedule(schedule);
    const nextRun = getNextCronDate(schedule.cronExpression);
    await db.deviceSchedule.update({
      where: { id: schedule.id },
      data: { lastRun: now, nextRun },
    });
  }
}

async function executeSchedule(schedule: DeviceScheduleWithDevice): Promise<void> {
  // 1. Check condition (e.g., onlyIfState: "open")
  const currentState = await getDeviceStateFromProvider(schedule.device);
  if (schedule.condition?.onlyIfState && currentState.door !== schedule.condition.onlyIfState) {
    return; // Condition not met, skip
  }

  // 2. Send command
  const provider = getProvider(schedule.device.provider);
  const config = buildProviderConfig(schedule.device);
  await provider.sendCommand(config, schedule.action as GarageDoorAction);

  // 3. Log to AccessLog
  await db.accessLog.create({
    data: {
      deviceId: schedule.deviceId,
      action: schedule.action,
      triggeredBy: "schedule",
      metadata: { scheduleName: schedule.name, scheduleId: schedule.id },
    },
  });

  // 4. Send push notification
  await sendDeviceNotification(schedule.deviceId, schedule.action);
}
```

### 9.2 Cron Expression Helpers

```typescript
// lib/cron-utils.ts
import { parseExpression } from "cron-parser";

export function getNextCronDate(expression: string): Date {
  const interval = parseExpression(expression, { utc: false });
  return interval.next().toDate();
}

export function validateCronExpression(expression: string): boolean {
  try {
    parseExpression(expression);
    return true;
  } catch {
    return false;
  }
}

export function describeCron(expression: string): string {
  // Human-readable: "0 22 * * *" → "Every day at 10:00 PM"
  // Use cronstrue library for human-readable output
  return cronstrue.toString(expression);
}
```

### 9.3 Schedule UI Examples

| Schedule | Cron Expression | Human Description |
|----------|-----------------|-------------------|
| Close at 10pm daily | `0 22 * * *` | Every day at 10:00 PM |
| Open at 7am weekdays | `0 7 * * 1-5` | Mon–Fri at 7:00 AM |
| Close Saturday midnight | `0 0 * * 6` | Every Saturday at midnight |
| Check every 30min | `*/30 * * * *` | Every 30 minutes |

---

## 10. Real-Time Updates

### 10.1 WebSocket Subscription (tRPC Subscriptions)

```typescript
// For providers with WebSocket support (Shelly/MQTT):
// tRPC subscription yields state changes in real time

// For providers without WebSocket (myQ):
// Server-side polling every 5 seconds, yield changes via SSE

// Client-side implementation:
function useGarageState(deviceId: string) {
  const [state, setState] = useState<GarageDeviceState | null>(null);

  // Try subscription first (real-time)
  trpc.smartHome.subscribeDeviceState.useSubscription(
    { deviceId },
    {
      onData: (data) => setState(data),
      onError: (err) => {
        console.error("Subscription failed, falling back to polling", err);
      },
    }
  );

  // Fallback: TanStack Query polling if subscription unavailable
  trpc.smartHome.getDeviceState.useQuery(
    { deviceId },
    {
      refetchInterval: 5000,
      enabled: !hasActiveSubscription,
    }
  );

  return state;
}
```

### 10.2 State Transition Animation

```typescript
// When state changes from server, animate door accordingly
// Use Framer Motion's AnimatePresence for smooth transitions

useEffect(() => {
  if (previousState !== currentState) {
    // Animate door icon to new state
    controls.start(currentState);

    // Show state change toast
    if (currentState === "open") {
      toast.warning("Garage door is now open");
    } else if (currentState === "closed") {
      toast.success("Garage door is now closed");
    }
  }
}, [currentState, previousState, controls]);
```

---

## 11. Mobile Optimization

### 11.1 PWA Manifest Entry

```json
// public/manifest.json addition
{
  "shortcuts": [
    {
      "name": "Garage Door",
      "short_name": "Garage",
      "description": "Control your garage door",
      "url": "/smarthome?device=garage&action=quick",
      "icons": [{ "src": "/icons/garage-96.png", "sizes": "96x96" }]
    }
  ]
}
```

### 11.2 Quick Action View (`/smarthome?action=quick`)

When opened from PWA shortcut or notification deep-link, render a simplified view:

```
┌────────────────────────────────────────┐
│  🏠 Main Garage                        │
│                                        │
│  ● CLOSED                              │
│  Last opened: 14 min ago               │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │           OPEN DOOR              │  │
│  │           (full-width,           │  │
│  │            72px tall)            │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  [View Full Dashboard →]               │
└────────────────────────────────────────┘
```

### 11.3 Touch Target Compliance

- All action buttons: minimum `min-h-[56px] min-w-[56px]` (Tailwind)
- Control buttons (Open/Close/Stop): `h-14 w-full md:w-40` for mobile-first sizing
- Access log rows: minimum `py-3` padding for comfortable touch

### 11.4 Notification Deep Linking

```typescript
// service-worker.js
self.addEventListener("notificationclick", (event) => {
  const { action, data } = event.notification;
  event.notification.close();

  if (action === "close-door") {
    // Trigger close command via Background Sync or fetch
    event.waitUntil(
      fetch("/api/device-command", {
        method: "POST",
        body: JSON.stringify({ deviceId: data.deviceId, action: "close" }),
      })
    );
  } else {
    // Open/focus the app
    event.waitUntil(
      clients.openWindow(data.url ?? "/smarthome")
    );
  }
});
```

---

## 12. State Management

### 12.1 Zustand Store

```typescript
// store/smartHomeStore.ts

interface SmartHomeStore {
  // Device states (keyed by deviceId)
  deviceStates: Record<string, GarageDeviceState>;
  pollingIntervals: Record<string, ReturnType<typeof setInterval>>;

  // UI state
  selectedDeviceId: string | null;
  isAddDeviceOpen: boolean;
  isScheduleModalOpen: boolean;

  // Optimistic state (while command is in-flight)
  optimisticStates: Record<string, GarageDoorState>;

  // Actions
  setDeviceState: (deviceId: string, state: GarageDeviceState) => void;
  setOptimisticState: (deviceId: string, state: GarageDoorState) => void;
  clearOptimisticState: (deviceId: string) => void;
  setSelectedDevice: (id: string | null) => void;
  openAddDevice: () => void;
  closeAddDevice: () => void;
}
```

---

## 13. Testing

### 13.1 State Machine Unit Tests

```typescript
// __tests__/garage-state-machine.test.ts

describe("garage door state machine", () => {
  it("allows open command when state is closed", () => {
    expect(isActionAllowed("open", "closed")).toBe(true);
  });

  it("rejects open command when state is opening", () => {
    expect(isActionAllowed("open", "opening")).toBe(false);
  });

  it("allows stop command when opening or closing", () => {
    expect(isActionAllowed("stop", "opening")).toBe(true);
    expect(isActionAllowed("stop", "closing")).toBe(true);
  });

  it("rejects all actions when state is error", () => {
    expect(isActionAllowed("open", "error")).toBe(false);
    expect(isActionAllowed("close", "error")).toBe(false);
    expect(isActionAllowed("stop", "error")).toBe(false);
  });

  it("maps provider state codes to domain states correctly (myQ)", () => {
    expect(MYQ_STATE_MAP["2"]).toBe("closed");
    expect(MYQ_STATE_MAP["4"]).toBe("opening");
    expect(MYQ_STATE_MAP["5"]).toBe("closing");
  });
});
```

### 13.2 Schedule Calculation Tests

```typescript
// __tests__/schedule.test.ts

describe("schedule cron utilities", () => {
  it("calculates next run for daily 10pm schedule", () => {
    vi.setSystemTime(new Date("2026-05-22T20:00:00")); // 8pm
    const next = getNextCronDate("0 22 * * *");
    expect(next.getHours()).toBe(22);
    expect(next.getDate()).toBe(22);
  });

  it("skips to next day if cron time already passed today", () => {
    vi.setSystemTime(new Date("2026-05-22T23:00:00")); // 11pm (after 10pm)
    const next = getNextCronDate("0 22 * * *");
    expect(next.getDate()).toBe(23); // tomorrow
  });

  it("respects onlyIfState condition — skips if door not open", async () => {
    const schedule = { ...mockSchedule, condition: { onlyIfState: "open" } };
    const mockGetState = vi.fn().mockResolvedValue({ door: "closed" });
    await executeSchedule(schedule, mockGetState);
    expect(mockSendCommand).not.toHaveBeenCalled();
  });

  it("validates cron expressions correctly", () => {
    expect(validateCronExpression("0 22 * * *")).toBe(true);
    expect(validateCronExpression("0 7 * * 1-5")).toBe(true);
    expect(validateCronExpression("not-a-cron")).toBe(false);
    expect(validateCronExpression("60 22 * * *")).toBe(false); // invalid minute
  });
});
```

### 13.3 API Mock Tests (Garage Door Provider)

```typescript
// __tests__/myq-provider.test.ts

describe("myQ provider", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockClear();
  });

  it("maps state code 2 to closed", async () => {
    mockFetch({ state: { reported_composite_state: 2 } });
    const state = await myQProvider.getState(mockConfig);
    expect(state).toBe("closed");
  });

  it("sends PUT request to correct endpoint for open command", async () => {
    mockFetch({});
    await myQProvider.sendCommand(mockConfig, "open");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/actions"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ action_type: "open" }),
      })
    );
  });

  it("returns error state on API 4xx response", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 401 } as Response);
    const state = await myQProvider.getState(mockConfig);
    expect(state).toBe("error");
  });

  it("handles network timeout gracefully", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network timeout"));
    const state = await myQProvider.getState(mockConfig);
    expect(state).toBe("error");
  });
});
```

### 13.4 Encryption Tests

```typescript
// __tests__/encryption.test.ts

describe("API key encryption", () => {
  it("roundtrip encrypt → decrypt returns original", () => {
    const original = "secret-api-key-12345";
    const encrypted = encryptApiKey(original);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(original);
  });

  it("generates unique ciphertext each time (random IV)", () => {
    const key = "same-key";
    const a = encryptApiKey(key);
    const b = encryptApiKey(key);
    expect(a).not.toBe(b); // different IVs → different ciphertext
  });

  it("throws on tampered ciphertext (auth tag fails)", () => {
    const encrypted = encryptApiKey("my-key");
    const tampered = encrypted.slice(0, -4) + "0000"; // corrupt auth tag
    expect(() => decryptApiKey(tampered)).toThrow();
  });
});
```

---

## 14. File Structure

```
app/
  (app)/
    smarthome/
      page.tsx                    # SmartHomePage
      loading.tsx
      _components/
        StatusBar.tsx
        GarageDoorWidget.tsx
        GarageDoorSVG.tsx         # Animated SVG door
        ControlButtons.tsx
        ConfirmActionModal.tsx
        DeviceCard.tsx
        DeviceGrid.tsx
        AddDevicePanel.tsx
        AccessLog.tsx
        AccessLogEntry.tsx
        ScheduleManager.tsx
        ScheduleForm.tsx
        AutoCloseSettings.tsx
      _hooks/
        useGarageState.ts
        useDevicePolling.ts
        useGarageSubscription.ts
      _utils/
        stateMachine.ts
        cronUtils.ts

server/
  routers/
    smarthome.ts
  lib/
    iot/
      providers/
        index.ts                  # Provider registry
        types.ts
        myq.ts
        shelly.ts
        generic-rest.ts
    encryption.ts

app/
  api/
    cron/
      run-device-schedules/
        route.ts
    webhooks/
      auto-close/
        route.ts
      device-notification/
        route.ts

store/
  smartHomeStore.ts

types/
  smarthome.ts
```

---

## 15. Performance Considerations

- **Polling Rate Limiting:** Never poll more than once per 5 seconds per device; debounce rapid user button clicks
- **State Caching:** Cache last-known state in Redis (or Zustand) to avoid unnecessary API calls when navigating back to the page
- **Cron Precision:** Vercel Cron minimum interval is 1 minute; for sub-minute automation needs, use Upstash QStash
- **Connection Pooling:** Use a singleton HTTP client per provider; don't create new fetch connections per request
- **Error Recovery:** On three consecutive API failures, mark device as offline and back-off polling to every 60 seconds
- **Encryption Key Rotation:** Document procedure for rotating `ENCRYPTION_KEY` env var and re-encrypting stored API keys

---

*End of SPEC_SMARTHOME.md*
