import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { MOCK_SCENARIOS } from '../lib/mocks/alert'
import { runPipeline } from '../lib/orchestrator'


const server = new McpServer({
  name: 'incident-response-pipeline',
  version: '1.0.0',
})

server.tool(
  'trigger_incident_pipeline',
  'Triggers an AI-powered incident response pipeline. Runs 5 specialized agents (triage, investigator, blast-radius, remediation, postmortem) to analyze an incident and produce a complete postmortem draft.',
  {
    scenarioId: z
      .enum(['checkout-db-pool', 'auth-latency', 'noise-alert'])
      .describe('The incident scenario to investigate'),
  },
  async ({ scenarioId }) => {
    const alert = MOCK_SCENARIOS[scenarioId]

    if (!alert) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Unknown scenario: ${scenarioId}. Choose from: ${Object.keys(MOCK_SCENARIOS).join(', ')}`,
          },
        ],
        isError: true,
      }
    }

    const result = await runPipeline(alert)

    // Build a human-readable summary
    const summary = [
      `## Incident Pipeline Result`,
      `**Incident ID:** ${result.incidentId}`,
      `**Status:** ${result.status}`,
      `**Duration:** ${result.totalDurationMs}ms`,
      '',
    ]

    // Add task results
    for (const task of result.tasks) {
      const conf = task.result?.confidenceScore
        ? ` (confidence: ${(task.result.confidenceScore * 100).toFixed(0)}%)`
        : ''
      summary.push(`- **${task.type}**: ${task.status}${conf}`)
    }

    // Add postmortem if available
    if (result.postmortem) {
      summary.push('', '---', '', result.postmortem.data.markdown)
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: summary.join('\n'),
        },
      ],
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
