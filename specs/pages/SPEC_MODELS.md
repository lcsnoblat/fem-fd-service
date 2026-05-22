# SPEC_MODELS.md — Models Configuration Module

**Platform:** Mission Control  
**Module:** Models — AI Provider & Model Slot Management  
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, Vercel AI SDK  
**Last updated:** 2026-05-22

---

## 1. Overview

The Models module is the unified control plane for all AI capabilities across Mission Control. Every module in the platform — Agent, Recipes AI, Shopping AI, Jobs Fit Score, Finance Insights, Reminders NLP, Calendar AI, Gallery Tags, Reports AI — routes its LLM calls through a centrally configured "model slot." Each slot specifies:

- Which provider to use (Anthropic, OpenAI, Groq, Google, Ollama, or a custom OpenAI-compatible endpoint).
- Which specific model to use within that provider.
- Runtime parameters: temperature, max tokens, custom system prompt.

Users add their own API keys, which are encrypted at rest and never exposed to the client. The module also tracks token consumption and cost per feature per day, with configurable budget alerts.

Ollama support enables fully local, private model execution for all features that support it, with automatic discovery if Ollama is running on the same host.

Key capabilities:
- **Per-feature model slots**: Each of the 10 platform features has an independently configurable model.
- **Provider management**: Add, test, and remove providers; supports any OpenAI-compatible API.
- **API key security**: AES-256 encryption, key masking, server-side-only access.
- **Local AI**: Ollama integration with model pull UI, progress tracking, and health checks.
- **Usage tracking**: Token counts and estimated costs logged per call, aggregated by feature and provider.
- **Budget alerts**: Configurable monthly spending limits with notifications at 80% and 100%.

---

## 2. User Stories

### US-01: Add Anthropic API Key
> As a user, I want to add my Anthropic API key so that Agent and other AI features can use Claude models without me needing to configure anything else.

**Acceptance criteria:**
- User navigates to the Anthropic provider card and clicks "Add API Key."
- Key is sent to the server over HTTPS, encrypted with AES-256, and stored — never returned to the client.
- The UI shows a masked key (`sk-ant-...XY5z`) and a green "Verified" badge after a successful test call.
- If the key is invalid, a clear error message is shown and the key is not persisted.

### US-02: Switch Agent to a Different Model
> As a power user, I want to switch the Agent module from `claude-opus-4-7` to `claude-sonnet-4-6` to reduce costs while keeping acceptable quality.

**Acceptance criteria:**
- The Agent model slot shows the current model and provider.
- Clicking the slot opens the ModelPicker component showing all models available from all active providers.
- After selecting the new model, the slot updates and subsequent Agent sessions use the new model immediately.
- The model picker shows the context length and cost tier for each option.

### US-03: Use Ollama for Local Processing
> As a privacy-conscious user, I want all AI features to use a locally running Ollama model so that no data leaves my machine.

**Acceptance criteria:**
- Ollama is auto-discovered at `localhost:11434` and shown as "Available" in the Providers list.
- User can assign any Ollama model to any feature slot that supports local models.
- Features that require vision capability (Gallery Tags) show a warning if the selected Ollama model is not vision-capable.
- The health indicator turns red if Ollama goes offline, and affected features fall back to the global fallback model.

### US-04: Monitor Token Usage and Costs
> As a user managing cloud API spend, I want to see how many tokens each feature consumed today and this month, and what it cost.

**Acceptance criteria:**
- The usage panel shows a bar chart by feature for the current month.
- Each bar's tooltip shows: input tokens, output tokens, total tokens, estimated cost in USD.
- Costs are calculated using published pricing (stored in code, updated quarterly).
- A "this month" total cost figure is shown prominently.

### US-05: Set a Monthly Budget Alert
> As a user, I want to set a $20/month budget and be notified (push + email) when I reach 80% and 100% so I can adjust my model usage.

**Acceptance criteria:**
- User sets a budget limit in the Usage panel.
- At 80% ($16), a push notification and email are sent.
- At 100% ($20), another notification is sent and a warning banner appears in the Models module.
- The budget progress bar in the UI updates in real time as usage accrues.

### US-06: Pull and Use a New Ollama Model
> As a user, I want to pull `llama3.3` from within the UI so I can use it as the model for Recipes AI without leaving the platform.

**Acceptance criteria:**
- The Ollama section shows a "Pull model" input field.
- Entering `llama3.3` and clicking Pull shows a progress bar with downloaded/total bytes.
- Once pulled, the model appears in the Ollama model list and is immediately selectable in any feature slot.
- Pull progress streams in real time via a tRPC subscription.

---

## 3. UI Layout

### 3.1 Full Layout — ASCII Wireframe

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│  MODELS  —  Configure AI providers and model assignments                                          │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
┌───────────────────┬──────────────────────────────────────────────┬──────────────────────────────┐
│  PROVIDERS        │  MODEL SLOTS                                 │  USAGE & COSTS               │
│  ─────────────    │  ─────────────────────────────────────────   │  ─────────────────────────   │
│                   │                                              │                              │
│  ┌─────────────┐  │  Feature           Model                     │  This month: $4.32 / $20     │
│  │ Anthropic  ●│  │  ──────────────    ──────────────────────    │  ████████░░░░░░░░  21.6%    │
│  │ sk-ant-..Xz│  │                                              │                              │
│  │ [Test] [✎] │  │  Agent             [claude-opus-4-7      ▼]  │  By feature (this month):   │
│  └─────────────┘  │  Recipes AI        [claude-haiku-4-5    ▼]  │  Agent          $3.10        │
│                   │  Shopping AI       [claude-haiku-4-5    ▼]  │  Reports AI     $0.72        │
│  ┌─────────────┐  │  Jobs Fit Score    [claude-sonnet-4-6   ▼]  │  Recipes AI     $0.31        │
│  │ OpenAI     ●│  │  Finance Insights  [claude-haiku-4-5    ▼]  │  Finance        $0.12        │
│  │ sk-...BZ4  │  │  Reminders NLP     [claude-haiku-4-5    ▼]  │  Other          $0.07        │
│  │ [Test] [✎] │  │  Calendar AI       [claude-haiku-4-5    ▼]  │                              │
│  └─────────────┘  │  Gallery Tags      [claude-haiku-4-5    ▼]  │  ─────────────────────────   │
│                   │  Reports AI        [claude-haiku-4-5    ▼]  │  Usage (last 30 days):       │
│  ┌─────────────┐  │  Global fallback   [claude-haiku-4-5    ▼]  │                              │
│  │ Groq       ○│  │                                              │  ▂▃▅▄▆▇▄▃▅▆▇▅▄▆▃▂▄▅▇▆▄▅▃▄  │
│  │ No key     │  │  ─────────────────────────────────────────   │  May 1              May 22   │
│  │ [Add Key]  │  │  Advanced settings for: Agent                │                              │
│  └─────────────┘  │                                              │  ─────────────────────────   │
│                   │  Temperature      [──●────────────]  0.7    │  Budget Alert                │
│  ┌─────────────┐  │  Max tokens       [4096          ]          │  Limit:  [$20.00 / month   ] │
│  │ Google     ○│  │  System prompt    [Custom...     ]          │  Notify: [80%] and [100%]    │
│  │ No key     │  │  Top-P            [──────●────────]  0.95   │  Channel:[✓ Email] [✓ Push]  │
│  │ [Add Key]  │  │                                              │  [Save alert settings]       │
│  └─────────────┘  │                                              │                              │
│                   │                                              │  ─────────────────────────   │
│  ┌─────────────┐  │                                              │  Rate limits (Anthropic):    │
│  │ Ollama     ●│  │                                              │  Requests: 48 / 50 rpm       │
│  │ 4 models   │  │                                              │  Tokens: 18k / 40k tpm       │
│  │ localhost  │  │                                              │  ████████████████████░  96%  │
│  └─────────────┘  │                                              │                              │
│                   │                                              │                              │
│  [+ Add Provider] │                                              │                              │
└───────────────────┴──────────────────────────────────────────────┴──────────────────────────────┘

── OLLAMA SECTION (expands when Ollama card is selected) ───────────────────────────────────────────
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│  Ollama — Local Models                                                        Status: ● Running   │
│                                                                                                   │
│  Available models:                     Pull new model:                                            │
│  ┌──────────────────────────────┐      [llama3.3              ] [Pull]                           │
│  │ ● llama3.2        3.8 GB  ✓ │      Downloading: ollama3.3 ████████████░░░░  67%  2.1/3.8 GB │
│  │ ● mistral-nemo    7.1 GB  ✓ │                                                                │
│  │ ● phi4             8.9 GB  ✓ │                                                                │
│  │ ○ llava           4.7 GB  ✓ │ 👁  (vision-capable)                                          │
│  └──────────────────────────────┘                                                                 │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Panel Descriptions

**Providers List (left):**
- One card per provider. Green dot = active + key verified. Grey dot = inactive or no key.
- Shows masked API key when present.
- "Test" button sends a small probe call and shows latency.
- "Edit" opens an inline form to update the key or base URL.
- "Add Provider" opens a dialog for: selecting provider type, entering base URL (for custom/Ollama), entering API key.

**Model Slots (center):**
- Each row is one platform feature. The dropdown is the `ModelPicker` component (see section 10).
- Clicking a row expands the "Advanced settings" section below the table, showing temperature, max tokens, system prompt override, and top-P for the selected feature.
- The table is read-only scrollable; the advanced panel is only shown for the selected feature row.

**Usage & Costs (right):**
- Budget progress bar at top (current spend / limit).
- Cost breakdown by feature (static for current month).
- Sparkline chart: daily token usage for last 30 days (Recharts `AreaChart`).
- Rate limit meters (only shown if provider has configurable rate limits, e.g., Anthropic).
- Budget alert configuration form.

---

## 4. Model Slots

Every platform feature maps to exactly one `ModelSlot` record. A slot identifies the feature by a stable enum value (`FeatureSlot`) and stores the chosen provider + model.

```typescript
// src/types/models.ts

export const FeatureSlot = {
  AGENT: 'AGENT',
  RECIPES_AI: 'RECIPES_AI',
  SHOPPING_AI: 'SHOPPING_AI',
  JOBS_FIT_SCORE: 'JOBS_FIT_SCORE',
  FINANCE_INSIGHTS: 'FINANCE_INSIGHTS',
  REMINDERS_NLP: 'REMINDERS_NLP',
  CALENDAR_AI: 'CALENDAR_AI',
  GALLERY_TAGS: 'GALLERY_TAGS',
  REPORTS_AI: 'REPORTS_AI',
  GLOBAL_FALLBACK: 'GLOBAL_FALLBACK',
} as const;

export type FeatureSlot = (typeof FeatureSlot)[keyof typeof FeatureSlot];

export interface ModelSlotConfig {
  feature: FeatureSlot;
  label: string;
  description: string;
  defaultModel: string;
  defaultProvider: string; // provider name slug
  supportsLocal: boolean;
  requiresVision: boolean;
  costTier: 'low' | 'medium' | 'high';
}

export const MODEL_SLOT_CONFIGS: Record<FeatureSlot, ModelSlotConfig> = {
  AGENT: {
    feature: 'AGENT',
    label: 'Agent',
    description: 'Powers the autonomous AI coding assistant. Complex reasoning required.',
    defaultModel: 'claude-opus-4-7',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'high',
  },
  RECIPES_AI: {
    feature: 'RECIPES_AI',
    label: 'Recipes AI',
    description: 'Generates recipes, parses ingredients, and builds meal plans.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'low',
  },
  SHOPPING_AI: {
    feature: 'SHOPPING_AI',
    label: 'Shopping AI',
    description: 'Recommends items, compares products, and manages shopping lists.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'low',
  },
  JOBS_FIT_SCORE: {
    feature: 'JOBS_FIT_SCORE',
    label: 'Jobs Fit Score',
    description: 'Evaluates how well a job posting matches the user\'s profile. Nuanced analysis.',
    defaultModel: 'claude-sonnet-4-6',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'medium',
  },
  FINANCE_INSIGHTS: {
    feature: 'FINANCE_INSIGHTS',
    label: 'Finance Insights',
    description: 'Analyzes spending patterns and generates financial summaries.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'low',
  },
  REMINDERS_NLP: {
    feature: 'REMINDERS_NLP',
    label: 'Reminders NLP',
    description: 'Parses natural language reminder text into structured data.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'low',
  },
  CALENDAR_AI: {
    feature: 'CALENDAR_AI',
    label: 'Calendar AI',
    description: 'Schedules events from natural language, resolves conflicts.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'low',
  },
  GALLERY_TAGS: {
    feature: 'GALLERY_TAGS',
    label: 'Gallery Tags',
    description: 'Auto-tags photos with subjects, scenes, and categories. Vision required.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: true,  // Vision-capable models only
    costTier: 'low',
  },
  REPORTS_AI: {
    feature: 'REPORTS_AI',
    label: 'Reports AI',
    description: 'Summarizes scraped report data and generates natural language insights.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'low',
  },
  GLOBAL_FALLBACK: {
    feature: 'GLOBAL_FALLBACK',
    label: 'Global Fallback',
    description: 'Used if a feature\'s primary model is unavailable or its provider is offline.',
    defaultModel: 'claude-haiku-4-5',
    defaultProvider: 'anthropic',
    supportsLocal: true,
    requiresVision: false,
    costTier: 'low',
  },
};
```

### 4.1 Model Resolution

At runtime, the Vercel AI SDK model instance is resolved via:

```typescript
// src/server/models/modelResolver.ts
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createOpenAI } from '@ai-sdk/openai'; // for custom/Ollama
import { google } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModel } from 'ai';

export async function resolveModel(
  feature: FeatureSlot,
  userId: string,
  db: PrismaClient,
): Promise<LanguageModel> {
  const slot = await db.modelSlot.findUnique({
    where: { userId_feature: { userId, feature } },
    include: { provider: true },
  });

  // Fall back to global fallback if slot not configured
  const effectiveSlot = slot ?? (await getGlobalFallbackSlot(userId, db));

  const { provider, modelId } = effectiveSlot;

  // Decrypt API key server-side
  const apiKey = provider.apiKey ? decrypt(provider.apiKey) : undefined;

  switch (provider.type) {
    case 'anthropic':
      return anthropic(modelId, { apiKey });
    case 'openai':
      return openai(modelId, { apiKey });
    case 'groq':
      return createGroq({ apiKey })(modelId);
    case 'google':
      return google(modelId, { apiKey });
    case 'ollama':
    case 'custom': {
      const customProvider = createOpenAI({
        baseURL: provider.baseUrl!,
        apiKey: apiKey ?? 'ollama', // Ollama ignores the key
      });
      return customProvider(modelId);
    }
    default:
      throw new Error(`Unknown provider type: ${provider.type}`);
  }
}
```

---

## 5. Data Model

### 5.1 Prisma Schema

```prisma
// prisma/schema.prisma (Models module)

enum ProviderType {
  anthropic
  openai
  groq
  google
  ollama
  custom
}

enum FeatureSlot {
  AGENT
  RECIPES_AI
  SHOPPING_AI
  JOBS_FIT_SCORE
  FINANCE_INSIGHTS
  REMINDERS_NLP
  CALENDAR_AI
  GALLERY_TAGS
  REPORTS_AI
  GLOBAL_FALLBACK
}

model ModelProvider {
  id        String       @id @default(cuid())
  userId    String
  name      String       // e.g. "My Anthropic", "Local Ollama"
  type      ProviderType
  baseUrl   String?      // For ollama and custom providers
  /// AES-256 encrypted API key (null for Ollama)
  apiKey    String?
  isActive  Boolean      @default(true)
  testedAt  DateTime?
  /// Cached model list: { id, name, contextLength, costPer1kInput, costPer1kOutput, isVision }[]
  models    Json[]       @default([])
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  slots     ModelSlot[]
  usage     ModelUsage[]

  @@unique([userId, name])
  @@index([userId, type])
  @@index([userId, isActive])
}

model ModelSlot {
  id             String        @id @default(cuid())
  userId         String
  feature        FeatureSlot
  providerId     String
  modelId        String        // e.g. "claude-haiku-4-5"
  temperature    Float         @default(0.7)
  maxTokens      Int           @default(4096)
  /// Optional system prompt override for this feature
  systemPrompt   String?
  /// Provider-specific extra params: { topP, topK, stopSequences, ... }
  customParams   Json          @default("{}")
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider       ModelProvider @relation(fields: [providerId], references: [id])
  agentSessions  AgentSession[]

  @@unique([userId, feature])
  @@index([userId])
}

model ModelUsage {
  id           String        @id @default(cuid())
  userId       String
  providerId   String
  modelId      String
  feature      FeatureSlot
  inputTokens  Int
  outputTokens Int
  /// Cost calculated at time of call based on published pricing
  costUsd      Float
  /// Wall-clock time for the LLM call
  durationMs   Int
  timestamp    DateTime      @default(now())

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider     ModelProvider @relation(fields: [providerId], references: [id])

  @@index([userId, timestamp(sort: Desc)])
  @@index([userId, feature, timestamp(sort: Desc)])
  @@index([userId, providerId, timestamp(sort: Desc)])
}

model OllamaModel {
  id          String   @id @default(cuid())
  userId      String
  name        String   // e.g. "llama3.2"
  size        BigInt   // bytes
  digest      String   // content hash
  isVision    Boolean  @default(false)
  pulledAt    DateTime @default(now())
  isAvailable Boolean  @default(true)

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
  @@index([userId, isAvailable])
}
```

### 5.2 Derived TypeScript Types

```typescript
import type { ModelProvider, ModelSlot, ModelUsage, OllamaModel } from '@prisma/client';

export interface ModelDefinition {
  id: string;              // model identifier sent to API
  name: string;            // display name
  contextLength: number;   // max context window tokens
  costPer1kInput: number;  // USD
  costPer1kOutput: number; // USD
  isVision: boolean;
  isLocal: boolean;
}

export type ModelProviderWithModels = ModelProvider & {
  models: ModelDefinition[];
};

export interface ModelSlotView {
  feature: FeatureSlot;
  label: string;
  provider: Pick<ModelProvider, 'id' | 'name' | 'type'>;
  modelId: string;
  modelDef?: ModelDefinition;
  temperature: number;
  maxTokens: number;
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  byFeature: Record<FeatureSlot, { inputTokens: number; outputTokens: number; costUsd: number }>;
  byProvider: Record<string, { inputTokens: number; outputTokens: number; costUsd: number }>;
  dailyBreakdown: Array<{ date: string; inputTokens: number; outputTokens: number; costUsd: number }>;
}
```

---

## 6. API Key Management

### 6.1 Encryption

API keys are encrypted before being stored and decrypted only on the server when constructing an SDK client. The encryption key is stored in an environment variable (`MODEL_ENCRYPTION_KEY`), a 256-bit random value.

```typescript
// src/server/models/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.MODEL_ENCRYPTION_KEY!, 'hex'); // 32-byte key

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv(12) + authTag(16) + ciphertext → hex
  return Buffer.concat([iv, authTag, encrypted]).toString('hex');
}

export function decrypt(ciphertext: string): string {
  const data = Buffer.from(ciphertext, 'hex');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### 6.2 Client-Side Key Policy

The API key field is **write-only from the client's perspective**:

```typescript
// tRPC procedure response — getProviders
// The apiKey field is NEVER included in query responses.
// The client only sees:
type ProviderClientView = {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string | null;
  isActive: boolean;
  testedAt: Date | null;
  models: ModelDefinition[];
  hasApiKey: boolean;  // true if key is set, that's all
  maskedKey: string | null; // "sk-ant-...XY5z" — first 7 + last 4 chars only
};
```

```typescript
// src/server/models/maskKey.ts
export function maskApiKey(plaintext: string): string {
  if (plaintext.length <= 11) return '***';
  return `${plaintext.slice(0, 7)}...${plaintext.slice(-4)}`;
}
```

### 6.3 Test API Key

The "Test" button on a provider card triggers a minimal probe call:

```typescript
// src/server/models/providerTester.ts

export async function testProvider(
  provider: ModelProvider,
  db: PrismaClient,
): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const model = await resolveModelForProvider(provider, provider.models[0]?.id ?? 'claude-haiku-4-5');
    await generateText({
      model,
      prompt: 'Respond with the single word: OK',
      maxTokens: 5,
    });
    const latencyMs = Date.now() - start;
    await db.modelProvider.update({
      where: { id: provider.id },
      data: { testedAt: new Date() },
    });
    return { ok: true, latencyMs };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - start, error: String(error) };
  }
}
```

---

## 7. Ollama Integration

### 7.1 Auto-Discovery

On page load, the Models module checks if Ollama is reachable:

```typescript
// src/server/models/ollama.ts
const OLLAMA_BASE_URL = process.env.OLLAMA_HOST ?? 'http://localhost:11434';

export async function checkOllamaHealth(): Promise<{
  available: boolean;
  version?: string;
}> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return { available: false };
    const { version } = await res.json() as { version: string };
    return { available: true, version };
  } catch {
    return { available: false };
  }
}

export async function listOllamaModels(): Promise<OllamaModelInfo[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
  const { models } = await res.json() as { models: OllamaModelInfo[] };
  return models;
}

interface OllamaModelInfo {
  name: string;
  size: number;       // bytes
  digest: string;
  details: {
    families?: string[];  // includes 'clip' if vision-capable
  };
}
```

### 7.2 Pull Model with Progress Streaming

```typescript
// tRPC subscription for model pull progress
pullOllamaModel: protectedProcedure
  .input(z.object({ modelName: z.string().min(1) }))
  .subscription(async function* ({ ctx, input }) {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
      method: 'POST',
      body: JSON.stringify({ name: input.modelName, stream: true }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        const event = JSON.parse(line) as OllamaPullEvent;
        yield {
          status: event.status,
          completed: event.completed,
          total: event.total,
          digest: event.digest,
          done: event.status === 'success',
        };
      }
    }

    // Sync to DB on completion
    await syncOllamaModelsToDB(ctx.session.user.id, ctx.db);
  }),

interface OllamaPullEvent {
  status: string;
  digest?: string;
  completed?: number;
  total?: number;
}
```

### 7.3 Vision Model Detection

A model is considered vision-capable if its `details.families` array from the Ollama API includes `'clip'` (the vision encoder used by multi-modal Ollama models like `llava`, `moondream`).

```typescript
function isVisionCapable(model: OllamaModelInfo): boolean {
  return model.details?.families?.includes('clip') ?? false;
}
```

### 7.4 Health Indicator

The Ollama provider card shows a health dot that is checked every 30 seconds:

```typescript
// src/components/models/OllamaHealthIndicator.tsx
export function OllamaHealthIndicator() {
  const { data: health } = useQuery({
    queryKey: ['ollama', 'health'],
    queryFn: () => trpc.models.checkOllamaHealth.query(),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        health?.available ? 'bg-green-500' : 'bg-red-500',
      )}
      title={health?.available ? `Ollama ${health.version}` : 'Ollama offline'}
    />
  );
}
```

---

## 8. Usage Dashboard

### 8.1 Pricing Constants

```typescript
// src/server/models/pricing.ts
// Updated quarterly. Prices in USD per 1,000 tokens.

export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'claude-opus-4-7':    { input: 0.015,  output: 0.075 },
  'claude-sonnet-4-6':  { input: 0.003,  output: 0.015 },
  'claude-haiku-4-5':   { input: 0.00025, output: 0.00125 },
  // OpenAI
  'gpt-4o':             { input: 0.005,  output: 0.015 },
  'gpt-4o-mini':        { input: 0.00015, output: 0.0006 },
  'o3-mini':            { input: 0.0011, output: 0.0044 },
  // Google
  'gemini-2.0-flash':   { input: 0.000075, output: 0.0003 },
  // Groq (Llama-based)
  'llama-3.3-70b-versatile': { input: 0.00059, output: 0.00079 },
  // Local Ollama — zero cost
  '__ollama__':         { input: 0, output: 0 },
};

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[modelId] ?? MODEL_PRICING['__ollama__']!;
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}
```

### 8.2 Usage Logging Middleware

Every LLM call is wrapped to log usage:

```typescript
// src/server/models/usageLogger.ts

export async function withUsageTracking<T>(
  params: {
    userId: string;
    providerId: string;
    modelId: string;
    feature: FeatureSlot;
    db: PrismaClient;
  },
  fn: () => Promise<{ result: T; usage: { inputTokens: number; outputTokens: number } }>,
): Promise<T> {
  const start = Date.now();
  const { result, usage } = await fn();
  const durationMs = Date.now() - start;

  const costUsd = calculateCost(params.modelId, usage.inputTokens, usage.outputTokens);

  await params.db.modelUsage.create({
    data: {
      userId: params.userId,
      providerId: params.providerId,
      modelId: params.modelId,
      feature: params.feature,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd,
      durationMs,
    },
  });

  // Check budget alerts asynchronously (non-blocking)
  void checkBudgetAlerts(params.userId, params.db);

  return result;
}
```

### 8.3 Budget Alert Logic

```typescript
// src/server/models/budgetAlerts.ts

interface BudgetAlert {
  limitUsd: number;
  notifyAt80: boolean;
  notifyAt100: boolean;
  channels: ('email' | 'push')[];
  // Stored in user preferences JSON
}

export async function checkBudgetAlerts(
  userId: string,
  db: PrismaClient,
): Promise<void> {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const result = await db.modelUsage.aggregate({
    where: { userId, timestamp: { gte: startOfMonth } },
    _sum: { costUsd: true },
  });

  const totalSpend = result._sum.costUsd ?? 0;
  const prefs = await getUserBudgetPrefs(userId, db);
  if (!prefs?.limitUsd) return;

  const pct = totalSpend / prefs.limitUsd;

  if (prefs.notifyAt80 && pct >= 0.8 && pct < 1.0) {
    await sendBudgetNotification(userId, 80, totalSpend, prefs.limitUsd, prefs.channels, db);
  }
  if (prefs.notifyAt100 && pct >= 1.0) {
    await sendBudgetNotification(userId, 100, totalSpend, prefs.limitUsd, prefs.channels, db);
  }
}
```

---

## 9. tRPC Procedures

```typescript
// src/server/routers/models.ts

export const modelsRouter = createTRPCRouter({

  // --- Providers ---

  getProviders: protectedProcedure
    .query(async ({ ctx }) => {
      const providers = await ctx.db.modelProvider.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { name: 'asc' },
      });
      // Strip encrypted API keys, return masked version
      return providers.map(toProviderClientView);
    }),

  addProvider: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(['anthropic', 'openai', 'groq', 'google', 'ollama', 'custom']),
      baseUrl: z.string().url().optional(),
      apiKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const encryptedKey = input.apiKey ? encrypt(input.apiKey) : null;
      const provider = await ctx.db.modelProvider.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          type: input.type,
          baseUrl: input.baseUrl,
          apiKey: encryptedKey,
        },
      });
      // Fetch available models and cache them
      const models = await fetchProviderModels(provider, ctx.db);
      await ctx.db.modelProvider.update({
        where: { id: provider.id },
        data: { models: models as any },
      });
      return toProviderClientView({ ...provider, models });
    }),

  updateProvider: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().url().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, apiKey, ...rest } = input;
      const encryptedKey = apiKey ? encrypt(apiKey) : undefined;
      return ctx.db.modelProvider.update({
        where: { id, userId: ctx.session.user.id },
        data: { ...rest, ...(encryptedKey ? { apiKey: encryptedKey } : {}) },
      });
    }),

  removeProvider: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Block if any ModelSlot references this provider
      const slots = await ctx.db.modelSlot.count({
        where: { providerId: input.id, userId: ctx.session.user.id },
      });
      if (slots > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `This provider is used by ${slots} model slot(s). Reassign them first.`,
        });
      }
      return ctx.db.modelProvider.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  testProvider: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const provider = await ctx.db.modelProvider.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      return testProvider(provider, ctx.db);
    }),

  listAvailableModels: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const provider = await ctx.db.modelProvider.findUniqueOrThrow({
        where: { id: input.providerId, userId: ctx.session.user.id },
      });
      // For Ollama: fetch live from local API
      // For others: return cached models from DB
      return provider.type === 'ollama'
        ? await fetchOllamaModels()
        : provider.models;
    }),

  // --- Model Slots ---

  getModelSlots: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const slots = await ctx.db.modelSlot.findMany({
        where: { userId },
        include: { provider: true },
      });
      // Return all features, using defaults for any not configured
      return Object.values(FeatureSlot).map((feature) => {
        const slot = slots.find((s) => s.feature === feature);
        return slot ?? getDefaultSlotView(feature);
      });
    }),

  updateModelSlot: protectedProcedure
    .input(z.object({
      feature: z.nativeEnum(FeatureSlot),
      providerId: z.string(),
      modelId: z.string(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(200_000).optional(),
      systemPrompt: z.string().max(10_000).optional(),
      customParams: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { feature, ...data } = input;
      return ctx.db.modelSlot.upsert({
        where: { userId_feature: { userId: ctx.session.user.id, feature } },
        create: { userId: ctx.session.user.id, feature, ...data },
        update: data,
      });
    }),

  // --- Ollama ---

  checkOllamaHealth: protectedProcedure
    .query(async () => checkOllamaHealth()),

  getOllamaModels: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.ollamaModel.findMany({
        where: { userId: ctx.session.user.id, isAvailable: true },
        orderBy: { pulledAt: 'desc' },
      });
    }),

  pullOllamaModel: protectedProcedure
    .input(z.object({ modelName: z.string().min(1) }))
    .subscription(async function* ({ ctx, input }) {
      // Yields PullProgress events (see section 7.2)
    }),

  deleteOllamaModel: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await fetch(`${OLLAMA_BASE_URL}/api/delete`, {
        method: 'DELETE',
        body: JSON.stringify({ name: input.name }),
      });
      await ctx.db.ollamaModel.update({
        where: { userId_name: { userId: ctx.session.user.id, name: input.name } },
        data: { isAvailable: false },
      });
    }),

  // --- Usage ---

  getUsage: protectedProcedure
    .input(z.object({
      from: z.date(),
      to: z.date(),
      groupBy: z.enum(['feature', 'provider', 'day']).default('feature'),
    }))
    .query(async ({ ctx, input }) => {
      return getUsageSummary(ctx.session.user.id, input.from, input.to, input.groupBy, ctx.db);
    }),

  // --- Budget Alerts ---

  getBudgetAlerts: protectedProcedure
    .query(async ({ ctx }) => getUserBudgetPrefs(ctx.session.user.id, ctx.db)),

  setBudgetAlert: protectedProcedure
    .input(z.object({
      limitUsd: z.number().positive(),
      notifyAt80: z.boolean().default(true),
      notifyAt100: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'push'])).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return setUserBudgetPrefs(ctx.session.user.id, input, ctx.db);
    }),
});
```

---

## 10. Model Picker Component

The `ModelPicker` is a reusable dropdown used in every model slot row and any other module that needs to select a model.

```typescript
// src/components/models/ModelPicker.tsx

interface ModelPickerProps {
  value: { providerId: string; modelId: string } | null;
  onChange: (value: { providerId: string; modelId: string }) => void;
  filterVision?: boolean;   // If true, show only vision-capable models
  filterLocal?: boolean;    // If true, show only local (Ollama) models
  disabled?: boolean;
  className?: string;
}

interface ModelOption {
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  modelId: string;
  modelName: string;
  contextLength: number;
  costTier: 'free' | 'low' | 'medium' | 'high';
  isVision: boolean;
  isLocal: boolean;
}
```

Visual design of each option in the dropdown list:

```
┌──────────────────────────────────────────────────────────────┐
│  [A]  Anthropic                                              │
│       claude-haiku-4-5                                       │
│       200k ctx  •  [low cost]                                │
├──────────────────────────────────────────────────────────────┤
│  [A]  Anthropic                                              │
│       claude-sonnet-4-6                                      │
│       200k ctx  •  [medium cost]                             │
├──────────────────────────────────────────────────────────────┤
│  [O]  Ollama (local)                                         │
│       llama3.2                                               │
│       4k ctx    •  [free]  •  [local]                        │
└──────────────────────────────────────────────────────────────┘
```

- Provider logo badge: rendered from a `ProviderIcon` component that selects the correct SVG based on `providerType`.
- Cost tier badge: color-coded pill (green = free/low, amber = medium, red = high).
- Vision badge: shown only if `isVision === true` (an eye icon).
- Local badge: shown for Ollama models.
- Context length: displayed in human-readable format (e.g., "200k ctx").

```typescript
const COST_TIER_THRESHOLDS: Record<string, 'free' | 'low' | 'medium' | 'high'> = {};

function getCostTier(model: ModelDefinition): 'free' | 'low' | 'medium' | 'high' {
  if (model.isLocal) return 'free';
  const outputCost = model.costPer1kOutput;
  if (outputCost === 0) return 'free';
  if (outputCost < 0.005) return 'low';
  if (outputCost < 0.02) return 'medium';
  return 'high';
}
```

The component is animated with Framer Motion: the dropdown opens with a subtle scale + fade-in animation from the trigger element.

---

## 11. Testing

### 11.1 Encryption Unit Tests

```typescript
// src/server/models/__tests__/encryption.test.ts
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../encryption';

describe('AES-256-GCM encryption', () => {
  it('encrypts and decrypts a string correctly', () => {
    const plaintext = 'sk-ant-api03-abc123XYZ';
    const ciphertext = encrypt(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const a = encrypt('same-secret');
    const b = encrypt('same-secret');
    expect(a).not.toBe(b); // Different IVs
    expect(decrypt(a)).toBe('same-secret');
    expect(decrypt(b)).toBe('same-secret');
  });

  it('throws on tampered ciphertext (GCM auth tag verification)', () => {
    const ciphertext = encrypt('secret');
    const tampered = ciphertext.slice(0, -4) + 'ffff';
    expect(() => decrypt(tampered)).toThrow();
  });

  it('masks API keys correctly', () => {
    expect(maskApiKey('sk-ant-api03-abcdefXYZ1234')).toMatch(/^sk-ant-\.\.\.1234$/);
    expect(maskApiKey('short')).toBe('***');
  });
});
```

### 11.2 Ollama Integration Mock Tests

```typescript
// src/server/models/__tests__/ollama.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkOllamaHealth, listOllamaModels } from '../ollama';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Ollama integration', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns available: true when Ollama responds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '0.6.0' }),
    });
    const result = await checkOllamaHealth();
    expect(result.available).toBe(true);
    expect(result.version).toBe('0.6.0');
  });

  it('returns available: false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await checkOllamaHealth();
    expect(result.available).toBe(false);
  });

  it('detects vision-capable models by clip family', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        models: [
          { name: 'llava', size: 4_700_000_000, digest: 'abc', details: { families: ['llama', 'clip'] } },
          { name: 'llama3.2', size: 3_800_000_000, digest: 'def', details: { families: ['llama'] } },
        ],
      }),
    });
    const models = await listOllamaModels();
    expect(isVisionCapable(models[0]!)).toBe(true);
    expect(isVisionCapable(models[1]!)).toBe(false);
  });
});
```

### 11.3 Usage Calculation Tests

```typescript
// src/server/models/__tests__/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calculateCost } from '../pricing';

describe('calculateCost', () => {
  it('calculates Anthropic Haiku cost correctly', () => {
    // 1000 input + 500 output tokens at haiku pricing
    const cost = calculateCost('claude-haiku-4-5', 1000, 500);
    // input: (1000/1000) * 0.00025 = 0.00025
    // output: (500/1000) * 0.00125 = 0.000625
    expect(cost).toBeCloseTo(0.000875, 8);
  });

  it('returns zero cost for Ollama (local) models', () => {
    const cost = calculateCost('llama3.2', 50_000, 10_000);
    expect(cost).toBe(0);
  });

  it('handles unknown model IDs by defaulting to zero', () => {
    const cost = calculateCost('unknown-model-xyz', 1000, 1000);
    expect(cost).toBe(0);
  });
});
```

### 11.4 Model Resolution Tests

```typescript
// src/server/models/__tests__/modelResolver.test.ts
import { describe, it, expect, vi } from 'vitest';
import { resolveModel } from '../modelResolver';
import { createMockDb } from '../../__tests__/mockDb';

describe('resolveModel', () => {
  it('resolves an Anthropic model slot', async () => {
    const db = createMockDb({
      modelSlot: [{
        userId: 'user-1', feature: 'AGENT',
        modelId: 'claude-opus-4-7', provider: { type: 'anthropic', apiKey: encrypt('sk-ant-xxx') },
      }],
    });
    const model = await resolveModel('AGENT', 'user-1', db);
    expect(model).toBeDefined();
  });

  it('falls back to global fallback when slot is unconfigured', async () => {
    const db = createMockDb({
      modelSlot: [{
        userId: 'user-1', feature: 'GLOBAL_FALLBACK',
        modelId: 'claude-haiku-4-5', provider: { type: 'anthropic', apiKey: encrypt('sk-ant-xxx') },
      }],
    });
    // No CALENDAR_AI slot configured
    const model = await resolveModel('CALENDAR_AI', 'user-1', db);
    expect(model).toBeDefined(); // Should use global fallback
  });
});
```

---

## Appendix: Provider Type Icons

```typescript
// src/components/models/ProviderIcon.tsx

const PROVIDER_ICONS: Record<ProviderType, string> = {
  anthropic: '/icons/providers/anthropic.svg',
  openai:    '/icons/providers/openai.svg',
  groq:      '/icons/providers/groq.svg',
  google:    '/icons/providers/google.svg',
  ollama:    '/icons/providers/ollama.svg',
  custom:    '/icons/providers/custom.svg',
};
```

## Appendix: Zustand Store

```typescript
// src/stores/modelsStore.ts

interface ModelsStore {
  providers: ProviderClientView[];
  modelSlots: ModelSlotView[];
  ollamaHealth: { available: boolean; version?: string } | null;
  ollamaModels: OllamaModel[];
  pullProgress: { modelName: string; completed: number; total: number } | null;

  selectedFeature: FeatureSlot | null;
  setSelectedFeature: (feature: FeatureSlot | null) => void;

  // Optimistic slot updates
  updateSlotOptimistic: (feature: FeatureSlot, update: Partial<ModelSlotView>) => void;
  revertSlotUpdate: (feature: FeatureSlot) => void;
}
```
