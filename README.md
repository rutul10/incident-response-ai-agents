# P5 — Multi-Agent Incident Response Automation

An AI-powered incident response pipeline built with Next.js. Trigger a mock incident and watch five specialized AI agents execute in sequence and parallel to produce a complete postmortem draft.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Gemini](https://img.shields.io/badge/Gemini-2.5--flash-blue)
![Prisma](https://img.shields.io/badge/Prisma-7-teal)
![MCP](https://img.shields.io/badge/MCP-1.27-purple)

## How It Works

A single alert triggers a dependency-aware pipeline of 5 AI agents:

```
Alert ──▶ Triage ──▶ Investigator  ──▶ Remediation ──▶ Postmortem
                 └──▶ Blast Radius ──┘
```

1. **Triage** — Classifies severity (SEV1/2/3), identifies affected service, decides if pipeline should proceed
2. **Investigator** — Queries metrics and logs, builds an incident timeline, identifies probable root cause
3. **Blast Radius** — Maps upstream/downstream dependencies, estimates user impact *(runs in parallel with Investigator)*
4. **Remediation** — Matches runbooks, recommends action (rollback, restart, scale, etc.)
5. **Postmortem** — Assembles a complete postmortem draft with timeline, root cause, impact, and action items

SEV3 alerts exit early at triage — no unnecessary agent calls. If any agent returns low confidence (< 0.6), the postmortem is flagged for human review.

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Database:** Neon PostgreSQL via Prisma 7
- **AI:** Google Gemini API (`gemini-2.5-flash`, JSON response mode)
- **MCP:** Exposed as a single tool for Claude Desktop / VS Code

## Quick Start

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Google AI Studio](https://aistudio.google.com) API key

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/p5-incident-response.git
cd p5-incident-response
npm install
```

Create a `.env` file:

```bash
DATABASE_URL="postgresql://..."     # Neon connection string
GEMINI_API_KEY="..."                # Google AI Studio key
```

Run the database migration:

```bash
npx prisma migrate dev --name init
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

### Web UI

1. Select a scenario from the dropdown (checkout DB pool, auth latency, or noise alert)
2. Click **Run Pipeline**
3. Watch agents execute in real-time in the Pipeline Trace panel
4. View the generated postmortem when complete

### MCP Server

The pipeline is also exposed as an MCP tool for use with Claude Desktop or VS Code.

```bash
npm run mcp
```

See [docs/mcp-setup.md](docs/mcp-setup.md) for configuration instructions.

## Mock Scenarios

| Scenario | Service | Severity | Behavior |
|---|---|---|---|
| `checkout-db-pool` | checkout-api | Critical | Full pipeline — 5 agents, produces postmortem |
| `auth-latency` | auth-service | Warning | Full pipeline — P99 latency investigation |
| `noise-alert` | background-worker | Info | Stops at triage (SEV3, no further agents) |

## Project Structure

```
├── lib/
│   ├── types.ts              # All shared TypeScript interfaces
│   ├── gemini.ts             # Gemini client configuration
│   ├── orchestrator.ts       # Dependency-aware execution loop
│   ├── dispatcher.ts         # Routes tasks to agent functions
│   ├── agents/
│   │   ├── triage.ts         # Severity classification
│   │   ├── investigator.ts   # Timeline and root cause analysis
│   │   ├── blast-radius.ts   # Dependency impact mapping
│   │   ├── remediation.ts    # Runbook matching and fix steps
│   │   └── postmortem.ts     # Full postmortem assembly
│   └── mocks/
│       ├── alert.ts          # Mock PagerDuty alerts
│       ├── metrics.ts        # Mock New Relic metrics
│       ├── logs.ts           # Mock log entries
│       ├── dependencies.ts   # Service dependency graph
│       └── runbooks.ts       # Incident runbooks
├── app/
│   ├── page.tsx              # Dashboard with trigger + trace + postmortem
│   ├── incidents/[id]/       # Incident detail page
│   └── api/
│       ├── pipeline/         # POST: trigger pipeline
│       └── incidents/        # GET: incident history
├── components/
│   ├── TriggerPanel.tsx      # Scenario selector + run button
│   ├── PipelineTrace.tsx     # Live agent execution status
│   └── PostmortemViewer.tsx  # Editable postmortem draft
├── mcp-server/
│   └── index.ts              # MCP tool: trigger_incident_pipeline
└── prisma/
    └── schema.prisma         # Incident, Task, AgentResult, Postmortem
```

## Architecture

### Orchestrator

The orchestrator is pure TypeScript control flow — zero AI calls. It:

1. Creates an Incident record in the database
2. Builds a fixed task graph with dependency edges
3. Loops: finds unblocked tasks → runs them via `Promise.all()` → persists results
4. Handles SEV3 early exit and confidence-based review flagging

### Agent Contract

Every agent follows the same interface:

```typescript
(input: AgentInput) => Promise<AgentOutput>
```

- **Input:** The original alert + results from upstream agents
- **Output:** Structured JSON with `confidenceScore`, `data`, and `reasoning`
- Gemini is configured with `responseMimeType: 'application/json'` for reliable structured output

### Database

Four Prisma models track the full lifecycle:

- **Incident** — The triggering alert and overall status
- **IncidentTask** — Individual agent executions with dependency tracking
- **AgentResult** — Raw agent input/output, confidence scores, duration
- **Postmortem** — The assembled postmortem document with all sections

## API

### `POST /api/pipeline`

Trigger a new pipeline run.

```json
{ "scenarioId": "checkout-db-pool" }
```

Returns a `PipelineRun` with all task results and the generated postmortem.

### `GET /api/incidents`

Returns all past incidents with their tasks and postmortems.

## Learning Context

This is P5 in a structured AI engineering learning roadmap:

| # | Project | Key Patterns |
|---|---|---|
| P1 | AI Task Manager | Agentic tool use, MCP architecture |
| P2 | MCP Server Library | MCP protocol, npm packaging |
| P3 | AI Doc Q&A | RAG, embeddings, vector search |
| P4 | Recall | Memory architectures, summarization |
| **P5** | **Incident Response** | **Multi-agent orchestration, parallel execution** |

## License

MIT
