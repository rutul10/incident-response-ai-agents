# CLAUDE.md — P5: Incident Response Automation
> Auto-loaded by Claude Code each session. Keep this current.
> At end of session: "Update CLAUDE.md — mark [X] done, log today's session."

---

## Project Overview

**Project:** P5 — Multi-Agent Incident Response Automation
**Location:** `~/workspace/rpatel9/p5-incident-response`
**Status:** Phase 1 — Scaffold + Data Model

**What this builds:**
A Next.js app that simulates an AI-powered incident response pipeline.
A user triggers a mock incident from the UI and watches five specialized
AI agents execute in sequence/parallel — Triage → Investigator + Blast Radius
(parallel) → Remediation → Postmortem — producing a complete postmortem draft.

**Current phase goal:**
Get the data model, mock data layer, and all five agents working in isolation
before wiring the orchestrator or building the UI.

---

## Project Lineage (Read This First)

This is P5 in a structured AI engineering learning roadmap. Each project
builds on the last. Do not suggest patterns that conflict with what was
learned in prior projects.

| Project | What was built | Key patterns learned |
|---|---|---|
| P1 — AI Task Manager | Next.js + Prisma + Neon + NextAuth + Gemini tool use + MCP server | Agentic tool use loop, MCP architecture |
| P2 — MCP Server Library | Reusable `createMcpServer()` npm package | MCP protocol depth, npm packaging |
| P3 — AI Doc Q&A | pgvector, document chunking, Gemini embeddings, similarity search | RAG, embeddings, vector search |
| P4 — Recall | Three-tier memory: short-term history, mid-term summarization, long-term RAG | Memory architectures, summarization chains |
| P5 — This project | Multi-agent orchestration, dependency graphs, parallel execution | Agent specialization, orchestration patterns |

---

## Stack

- **Framework:** Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **ORM:** Prisma
- **Database:** Neon PostgreSQL + pgvector (same setup as P3/P4)
- **AI:** Google Gemini API (`gemini-2.5-flash` for agents, `gemini-embedding-001` for RAG)
- **MCP:** `@modelcontextprotocol/sdk` (pipeline exposed as single MCP tool)
- **Package manager:** npm

---

## Directory Structure

```
p5-incident-response/
├── CLAUDE.md                        ← this file
├── prisma/
│   └── schema.prisma                ← Incident, IncidentTask, AgentResult, Postmortem
├── lib/
│   ├── types.ts                     ← ALL shared interfaces — start here
│   ├── gemini.ts                    ← Gemini client setup (same pattern as P1/P4)
│   ├── mocks/
│   │   ├── alert.ts                 ← Fake PagerDuty payload
│   │   ├── metrics.ts               ← Fake New Relic error rate / latency data
│   │   ├── logs.ts                  ← Fake log lines around incident time
│   │   ├── dependencies.ts          ← Hardcoded service dependency graph
│   │   └── runbooks.ts              ← 3-4 fake runbooks as markdown strings
│   ├── agents/
│   │   ├── triage.ts                ← Agent 1: classify severity, identify service
│   │   ├── investigator.ts          ← Agent 2: query metrics/logs, build timeline
│   │   ├── blast-radius.ts          ← Agent 3: map dependencies, estimate impact
│   │   ├── remediation.ts           ← Agent 4: match runbooks, suggest fix steps
│   │   └── postmortem.ts            ← Agent 5: assemble full postmortem draft
│   ├── orchestrator.ts              ← Dependency-aware execution loop
│   └── dispatcher.ts                ← Routes tasks to agents, builds context
├── app/
│   ├── api/
│   │   ├── pipeline/
│   │   │   └── route.ts             ← POST: trigger pipeline, stream status
│   │   └── incidents/
│   │       └── route.ts             ← GET: incident history + traces
│   ├── page.tsx                     ← Dashboard: trigger panel + trace view
│   └── incidents/
│       └── [id]/
│           └── page.tsx             ← Incident detail: full trace + postmortem
├── components/
│   ├── TriggerPanel.tsx             ← Scenario selector + run button
│   ├── PipelineTrace.tsx            ← Live agent execution view
│   └── PostmortemViewer.tsx         ← Editable postmortem draft
└── mcp-server/
    └── index.ts                     ← Exposes pipeline as single MCP tool
```

---

## Prisma Schema

```prisma
model Incident {
  id           String         @id @default(cuid())
  scenarioId   String
  alertPayload Json
  severity     String?
  service      String?
  status       String         @default("pending")
  createdAt    DateTime       @default(now())
  tasks        IncidentTask[]
  postmortem   Postmortem?
}

model IncidentTask {
  id            String        @id @default(cuid())
  incidentId    String
  incident      Incident      @relation(fields: [incidentId], references: [id])
  type          String        // triage | investigator | blast-radius | remediation | postmortem
  dependsOn     String[]      // array of task IDs that must complete first
  status        String        @default("pending")
  assignedAgent String
  startedAt     DateTime?
  completedAt   DateTime?
  result        AgentResult?
}

model AgentResult {
  id              String       @id @default(cuid())
  taskId          String       @unique
  task            IncidentTask @relation(fields: [taskId], references: [id])
  agentName       String
  input           Json
  output          Json
  confidenceScore Float?
  durationMs      Int?
  createdAt       DateTime     @default(now())
}

model Postmortem {
  id               String   @id @default(cuid())
  incidentId       String   @unique
  incident         Incident @relation(fields: [incidentId], references: [id])
  severity         String
  affectedService  String
  timeline         Json
  rootCause        String
  blastRadius      Json
  remediationSteps Json
  lessonsLearned   String
  actionItems      Json
  draft            String   // full markdown postmortem
  status           String   @default("draft")
  createdAt        DateTime @default(now())
}
```

---

## Core Type Contracts (`lib/types.ts`)

These are the interfaces everything else is built on. Define these first,
before writing any agent or orchestrator code.

```typescript
// --- Alert / Input ---

export interface MockAlert {
  id: string
  scenarioId: string
  service: string
  summary: string
  severity: 'critical' | 'warning' | 'info'
  triggeredAt: string
  details: {
    errorRate: number
    threshold: number
    environment: string
  }
}

// --- Agent I/O ---

export interface AgentInput {
  alert: MockAlert
  dependencyResults: Record<string, AgentOutput>  // results from dependent tasks
}

export interface AgentOutput {
  agentName: string
  success: boolean
  confidenceScore: number   // 0.0 - 1.0
  data: Record<string, unknown>
  reasoning?: string        // agent's explanation of its output
  needsHumanReview?: boolean
}

// --- Task Graph ---

export type TaskType =
  | 'triage'
  | 'investigator'
  | 'blast-radius'
  | 'remediation'
  | 'postmortem'

export interface Task {
  id: string
  type: TaskType
  dependsOn: string[]       // task IDs that must complete first
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: AgentOutput
}

export interface TaskPlan {
  incidentId: string
  tasks: Task[]
}

// --- Triage Output ---

export interface TriageOutput extends AgentOutput {
  data: {
    severity: 'SEV1' | 'SEV2' | 'SEV3'
    affectedService: string
    summary: string
    isDuplicate: boolean
    pageHuman: boolean
    proceedWithPipeline: boolean   // false for SEV3
  }
}

// --- Investigator Output ---

export interface InvestigatorOutput extends AgentOutput {
  data: {
    timeline: Array<{ time: string; event: string; significance: 'high' | 'medium' | 'low' }>
    probableCause: string
    evidence: string[]
    deployCorrelation: boolean
  }
}

// --- Blast Radius Output ---

export interface BlastRadiusOutput extends AgentOutput {
  data: {
    upstreamCallers: string[]
    downstreamDeps: string[]
    estimatedUsersAffected: number
    featuresDown: string[]
    complianceFlag: boolean
  }
}

// --- Remediation Output ---

export interface RemediationOutput extends AgentOutput {
  data: {
    recommendedAction: 'rollback' | 'config-change' | 'restart' | 'scale' | 'investigate'
    steps: string[]
    runbookRef: string
    estimatedMTTR: string
  }
}

// --- Postmortem Output ---

export interface PostmortemOutput extends AgentOutput {
  data: {
    markdown: string
    sections: {
      timeline: string
      rootCause: string
      impact: string
      remediation: string
      lessonsLearned: string
      actionItems: string[]
    }
  }
}

// --- Pipeline Run ---

export interface PipelineRun {
  incidentId: string
  status: 'running' | 'completed' | 'failed' | 'stopped-at-triage'
  tasks: Task[]
  postmortem?: PostmortemOutput
  totalDurationMs: number
}
```

---

## Mock Data Shapes (`lib/mocks/`)

### alert.ts — Matches real PagerDuty Events API v2 payload shape
```typescript
export const MOCK_SCENARIOS: Record<string, MockAlert> = {
  'checkout-db-pool': {
    id: 'INC-001',
    scenarioId: 'checkout-db-pool',
    service: 'checkout-api',
    summary: 'High error rate detected — 42% of requests failing',
    severity: 'critical',
    triggeredAt: '2024-01-15T14:32:00Z',
    details: { errorRate: 42.3, threshold: 5.0, environment: 'production' }
  },
  'auth-latency': {
    id: 'INC-002',
    scenarioId: 'auth-latency',
    service: 'auth-service',
    summary: 'P99 latency exceeding 3s threshold',
    severity: 'warning',
    triggeredAt: '2024-01-15T16:10:00Z',
    details: { errorRate: 3.1, threshold: 1.0, environment: 'production' }
  },
  'noise-alert': {
    id: 'INC-003',
    scenarioId: 'noise-alert',
    service: 'background-worker',
    summary: 'Single pod restart detected',
    severity: 'info',
    triggeredAt: '2024-01-15T18:45:00Z',
    details: { errorRate: 0.2, threshold: 1.0, environment: 'production' }
  }
}
```

### metrics.ts — Matches real New Relic NerdGraph response shape
Returns realistic error rate timeseries + recent deploy events per service.

### logs.ts — Matches real log aggregator response shape
Returns array of `{ time, level, message }` objects around incident window.

### dependencies.ts — Hardcoded service dependency graph
```typescript
export const SERVICE_GRAPH: Record<string, ServiceDeps> = {
  'checkout-api': {
    upstreamCallers: ['web-frontend', 'mobile-app', 'order-service'],
    downstreamDeps: ['postgres-primary', 'payment-processor', 'fraud-detection'],
    estimatedUsersAffected: 12000,
    featuresDown: ['checkout', 'order-confirmation']
  },
  'auth-service': {
    upstreamCallers: ['web-frontend', 'mobile-app', 'checkout-api', 'admin-portal'],
    downstreamDeps: ['postgres-primary', 'redis-session'],
    estimatedUsersAffected: 45000,
    featuresDown: ['login', 'session-refresh', 'all-authenticated-features']
  }
}
```

### runbooks.ts — 3-4 fake runbooks as markdown strings
Realistic runbook content for: DB connection pool exhaustion, high latency,
pod restarts, payment processor timeouts.

---

## Agent Patterns

Each agent follows this exact structure — no exceptions:

```typescript
// lib/agents/triage.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AgentInput, TriageOutput } from '../types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const SYSTEM_PROMPT = `
You are a senior SRE triage specialist. Your ONLY job is to...
[specific role description]
Always respond with valid JSON matching this exact schema:
[paste the output schema]
`

export async function triageAgent(input: AgentInput): Promise<TriageOutput> {
  const start = Date.now()

  const prompt = `
Alert payload: ${JSON.stringify(input.alert, null, 2)}
[any other relevant context]
`

  const result = await model.generateContent(SYSTEM_PROMPT + '\n\n' + prompt)
  const text = result.response.text()

  // Always strip markdown fences before parsing
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return {
    agentName: 'triage',
    success: true,
    confidenceScore: parsed.confidenceScore ?? 0.8,
    data: parsed,
    reasoning: parsed.reasoning,
    needsHumanReview: parsed.confidenceScore < 0.6,
    durationMs: Date.now() - start
  }
}
```

**Important:** Every agent prompts Gemini to return JSON only. Always strip
markdown fences before `JSON.parse()`. Low confidence scores (`< 0.6`) flag
the postmortem for human review rather than auto-publishing.

---

## Orchestrator Logic

```
1. Receive MockAlert → create Incident in DB
2. Build TaskPlan (fixed graph — not AI-generated in this project):
   - triage        (no deps)
   - investigator  (depends on: triage)
   - blast-radius  (depends on: triage)
   - remediation   (depends on: investigator, blast-radius)
   - postmortem    (depends on: remediation)
3. Persist all tasks to DB with status=pending
4. Run triage agent
5. If triage.data.proceedWithPipeline === false → stop, mark run as stopped-at-triage
6. Loop until all tasks completed:
   a. Find tasks: status=pending AND all deps status=completed
   b. Promise.all(unblocked tasks) — runs investigator + blast-radius in parallel
   c. For each result: persist AgentResult, mark task=completed
7. Assemble final postmortem, persist Postmortem record
8. Return PipelineRun
```

The orchestrator contains zero AI calls. It is pure TypeScript control flow.
If it feels like it needs AI, that logic belongs in an agent.

---

## Gemini Setup (`lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export const agentModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.3,      // lower = more deterministic for structured output
    responseMimeType: 'application/json'  // force JSON output mode
  }
})
```

Using `responseMimeType: 'application/json'` tells Gemini to always return
valid JSON — no markdown fences to strip. Prefer this over prompting for JSON.

---

## Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."     # Neon connection string
GEMINI_API_KEY="..."                # Google AI Studio key
```

---

## Build Phases

### Phase 1 — Scaffold + Data Model ← CURRENT
- [ ] `npx create-next-app@latest p5-incident-response --typescript --tailwind --app`
- [ ] Install deps: `npm install @prisma/client @google/generative-ai @modelcontextprotocol/sdk`
- [ ] `npx prisma init` → paste schema above → `npx prisma migrate dev --name init`
- [ ] Seed one fake incident, verify in Prisma Studio
- [ ] Create `lib/types.ts` with all interfaces above

### Phase 2 — Mock Data Layer
- [ ] Create `lib/mocks/alert.ts` — three scenarios
- [ ] Create `lib/mocks/metrics.ts` — per-service timeseries
- [ ] Create `lib/mocks/logs.ts` — realistic log lines
- [ ] Create `lib/mocks/dependencies.ts` — service graph
- [ ] Create `lib/mocks/runbooks.ts` — 3 runbook strings

### Phase 3 — Agents (one at a time, test in isolation)
- [ ] `lib/agents/triage.ts` — test with all three mock scenarios
- [ ] `lib/agents/investigator.ts` — test with checkout-db-pool scenario
- [ ] `lib/agents/blast-radius.ts` — test with checkout-db-pool scenario
- [ ] `lib/agents/remediation.ts` — test with outputs from above two
- [ ] `lib/agents/postmortem.ts` — test with all four outputs

### Phase 4 — Orchestrator
- [ ] `lib/dispatcher.ts` — routes task type to agent function, builds context
- [ ] `lib/orchestrator.ts` — dependency-aware loop, persists results to DB
- [ ] Test full pipeline end-to-end in a standalone script

### Phase 5 — API + UI
- [ ] `POST /api/pipeline` — triggers orchestrator, returns run result
- [ ] `GET /api/incidents` — returns run history
- [ ] `TriggerPanel.tsx` — scenario dropdown + run button
- [ ] `PipelineTrace.tsx` — shows each agent status, duration, confidence
- [ ] `PostmortemViewer.tsx` — renders postmortem markdown, editable

### Phase 6 — MCP Server
- [ ] `mcp-server/index.ts` — single tool: `trigger_incident_pipeline`
- [ ] Test from Claude Desktop: trigger an incident via natural language

---

## Key Rules for Claude Code

1. **Types first.** Never generate an agent without `lib/types.ts` existing.
2. **One agent at a time.** Build and test each agent in isolation before the orchestrator.
3. **No AI in the orchestrator.** It is pure control flow — dependency resolution and dispatch only.
4. **Always use `responseMimeType: 'application/json'`** in Gemini config to avoid markdown fences.
5. **Confidence score gating.** If any agent returns `confidenceScore < 0.6`, set postmortem `status = 'needs-review'` not `'draft'`.
6. **SEV3 early exit.** Triage returns `proceedWithPipeline: false` for SEV3 — orchestrator stops immediately, no further agents run.
7. **Parallel execution.** Investigator and Blast Radius always run via `Promise.all()` — they have no dependency on each other.
8. **Mock data is the real API shape.** All mock objects match the shape of the real external API they simulate (PagerDuty, New Relic). When real integrations are added, only the data source changes — agent code stays identical.
9. **Prisma CLI.** If auto-detection fails, pass `--schema=prisma/schema.prisma` explicitly.
10. **Verify package versions** before suggesting installs — this codebase uses current stable versions, not outdated ones.
11. **Check every dependency version online before suggesting any code.** Do not rely on training data for package versions, APIs, config syntax, or usage patterns. Always search the web for the latest docs and verify that the code/config you suggest is compatible with the installed versions. Outdated patterns have caused issues in past projects.
12. **Prisma 7+ config.** Database connection URL goes in `prisma.config.ts`, NOT in `schema.prisma`. The `url` property inside `datasource` block in schema files is no longer supported in Prisma 7. Always use `prisma.config.ts` for connection URLs.

---

## Testing Approach

**Layer 1 — Contract tests (no Gemini calls)**
- Orchestrator routing: given SEV3 triage output, assert pipeline stops
- Dependency resolution: given task graph, assert correct unblocked tasks
- Postmortem assembly: given agent outputs, assert all sections present

**Layer 2 — Agent behavior tests (fixture-based)**
- Save real Gemini responses to `/tests/fixtures/` as JSON
- Swap Gemini client for fixture loader in test environment
- Assert output shape, required fields, confidence score presence

**Layer 3 — Integration tests (real Gemini, run sparingly)**
- Full pipeline against `checkout-db-pool` scenario
- Assert postmortem has all required sections, none empty
- Gate behind `ENABLE_INTEGRATION_TESTS=true` env flag

---

## Future Integrations (Do Not Build Yet)

These are planned for after the mock pipeline is fully working:

| Integration | Replaces | Agent |
|---|---|---|
| PagerDuty Webhooks | Manual UI trigger | Inbound alert source |
| New Relic NerdGraph API | `lib/mocks/metrics.ts` | Investigator |
| GitHub REST API | `lib/mocks/metrics.ts` (deploy data) | Investigator |
| Slack Incoming Webhooks | None (new) | Notification output |
| P3 pgvector RAG | `lib/mocks/runbooks.ts` | Remediation |

---

## Session Log

| Date | Phase | What was done |
|---|---|---|
| 2026-03-09 | Design | Defined project scenario, architecture, build phases, generated CLAUDE.md |
