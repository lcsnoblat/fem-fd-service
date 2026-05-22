# SPEC_AGENT.md — Agent Module

**Platform:** Mission Control  
**Module:** Agent — Agentic AI Coding Assistant  
**Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, tRPC, Prisma, Zustand, TanStack Query, Framer Motion, Monaco Editor, xterm.js, Vercel AI SDK, @modelcontextprotocol/sdk  
**Last updated:** 2026-05-22

---

## 1. Overview

The Agent module is a full IDE-like environment where an AI assistant operates autonomously to accomplish complex, multi-step engineering tasks. It is not a simple chat interface — it is an agentic workspace where the model can read and write files, execute terminal commands, search code, call web APIs, and interact with any connected MCP (Model Context Protocol) server.

The user describes a goal in natural language (e.g., "Fix the bug in the auth middleware and write a test for it"). The agent decomposes the goal, selects appropriate tools, executes them iteratively, observes results, and continues until the task is complete or it reaches the configured iteration limit.

Key distinguishing characteristics:

- **Autonomous execution**: The agent drives the loop; the user observes and can intervene.
- **Full tool suite**: File I/O, terminal commands, code search, web search, and unlimited MCP tools.
- **Transparent trace**: Every tool call and its result are visible in real time in the right panel.
- **MCP-native**: Any stdio or SSE MCP server can be connected and its tools exposed to the agent.
- **Safe mode**: Destructive or side-effecting operations require explicit user approval before execution.
- **Monaco-first**: The code editor is the primary artifact surface — the agent edits files directly and the user sees a live diff.

---

## 2. User Stories

### US-01: Autonomous Bug Fix
> As a developer, I want to describe a bug in natural language so that the agent can locate the relevant code, identify the root cause, apply a fix, and confirm the fix by running the existing test suite — all without me manually navigating files.

**Acceptance criteria:**
- Agent searches codebase for relevant files using `searchCode` tool.
- Agent reads the file(s), edits the fix via `writeFile`, and runs tests via `runCommand`.
- Test output is shown in the terminal tab.
- A diff of the changed files is shown in the Monaco diff view.
- If tests pass, the session status transitions to `complete`.

### US-02: Codebase Exploration
> As a developer onboarding to a new project, I want to ask the agent questions about the codebase so that I can understand its architecture without reading every file manually.

**Acceptance criteria:**
- Agent uses `searchCode` and `readFile` to gather context.
- The agent answers in the chat panel with inline code references.
- Referenced files are linked — clicking opens them in the Monaco editor.
- The session's context window shows which files were read.

### US-03: Write and Run Tests
> As a developer, I want to instruct the agent to write unit tests for a given function or module and then immediately run them to confirm they pass.

**Acceptance criteria:**
- Agent reads the target module, generates test file content, writes it via `writeFile`.
- Agent runs `runCommand("npm test -- path/to/test")` and streams the output to the terminal.
- Pass/fail result is displayed in the agent message log.
- New test file appears in the file tree on the left panel.

### US-04: Connect GitHub MCP Server
> As a developer, I want to connect the GitHub MCP server so that the agent can create pull requests, comment on issues, and list repositories on my behalf.

**Acceptance criteria:**
- User adds GitHub MCP server with their token via the "Add MCP Server" dialog.
- Server connects successfully and its tools (e.g., `create_pull_request`, `list_issues`) appear in the MCP tools panel.
- Agent can reference and call these tools in subsequent sessions.
- Tool calls to GitHub show as entries in the tool call trace with request/response payloads.

### US-05: File Management
> As a developer, I want the agent to reorganize my project structure (e.g., move files, rename modules, update imports) based on a high-level instruction.

**Acceptance criteria:**
- Agent uses `readFile`, `writeFile`, `runCommand` (for `mv`/`cp`), and `searchCode` to perform the reorganization.
- Each file change is shown as a diff in the diff viewer before being committed if safe mode is on.
- The file tree on the left panel refreshes after changes are applied.

### US-06: Pausing and Resuming Sessions
> As a developer, I want to pause an active agent session, close my browser, and resume it later from exactly where it left off.

**Acceptance criteria:**
- Session state (messages, tool call history, context, iteration count) is persisted in the database.
- The session list shows status: `idle`, `running`, `paused`, `error`, `complete`.
- Resuming a paused session reloads all state into the UI and allows the user to continue.

### US-07: Configuring Tool Approval Mode
> As a security-conscious user, I want all tool calls that write to disk or execute shell commands to require my explicit approval before they run.

**Acceptance criteria:**
- Safe mode is toggled per-session in the toolbar.
- When safe mode is on, `writeFile` and `runCommand` tool calls pause the loop and show a confirmation card.
- User can approve, reject, or edit the proposed arguments before execution.
- Rejection causes the agent to receive a `tool_rejected` result and adjust its plan.

### US-08: Memory Across Sessions
> As a developer, I want the agent to remember persistent facts I tell it (e.g., "our test command is `pnpm test:unit`") so that I don't have to repeat them in every session.

**Acceptance criteria:**
- User can write to agent memory: `agent.remember("test command is pnpm test:unit")`.
- Memory entries are listed in the Memory viewer tab in the right panel.
- New sessions automatically receive relevant memory entries in the system prompt.
- Memory entries can be deleted individually.

---

## 3. UI Layout

### 3.1 Full Layout — ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                                                                │
│  [▶ Run] [⏹ Stop] [⏸ Pause]  Session: "Fix auth bug"  ▼   Model: claude-opus-4-7  ▼   [Safe Mode: ON] │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────────────────────┬───────────────────────────────┐
│  LEFT PANEL      │  CENTER — MONACO EDITOR                              │  RIGHT PANEL                  │
│  ──────────────  │                                                      │  ─────────────────────────    │
│  FILE TREE       │  ┌─────────────────────────────────────────────────┐ │  [Chat] [Trace] [Memory]      │
│                  │  │ Tab: src/auth/middleware.ts ● | src/auth/test.ts│ │                               │
│  ▼ src/          │  │─────────────────────────────────────────────────│ │  ┌─────────────────────────┐  │
│    ▼ auth/       │  │   1 │ import { NextRequest } from 'next/server' │ │  │ AI CHAT                 │  │
│      middleware  │  │   2 │                                           │ │  │                         │  │
│      test.ts     │  │   3 │ export async function authMiddleware(     │ │  │ User: Fix the bug in    │  │
│    ▼ api/        │  │   4 │   req: NextRequest                        │ │  │ the auth middleware.    │  │
│      route.ts    │  │   5 │ ) {                                       │ │  │                         │  │
│    ▼ lib/        │  │   6 │   const token = req.headers.get('auth')   │ │  │ Agent: I'll start by    │  │
│      db.ts       │  │   7 │   // Bug: missing null check              │ │  │ reading the middleware  │  │
│    package.json  │  │   8 │   const decoded = jwt.verify(token, ...)  │ │  │ file...                 │  │
│                  │  │   9 │ }                                         │ │  │                         │  │
│  ──────────────  │  │  10 │                                           │ │  │ [DIFF MODE] ──────────  │  │
│  MCP SERVERS     │  └─────────────────────────────────────────────────┘ │  │ Proposed change ready.  │  │
│                  │                                                      │  │ [Accept] [Reject] [Edit] │  │
│  ● Filesystem    │  ┌──────────────────────────────────────────────────┐ │  └─────────────────────────┘  │
│    6 tools       │  │ DIFF VIEW (when agent proposes a change)         │ │                               │
│  ● GitHub        │  │ - const decoded = jwt.verify(token, ...)         │ │  ┌─────────────────────────┐  │
│    12 tools      │  │ + if (!token) return new Response('Unauth', {   │ │  │ TOOL CALL TRACE         │  │
│  ○ Fetch         │  │ +   status: 401                                  │ │  │                         │  │
│    3 tools       │  │ + })                                             │ │  │ ① readFile              │  │
│                  │  │ + const decoded = jwt.verify(token, ...)         │ │  │   src/auth/middleware   │  │
│  [+ Add Server]  │  └──────────────────────────────────────────────────┘ │  │   ✓ 45 lines returned   │  │
│                  │                                                      │  │                               │
│                  │  ┌──────────────────────────────────────────────────┐ │  │ ② searchCode            │  │
│                  │  │ BOTTOM TABS: [Terminal] [Agent Log]              │ │  │   "jwt.verify"          │  │
│                  │  │──────────────────────────────────────────────────│ │  │   ✓ 3 matches           │  │
│                  │  │ $ npm test                                       │ │  │                               │
│                  │  │ > Running test suite...                          │ │  │ ③ writeFile ⏳          │  │
│                  │  │ ✓ auth middleware returns 401 for missing token  │ │  │   Waiting approval...   │  │
│                  │  │ ✓ auth middleware decodes valid JWT              │ │  │                         │  │
│                  │  │ Tests: 2 passed                                  │ │  └─────────────────────────┘  │
│                  │  │                                                  │ │                               │
│                  │  └──────────────────────────────────────────────────┘ │  ┌─────────────────────────┐  │
│                  │                                                      │  │ MEMORY VIEWER           │  │
│                  │                                                      │  │                         │  │
│                  │                                                      │  │ test cmd: pnpm test:unit│  │
│                  │                                                      │  │ db: PostgreSQL, port 5432│  │
│                  │                                                      │  │ [+ Add] [Clear all]     │  │
└──────────────────┴──────────────────────────────────────────────────────┴───────────────────────────────┘
```

### 3.2 Panel Descriptions

**Toolbar (top bar):**
- Run / Stop / Pause buttons: control the agentic loop.
- Session name: editable inline; shown in session list.
- Model selector: dropdown of all configured model slots for the Agent feature.
- Safe mode toggle: when on, destructive tools require approval.
- Iteration counter: `Step 4 / 20` shown when running.

**Left Panel:**
- File Tree: read from the active project's root path. Supports expand/collapse. Clicking a file opens it in Monaco.
- MCP Servers: list of connected servers with colored dot (green = connected, grey = disconnected). Each expands to show available tools. Per-tool enable toggle.
- "Add Server" button opens the MCP Server configuration dialog.

**Center Panel — Monaco Editor:**
- Multi-tab editor (open files).
- Unsaved changes indicator (`●` on tab).
- In diff mode: two-pane diff view showing current vs. proposed.
- Read-only overlay with a pulsing border when the agent is actively writing to the current file.
- Bottom tabs switch between terminal and agent message log.

**Right Panel (tabbed):**
- **Chat tab**: conversational interface; user input at bottom; agent messages stream token by token.
- **Trace tab**: ordered list of all tool calls in the current session, showing tool name, arguments summary, status (pending / success / error), and expandable payload.
- **Memory tab**: list of persisted memory key/value entries; add new and delete existing.

---

## 4. Architecture — Agentic Loop

### 4.1 High-Level Flow

```
User Message
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  AgentLoop.run()                                            │
│                                                             │
│  1. Build system prompt                                     │
│     - Static agent instructions                             │
│     - Active memory entries                                 │
│     - Project context (open files, repo info)               │
│     - MCP tool schemas (enabled tools only)                 │
│     - Built-in tool schemas                                 │
│                                                             │
│  2. Build message history                                   │
│     - Sliding window of last N messages                     │
│     - Older messages → summarized block                     │
│                                                             │
│  3. Call LLM (Vercel AI SDK streamText)                     │
│     - Stream tokens → emit to client via WebSocket          │
│     - Detect tool_call in stream                            │
│                                                             │
│  4. For each tool_call:                                     │
│     a. Emit tool_call event to client (renders in trace)    │
│     b. If safe mode ON + tool is destructive → PAUSE        │
│        → Await user approval (WebSocket message)            │
│        → If rejected → inject tool_rejected result          │
│     c. Execute tool (built-in or MCP dispatch)              │
│     d. Emit tool_result event to client                     │
│     e. Append tool_call + tool_result to message history    │
│                                                             │
│  5. Check iteration count                                   │
│     - If iterations >= maxIterations → emit limit_reached   │
│       → Set session status to 'paused'                      │
│       → User can resume or stop                             │
│                                                             │
│  6. If LLM returns text-only (no tool calls):               │
│     - Final answer: emit 'done' event                       │
│     - Set session status to 'complete'                      │
│                                                             │
│  7. Else: goto step 2 (next iteration)                      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Type Definitions

```typescript
// src/server/agent/types.ts

export type SessionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'error'
  | 'complete';

export type ToolCallStatus =
  | 'pending'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'success'
  | 'error';

export interface AgentToolCall {
  id: string;
  tool: string;
  serverId: string | 'builtin';
  args: Record<string, unknown>;
  status: ToolCallStatus;
  result?: unknown;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool_result';
  content: string;
  toolCalls?: AgentToolCall[];
  createdAt: Date;
}

export interface AgentLoopOptions {
  sessionId: string;
  maxIterations: number; // default: 20
  safeMode: boolean;
  approvalCallback?: (toolCall: AgentToolCall) => Promise<boolean>;
}

export interface AgentLoopResult {
  finalAnswer: string;
  iterations: number;
  toolCallsExecuted: number;
  status: SessionStatus;
}
```

### 4.3 Built-in Tools

All built-in tools are defined using the Vercel AI SDK `tool()` helper and implement the `Tool` interface from `ai`.

#### `readFile`
```typescript
// src/server/agent/tools/readFile.ts
import { tool } from 'ai';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

export const readFileTool = tool({
  description: 'Read the contents of a file at the given path.',
  parameters: z.object({
    filePath: z.string().describe('Absolute or project-relative file path'),
    startLine: z.number().optional().describe('Start reading from this line (1-indexed)'),
    endLine: z.number().optional().describe('Stop reading at this line (inclusive)'),
  }),
  execute: async ({ filePath, startLine, endLine }, { projectRoot }) => {
    const resolved = resolveAndValidatePath(filePath, projectRoot);
    const content = await fs.readFile(resolved, 'utf-8');
    const lines = content.split('\n');
    const slice = lines.slice(
      (startLine ?? 1) - 1,
      endLine ?? lines.length,
    );
    return {
      content: slice.join('\n'),
      totalLines: lines.length,
      path: resolved,
    };
  },
});
```

#### `writeFile`
```typescript
// src/server/agent/tools/writeFile.ts
export const writeFileTool = tool({
  description: 'Write or overwrite a file with given content. Destructive.',
  parameters: z.object({
    filePath: z.string(),
    content: z.string(),
    createDirs: z.boolean().default(true),
  }),
  // Marked as destructive — requires approval in safe mode
  metadata: { destructive: true },
  execute: async ({ filePath, content, createDirs }, { projectRoot }) => {
    const resolved = resolveAndValidatePath(filePath, projectRoot);
    if (createDirs) {
      await fs.mkdir(path.dirname(resolved), { recursive: true });
    }
    await fs.writeFile(resolved, content, 'utf-8');
    return { written: true, path: resolved, bytes: Buffer.byteLength(content) };
  },
});
```

#### `runCommand`
```typescript
// src/server/agent/tools/runCommand.ts
export const runCommandTool = tool({
  description: 'Run a shell command in the project directory. Destructive.',
  parameters: z.object({
    command: z.string().describe('Shell command to run'),
    cwd: z.string().optional().describe('Working directory (relative to project root)'),
    timeoutMs: z.number().default(30_000),
  }),
  metadata: { destructive: true },
  execute: async ({ command, cwd, timeoutMs }, { projectRoot, ptyManager }) => {
    const workingDir = cwd ? path.join(projectRoot, cwd) : projectRoot;
    const output = await ptyManager.runCommand(command, workingDir, timeoutMs);
    return { stdout: output.stdout, stderr: output.stderr, exitCode: output.exitCode };
  },
});
```

#### `searchCode`
```typescript
// src/server/agent/tools/searchCode.ts
export const searchCodeTool = tool({
  description: 'Search for a pattern across all files in the project.',
  parameters: z.object({
    pattern: z.string().describe('Grep-compatible regex pattern'),
    fileGlob: z.string().default('**/*').describe('File glob to restrict search'),
    maxResults: z.number().default(20),
  }),
  execute: async ({ pattern, fileGlob, maxResults }, { projectRoot }) => {
    // Uses ripgrep (rg) under the hood for performance
    const results = await runRipgrep(pattern, fileGlob, projectRoot, maxResults);
    return results; // Array<{ file, line, match, context }>
  },
});
```

#### `webSearch`
```typescript
// src/server/agent/tools/webSearch.ts
export const webSearchTool = tool({
  description: 'Search the web for information.',
  parameters: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),
  execute: async ({ query, maxResults }) => {
    // Calls Brave Search API or configured search provider
    return await searchProvider.search(query, maxResults);
  },
});
```

### 4.4 Tool Execution Dispatch

```typescript
// src/server/agent/toolDispatcher.ts

export class ToolDispatcher {
  constructor(
    private readonly builtinTools: Map<string, Tool>,
    private readonly mcpClients: Map<string, MCPClient>,
  ) {}

  async execute(
    toolCall: AgentToolCall,
    context: ToolExecutionContext,
  ): Promise<unknown> {
    if (toolCall.serverId === 'builtin') {
      const tool = this.builtinTools.get(toolCall.tool);
      if (!tool) throw new Error(`Unknown builtin tool: ${toolCall.tool}`);
      return await tool.execute(toolCall.args, context);
    }

    const client = this.mcpClients.get(toolCall.serverId);
    if (!client) throw new Error(`MCP server not connected: ${toolCall.serverId}`);
    return await client.callTool(toolCall.tool, toolCall.args);
  }
}
```

### 4.5 Streaming Architecture

The agentic loop runs on the server. The client receives events over a WebSocket connection managed by the tRPC `sendMessage` subscription.

```typescript
// Event stream types

export type AgentStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'tool_call'; toolCall: AgentToolCall }
  | { type: 'tool_result'; toolCallId: string; result: unknown; status: 'success' | 'error' }
  | { type: 'approval_required'; toolCall: AgentToolCall }
  | { type: 'done'; finalAnswer: string; iterations: number }
  | { type: 'error'; message: string; code: string }
  | { type: 'limit_reached'; iterations: number; sessionStatus: 'paused' };
```

---

## 5. Data Model

### 5.1 Prisma Schema

```prisma
// prisma/schema.prisma (Agent-related models)

enum SessionStatus {
  idle
  running
  paused
  error
  complete
}

enum MCPTransport {
  stdio
  sse
}

enum MemorySource {
  session
  user
}

model AgentSession {
  id            String        @id @default(cuid())
  userId        String
  name          String        @default("Untitled Session")
  status        SessionStatus @default(idle)
  modelConfigId String?
  /// Array of AgentMessage objects (role, content, toolCalls, createdAt)
  messages      Json[]        @default([])
  /// Array of AgentToolCall objects (flattened for fast querying)
  toolCalls     Json[]        @default([])
  /// Project root, open files, iteration count, window summary
  context       Json          @default("{}")
  iteration     Int           @default(0)
  maxIterations Int           @default(20)
  safeMode      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  modelConfig   ModelSlot?    @relation(fields: [modelConfigId], references: [id])
  project       AgentProject? @relation(fields: [projectId], references: [id])
  projectId     String?

  @@index([userId, status])
  @@index([userId, createdAt(sort: Desc)])
}

model MCPServer {
  id             String       @id @default(cuid())
  userId         String
  name           String
  type           MCPTransport
  /// For stdio transport: the executable command
  command        String?
  /// For stdio transport: command arguments
  args           String[]     @default([])
  /// For SSE transport: the server URL
  url            String?
  /// Environment variables (stored encrypted)
  env            Json?
  isActive       Boolean      @default(true)
  lastConnected  DateTime?
  /// Cached list of tools from the last successful connection
  availableTools Json[]       @default([])
  /// Per-tool enable state: { [toolName]: boolean }
  toolEnabled    Json         @default("{}")
  /// 'auto' | 'ask' — whether tool calls auto-execute or need user approval
  approvalMode   String       @default("ask")
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
  @@index([userId, isActive])
}

model AgentMemory {
  id        String       @id @default(cuid())
  userId    String
  key       String
  value     Json
  source    MemorySource @default(user)
  expiresAt DateTime?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
  @@index([userId, source])
}

model AgentProject {
  id              String         @id @default(cuid())
  userId          String
  name            String
  rootPath        String
  repoUrl         String?
  activeSessionId String?
  /// { defaultBranch, ignorePaths, testCommand, buildCommand }
  config          Json           @default("{}")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions        AgentSession[]

  @@unique([userId, rootPath])
  @@index([userId])
}
```

### 5.2 TypeScript Types (derived from Prisma)

```typescript
import type { AgentSession, MCPServer, AgentMemory, AgentProject } from '@prisma/client';

// Narrowed types for runtime use
export type AgentSessionWithMessages = AgentSession & {
  messages: AgentMessage[];
  toolCalls: AgentToolCall[];
  context: AgentSessionContext;
};

export interface AgentSessionContext {
  openFiles: string[];
  windowSummary?: string;
  projectRoot?: string;
  repoInfo?: { branch: string; remote: string };
}

export type MCPServerWithTools = MCPServer & {
  availableTools: MCPToolDefinition[];
  toolEnabled: Record<string, boolean>;
};

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema
}
```

---

## 6. MCP Integration

### 6.1 Architecture

The MCP integration uses the official `@modelcontextprotocol/sdk` package. Each connected server runs as a managed client process on the server side. Client lifecycle is managed by `MCPClientManager`.

```typescript
// src/server/mcp/MCPClientManager.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();

  async connect(server: MCPServer): Promise<MCPToolDefinition[]> {
    const transport =
      server.type === 'stdio'
        ? new StdioClientTransport({
            command: server.command!,
            args: server.args,
            env: server.env as Record<string, string> | undefined,
          })
        : new SSEClientTransport(new URL(server.url!));

    const client = new Client(
      { name: 'mission-control-agent', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    await client.connect(transport);

    const { tools } = await client.listTools();
    this.clients.set(server.id, client);

    return tools.map((t) => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema,
    }));
  }

  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const client = this.clients.get(serverId);
    if (!client) throw new Error(`MCP server ${serverId} not connected`);
    const result = await client.callTool({ name: toolName, arguments: args });
    return result.content;
  }

  async disconnect(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    await client?.close();
    this.clients.delete(serverId);
  }

  isConnected(serverId: string): boolean {
    return this.clients.has(serverId);
  }
}
```

### 6.2 Pre-configured MCP Servers

The following servers are available as one-click additions (user must supply any required tokens):

| Name | Transport | Command / URL | Required Config |
|---|---|---|---|
| Filesystem | stdio | `npx @modelcontextprotocol/server-filesystem <path>` | Root path |
| GitHub | stdio | `npx @modelcontextprotocol/server-github` | `GITHUB_TOKEN` env var |
| Fetch | stdio | `npx @modelcontextprotocol/server-fetch` | None |
| Brave Search | stdio | `npx @modelcontextprotocol/server-brave-search` | `BRAVE_API_KEY` env var |
| PostgreSQL | stdio | `npx @modelcontextprotocol/server-postgres <connection-string>` | DB connection string |

### 6.3 Add MCP Server Dialog

```typescript
// src/components/agent/AddMCPServerDialog.tsx

interface AddMCPServerFormValues {
  name: string;
  type: 'stdio' | 'sse';
  // For stdio
  command?: string;
  args?: string; // space-separated, parsed client-side
  env?: Array<{ key: string; value: string }>;
  // For SSE
  url?: string;
}
```

Dialog has three sections:
1. **Quick Add**: Preset cards for the 5 pre-configured servers above.
2. **Manual stdio**: Command, args, env vars input table.
3. **SSE URL**: Single URL input field.

After submission, the backend attempts to connect and returns the tool list. On failure, shows the error with diagnostic suggestions.

### 6.4 Tool Enable/Disable and Approval Mode

Each MCP server in the left panel expands to show its tools. Each tool has:
- A checkbox to enable/disable it (disabled tools are excluded from the LLM's tool schema).
- A shield icon indicating whether it follows the server's approval mode or has been individually overridden.

Server-level approval mode:
```typescript
type ApprovalMode = 'auto' | 'ask';
```

When `ask`, every tool call from that server triggers an approval card in the UI before execution.

---

## 7. tRPC Procedures

All procedures are defined in `src/server/routers/agent.ts` and protected by `protectedProcedure` (requires auth session).

```typescript
// src/server/routers/agent.ts

export const agentRouter = createTRPCRouter({
  // --- Sessions ---

  getSessions: protectedProcedure
    .input(z.object({ projectId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.agentSession.findMany({
        where: { userId: ctx.session.user.id, projectId: input.projectId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, status: true, iteration: true,
                  createdAt: true, updatedAt: true },
      });
    }),

  createSession: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      projectId: z.string().optional(),
      modelConfigId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.agentSession.create({
        data: { userId: ctx.session.user.id, ...input },
      });
    }),

  updateSession: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      status: z.enum(['idle', 'paused']).optional(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  deleteSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // --- Agentic Loop ---

  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      message: z.string().min(1).max(10_000),
    }))
    .subscription(async function* ({ ctx, input }) {
      // Yields AgentStreamEvent objects
      const loop = new AgentLoop(ctx.services);
      yield* loop.run(input.sessionId, input.message);
    }),

  approveToolCall: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      toolCallId: z.string(),
      approved: z.boolean(),
      modifiedArgs: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Signals the pending approval gate in the agentic loop
      ctx.services.approvalGate.resolve(input.toolCallId, {
        approved: input.approved,
        args: input.modifiedArgs,
      });
    }),

  cancelSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ctx.services.agentLoop.cancel(input.sessionId);
      await ctx.db.agentSession.update({
        where: { id: input.sessionId },
        data: { status: 'paused' },
      });
    }),

  // --- MCP Servers ---

  getMCPServers: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.mCPServer.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { name: 'asc' },
      });
    }),

  addMCPServer: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      type: z.enum(['stdio', 'sse']),
      command: z.string().optional(),
      args: z.array(z.string()).optional(),
      url: z.string().url().optional(),
      env: z.record(z.string()).optional(),
      approvalMode: z.enum(['auto', 'ask']).default('ask'),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Encrypt env values
      // 2. Create DB record
      // 3. Attempt connection to get tool list
      // 4. Update availableTools on DB record
      // 5. Return created server
    }),

  removeMCPServer: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => { /* disconnect + delete */ }),

  toggleMCPServer: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => { /* toggle + connect/disconnect */ }),

  getMCPTools: protectedProcedure
    .input(z.object({ serverId: z.string() }))
    .query(async ({ ctx, input }) => { /* return availableTools from DB */ }),

  updateMCPToolEnabled: protectedProcedure
    .input(z.object({
      serverId: z.string(),
      toolName: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => { /* update toolEnabled JSON field */ }),

  callMCPTool: protectedProcedure
    .input(z.object({
      serverId: z.string(),
      tool: z.string(),
      args: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.mcpManager.callTool(input.serverId, input.tool, input.args);
    }),

  // --- Memory ---

  getMemory: protectedProcedure
    .input(z.object({ source: z.enum(['session', 'user']).optional() }))
    .query(async ({ ctx, input }) => { /* query AgentMemory */ }),

  setMemory: protectedProcedure
    .input(z.object({
      key: z.string().min(1).max(255),
      value: z.unknown(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => { /* upsert AgentMemory */ }),

  deleteMemory: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => { /* delete */ }),

  // --- Projects ---

  getProjects: protectedProcedure
    .query(async ({ ctx }) => { /* list AgentProject */ }),

  createProject: protectedProcedure
    .input(z.object({
      name: z.string(),
      rootPath: z.string(),
      repoUrl: z.string().url().optional(),
      config: z.object({
        testCommand: z.string().optional(),
        buildCommand: z.string().optional(),
        ignorePaths: z.array(z.string()).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => { /* create AgentProject */ }),

  setActiveProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Store in user preferences / session
    }),
});
```

---

## 8. Monaco Editor Features

### 8.1 Configuration

```typescript
// src/components/agent/AgentEditor.tsx
import Editor, { DiffEditor, useMonaco } from '@monaco-editor/react';

const EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-light',
  fontSize: 14,
  fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
  fontLigatures: true,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  tabSize: 2,
  automaticLayout: true,
  bracketPairColorization: { enabled: true },
  inlayHints: { enabled: 'on' },
  // Disabled when agent is writing:
  readOnly: false,
};
```

### 8.2 Language Detection

```typescript
function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescriptreact',
    '.js': 'javascript', '.jsx': 'javascriptreact',
    '.py': 'python', '.rs': 'rust', '.go': 'go',
    '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
    '.md': 'markdown', '.css': 'css', '.html': 'html',
    '.sql': 'sql', '.sh': 'shell', '.prisma': 'prisma',
  };
  return map[ext] ?? 'plaintext';
}
```

### 8.3 TypeScript IntelliSense

When the active project has a `tsconfig.json`, the editor loads TypeScript type definitions automatically:

```typescript
// src/components/agent/useTypeScriptWorker.ts
export function useTypeScriptWorker(projectRoot: string) {
  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco) return;
    // Load project's node_modules/@types/** definitions
    // Requires server endpoint: GET /api/agent/types?project=<id>
    // Returns { path: string, content: string }[]
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      strict: true,
    });
  }, [monaco, projectRoot]);
}
```

### 8.4 Diff View

When the agent proposes a file change, the editor switches to diff mode:

```typescript
interface DiffViewProps {
  original: string;
  modified: string;
  language: string;
  onAccept: () => void;
  onReject: () => void;
}

// The DiffEditor from @monaco-editor/react renders a two-pane view.
// Accept: applies modified content to the file and exits diff mode.
// Reject: discards the proposed change; agent receives tool_rejected.
```

### 8.5 Read-only Mode During Agent Writes

```typescript
// When a writeFile tool call is in progress for the currently open file:
const isAgentWriting = useAgentStore((s) =>
  s.pendingToolCalls.some(
    (tc) => tc.tool === 'writeFile' && tc.args.filePath === currentFile,
  ),
);

// The Monaco editor gets readOnly: true and a pulsing amber border overlay.
// A "Agent is writing..." banner appears above the editor.
```

---

## 9. Terminal (xterm.js)

### 9.1 Architecture

The terminal uses `xterm.js` on the client, connected to a server-side pseudo-terminal (pty) managed by `node-pty`. The WebSocket channel is separate from the agent stream to avoid contention.

```
Client (xterm.js)  ←──── WebSocket (/api/agent/pty?sessionId=...) ──────► Server (node-pty)
```

```typescript
// src/server/agent/PtyManager.ts
import * as pty from 'node-pty';

export class PtyManager {
  private ptys: Map<string, pty.IPty> = new Map();

  spawn(sessionId: string, shell: string, cwd: string): pty.IPty {
    const p = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
    });
    this.ptys.set(sessionId, p);
    return p;
  }

  async runCommand(
    command: string,
    cwd: string,
    timeoutMs: number,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    // Spawns a child_process.exec (not interactive pty) and captures output
    return execWithTimeout(command, cwd, timeoutMs);
  }

  write(sessionId: string, data: string): void {
    this.ptys.get(sessionId)?.write(data);
  }

  resize(sessionId: string, cols: number, rows: number): void {
    this.ptys.get(sessionId)?.resize(cols, rows);
  }

  kill(sessionId: string): void {
    this.ptys.get(sessionId)?.kill();
    this.ptys.delete(sessionId);
  }
}
```

### 9.2 Client Integration

```typescript
// src/components/agent/AgentTerminal.tsx
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';

export function AgentTerminal({ sessionId }: { sessionId: string }) {
  const termRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);

  useEffect(() => {
    const term = new Terminal({
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
      fontFamily: '"Fira Code", monospace',
      fontSize: 13,
      cursorBlink: true,
      scrollback: 5000,  // 5000-line scrollback buffer
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    term.open(termRef.current!);
    fitAddon.fit();

    const ws = new WebSocket(`/api/agent/pty?sessionId=${sessionId}`);
    ws.onmessage = (e) => term.write(e.data);
    term.onData((data) => ws.send(data));

    terminalRef.current = term;
    return () => { term.dispose(); ws.close(); };
  }, [sessionId]);

  return <div ref={termRef} className="h-full w-full bg-[#1e1e1e]" />;
}
```

### 9.3 Terminal Features
- **ANSI color support**: Full 256-color and true-color via xterm.js.
- **Command history**: Agent log records each `runCommand` invocation.
- **Scrollback**: 5,000 lines retained in the terminal buffer.
- **Resize handling**: `FitAddon` + `ResizeObserver` keep the pty dimensions in sync.
- **Link detection**: File paths and URLs in terminal output are clickable.

---

## 10. Agent Context Management

### 10.1 Sliding Window

The message history sent to the LLM is bounded by the model's context limit (minus reserved tokens for system prompt + tools).

```typescript
// src/server/agent/contextManager.ts

export class ContextManager {
  constructor(private readonly maxTokens: number) {}

  buildMessageWindow(
    messages: AgentMessage[],
    systemTokens: number,
    toolSchemaTokens: number,
  ): AgentMessage[] {
    const available = this.maxTokens - systemTokens - toolSchemaTokens - 1000; // 1k reserve
    let tokenCount = 0;
    const window: AgentMessage[] = [];

    // Walk messages newest-first, include while under budget
    for (let i = messages.length - 1; i >= 0; i--) {
      const tokens = estimateTokens(messages[i]!.content);
      if (tokenCount + tokens > available) break;
      tokenCount += tokens;
      window.unshift(messages[i]!);
    }

    return window;
  }

  async summarizeOldMessages(
    messages: AgentMessage[],
    llm: LanguageModel,
  ): Promise<string> {
    const text = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const { text: summary } = await generateText({
      model: llm,
      prompt: `Summarize the following conversation history concisely:\n\n${text}`,
    });
    return summary;
  }
}
```

### 10.2 Memory Injection

On each new session or iteration, the system prompt is augmented with relevant memory:

```typescript
async function buildSystemPrompt(
  userId: string,
  db: PrismaClient,
  projectContext: AgentSessionContext,
): Promise<string> {
  const memories = await db.agentMemory.findMany({
    where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  const memoryBlock = memories.length > 0
    ? `\n\n## Persistent Memory\n${memories.map((m) => `- ${m.key}: ${JSON.stringify(m.value)}`).join('\n')}`
    : '';

  return `You are an expert AI coding assistant operating autonomously.
You have access to a set of tools to read files, write files, run commands, and search the codebase.
Always think step by step. Prefer reading files before modifying them.
When you have completed the task, provide a concise summary of what was done.
${memoryBlock}
## Project Context
Root: ${projectContext.projectRoot ?? 'unknown'}
Open files: ${projectContext.openFiles.join(', ') || 'none'}`;
}
```

### 10.3 Project Context Loading

When a project is set as active, the agent automatically includes:
- The project's `package.json` / `go.mod` / `pyproject.toml` (whichever is present).
- The `README.md` (first 2,000 characters).
- The list of top-level directories.
- The active `AgentSession.context.openFiles` array.

---

## 11. WebSocket Events

All events are emitted by the server over a tRPC subscription. The client Zustand store processes each event:

```typescript
// src/stores/agentStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AgentStore {
  streamingContent: string;
  toolCalls: AgentToolCall[];
  status: SessionStatus;
  pendingApproval: AgentToolCall | null;

  handleEvent: (event: AgentStreamEvent) => void;
}

export const useAgentStore = create<AgentStore>()(
  immer((set) => ({
    streamingContent: '',
    toolCalls: [],
    status: 'idle',
    pendingApproval: null,

    handleEvent: (event) => {
      set((state) => {
        switch (event.type) {
          case 'token':
            state.streamingContent += event.content;
            break;
          case 'tool_call':
            state.toolCalls.push(event.toolCall);
            state.status = 'running';
            break;
          case 'tool_result': {
            const tc = state.toolCalls.find((t) => t.id === event.toolCallId);
            if (tc) {
              tc.status = event.status;
              tc.result = event.result;
              tc.completedAt = new Date();
            }
            break;
          }
          case 'approval_required':
            state.pendingApproval = event.toolCall;
            state.status = 'paused';
            break;
          case 'done':
            state.status = 'complete';
            state.streamingContent = '';
            break;
          case 'error':
            state.status = 'error';
            break;
          case 'limit_reached':
            state.status = 'paused';
            break;
        }
      });
    },
  })),
);
```

---

## 12. Safety Features

### 12.1 Safe Mode

Safe mode is a per-session toggle (default: ON). When enabled:

| Tool | Default Behavior | Safe Mode Behavior |
|---|---|---|
| `readFile` | Auto-execute | Auto-execute (read-only, safe) |
| `searchCode` | Auto-execute | Auto-execute |
| `webSearch` | Auto-execute | Auto-execute |
| `writeFile` | Auto-execute | Pause + show diff + require approval |
| `runCommand` | Auto-execute | Pause + show command + require approval |
| MCP tools (auto) | Auto-execute | Per-server approval mode setting |
| MCP tools (ask) | Require approval | Require approval |

### 12.2 File Path Restrictions

All file operations are validated to stay within the project root:

```typescript
function resolveAndValidatePath(inputPath: string, projectRoot: string): string {
  const resolved = path.resolve(projectRoot, inputPath);
  if (!resolved.startsWith(path.resolve(projectRoot))) {
    throw new Error(`Path traversal attempt blocked: ${inputPath}`);
  }
  return resolved;
}
```

Additionally, the following paths are always blocked, regardless of settings:
- `~/.ssh/**`
- `~/.aws/**`
- `**/.env*`
- `**/secrets/**`
- `/etc/**`, `/proc/**`, `/sys/**`

### 12.3 Network Access Controls

`runCommand` is executed in a restricted environment:
- No access to internal network ranges (RFC 1918) unless the user has explicitly allowed it in project config.
- `webSearch` goes through the configured search provider, never to arbitrary URLs.
- The `fetch` MCP server, if connected, is the designated route for HTTP requests; it respects an allowlist of domains configurable per project.

### 12.4 Rate Limits

- Maximum 20 tool calls per session iteration cycle (resets on user message).
- Maximum 100 tool calls per session total.
- `runCommand` time limit: 30 seconds per command (configurable up to 120s in project config).

---

## 13. Testing

### 13.1 Agentic Loop Unit Tests

```typescript
// src/server/agent/__tests__/agentLoop.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentLoop } from '../agentLoop';
import { createMockLLM, createMockToolDispatcher } from './mocks';

describe('AgentLoop', () => {
  let loop: AgentLoop;
  let mockLLM: ReturnType<typeof createMockLLM>;
  let mockDispatcher: ReturnType<typeof createMockToolDispatcher>;

  beforeEach(() => {
    mockLLM = createMockLLM();
    mockDispatcher = createMockToolDispatcher();
    loop = new AgentLoop({ llm: mockLLM, dispatcher: mockDispatcher, maxIterations: 5 });
  });

  it('completes when LLM returns text with no tool calls', async () => {
    mockLLM.respond({ text: 'Done.' });
    const events: AgentStreamEvent[] = [];
    for await (const e of loop.run('session-1', 'Hello')) events.push(e);
    expect(events.at(-1)?.type).toBe('done');
    expect(events.filter((e) => e.type === 'tool_call').length).toBe(0);
  });

  it('executes a tool call and continues the loop', async () => {
    mockLLM
      .respondWithToolCall({ tool: 'readFile', args: { filePath: 'index.ts' } })
      .thenRespond({ text: 'File reviewed.' });
    mockDispatcher.returns('readFile', { content: 'const x = 1;', totalLines: 1 });

    const events: AgentStreamEvent[] = [];
    for await (const e of loop.run('session-1', 'Read index.ts')) events.push(e);

    expect(events.find((e) => e.type === 'tool_call')?.toolCall.tool).toBe('readFile');
    expect(events.find((e) => e.type === 'tool_result')?.status).toBe('success');
    expect(events.at(-1)?.type).toBe('done');
  });

  it('emits limit_reached after maxIterations', async () => {
    // LLM always returns a tool call (infinite loop potential)
    mockLLM.alwaysRespondWithToolCall({ tool: 'readFile', args: { filePath: 'a.ts' } });
    mockDispatcher.returns('readFile', { content: '' });

    const events: AgentStreamEvent[] = [];
    for await (const e of loop.run('session-1', 'Loop forever')) events.push(e);

    expect(events.at(-1)?.type).toBe('limit_reached');
    expect((events.at(-1) as any).iterations).toBe(5);
  });

  it('pauses and awaits approval in safe mode', async () => {
    mockLLM.respondWithToolCall({ tool: 'writeFile', args: { filePath: 'a.ts', content: 'x' } });
    let approvalRequested = false;
    const approvalCallback = vi.fn().mockImplementation(async () => {
      approvalRequested = true;
      return true; // approve
    });

    loop = new AgentLoop({
      llm: mockLLM, dispatcher: mockDispatcher,
      maxIterations: 5, safeMode: true, approvalCallback,
    });
    mockLLM.thenRespond({ text: 'Written.' });
    mockDispatcher.returns('writeFile', { written: true });

    const events: AgentStreamEvent[] = [];
    for await (const e of loop.run('session-1', 'Write file')) events.push(e);

    expect(approvalRequested).toBe(true);
    expect(events.find((e) => e.type === 'approval_required')).toBeDefined();
  });
});
```

### 13.2 MCP Mock Server Tests

```typescript
// src/server/mcp/__tests__/mcpClientManager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPClientManager } from '../MCPClientManager';
import { createMockMCPServer } from './mockServer';

describe('MCPClientManager', () => {
  let manager: MCPClientManager;
  let mockServer: Awaited<ReturnType<typeof createMockMCPServer>>;

  beforeEach(async () => {
    mockServer = await createMockMCPServer({
      tools: [{ name: 'echo', description: 'Echo input', inputSchema: { type: 'object', properties: { text: { type: 'string' } } } }],
    });
    manager = new MCPClientManager();
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  it('connects to an SSE MCP server and lists tools', async () => {
    const tools = await manager.connect({
      id: 'test', type: 'sse', url: mockServer.url,
    } as any);
    expect(tools).toHaveLength(1);
    expect(tools[0]!.name).toBe('echo');
  });

  it('calls a tool and returns the result', async () => {
    await manager.connect({ id: 'test', type: 'sse', url: mockServer.url } as any);
    const result = await manager.callTool('test', 'echo', { text: 'hello' });
    expect(result).toEqual([{ type: 'text', text: 'hello' }]);
  });
});
```

### 13.3 Tool Execution Tests

```typescript
// src/server/agent/tools/__tests__/readFile.test.ts
import { describe, it, expect } from 'vitest';
import { readFileTool } from '../readFile';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('readFileTool', () => {
  const projectRoot = join(tmpdir(), 'agent-test');

  beforeEach(() => {
    mkdirSync(projectRoot, { recursive: true });
    writeFileSync(join(projectRoot, 'test.ts'), 'line1\nline2\nline3\n');
  });

  it('reads the entire file', async () => {
    const result = await readFileTool.execute(
      { filePath: 'test.ts' },
      { projectRoot },
    );
    expect(result.content).toBe('line1\nline2\nline3\n');
    expect(result.totalLines).toBe(4);
  });

  it('reads a specific line range', async () => {
    const result = await readFileTool.execute(
      { filePath: 'test.ts', startLine: 2, endLine: 2 },
      { projectRoot },
    );
    expect(result.content).toBe('line2');
  });

  it('blocks path traversal attempts', async () => {
    await expect(
      readFileTool.execute({ filePath: '../../etc/passwd' }, { projectRoot }),
    ).rejects.toThrow('Path traversal attempt blocked');
  });
});
```

---

## Appendix: Zustand Store Structure

```typescript
// src/stores/agentStore.ts (full interface)

interface AgentStore {
  // Session
  activeSessionId: string | null;
  sessions: AgentSessionSummary[];
  currentSession: AgentSessionWithMessages | null;
  status: SessionStatus;

  // Editor
  openFiles: string[];
  activeFile: string | null;
  fileContents: Record<string, string>; // path → content
  pendingDiff: { file: string; original: string; modified: string } | null;

  // MCP
  servers: MCPServerWithTools[];
  serverStatuses: Record<string, 'connected' | 'disconnected' | 'connecting'>;

  // Stream
  streamingContent: string;
  toolCalls: AgentToolCall[];
  pendingApproval: AgentToolCall | null;

  // Memory
  memories: AgentMemory[];

  // Projects
  projects: AgentProject[];
  activeProjectId: string | null;

  // Actions
  setActiveSession: (id: string) => void;
  setActiveFile: (path: string) => void;
  handleEvent: (event: AgentStreamEvent) => void;
  acceptDiff: () => void;
  rejectDiff: () => void;
}
```
