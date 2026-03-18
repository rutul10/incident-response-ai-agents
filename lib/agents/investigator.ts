import { agentModel } from '../gemini'
import { AgentInput, InvestigatorOutput } from '../types'
import { MOCK_METRICS } from '../mocks/metrics'
import { MOCK_LOGS } from '../mocks/logs'

const SYSTEM_PROMPT = `You are a senior SRE investigator. Your job is to analyze metrics and logs to build an incident timeline and identify the probable root cause.

Given an alert, triage results, metrics timeseries, and log entries, you must:
1. Build a chronological timeline of significant events
2. Identify the probable root cause
3. List supporting evidence
4. Determine if a recent deploy correlates with the incident

Respond with JSON matching this exact schema:
{
  "timeline": [{ "time": string, "event": string, "significance": "high" | "medium" | "low" }],
  "probableCause": string,
  "evidence": [string],
  "deployCorrelation": boolean,
  "confidenceScore": number (0.0-1.0),
  "reasoning": string
}`

export async function investigatorAgent(input: AgentInput): Promise<InvestigatorOutput> {
  const start = Date.now()

  const service = input.alert.service
  const metrics = MOCK_METRICS[service] ?? null
  const logs = MOCK_LOGS[service] ?? null

  const prompt = `${SYSTEM_PROMPT}

Alert payload:
${JSON.stringify(input.alert, null, 2)}

Triage results:
${JSON.stringify(input.dependencyResults['triage']?.data ?? {}, null, 2)}

Metrics (error rate & latency timeseries + recent deploys):
${JSON.stringify(metrics, null, 2)}

Logs around incident window:
${JSON.stringify(logs, null, 2)}`

  const result = await agentModel.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    agentName: 'investigator',
    success: true,
    confidenceScore: parsed.confidenceScore ?? 0.8,
    data: {
      timeline: parsed.timeline,
      probableCause: parsed.probableCause,
      evidence: parsed.evidence,
      deployCorrelation: parsed.deployCorrelation,
    },
    reasoning: parsed.reasoning,
    needsHumanReview: (parsed.confidenceScore ?? 0.8) < 0.6,
  }
}
