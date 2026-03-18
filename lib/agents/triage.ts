import { agentModel } from '../gemini'
import { AgentInput, TriageOutput } from '../types'

const SYSTEM_PROMPT = `You are a senior SRE triage specialist. Your ONLY job is to classify incoming alerts.

Given an alert payload, you must determine:
1. Severity: SEV1 (critical, customer-facing outage), SEV2 (degraded, needs attention), SEV3 (noise, no action needed)
2. The affected service name
3. A one-sentence summary of the issue
4. Whether this is a duplicate of a known issue
5. Whether to page a human (SEV1 always, SEV2 sometimes, SEV3 never)
6. Whether the automated pipeline should proceed (false for SEV3 — not worth investigating)

Respond with JSON matching this exact schema:
{
  "severity": "SEV1" | "SEV2" | "SEV3",
  "affectedService": string,
  "summary": string,
  "isDuplicate": boolean,
  "pageHuman": boolean,
  "proceedWithPipeline": boolean,
  "confidenceScore": number (0.0-1.0),
  "reasoning": string
}`

export async function triageAgent(input: AgentInput): Promise<TriageOutput> {
  const start = Date.now()

  const prompt = `${SYSTEM_PROMPT}

Alert payload:
${JSON.stringify(input.alert, null, 2)}`

  const result = await agentModel.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    agentName: 'triage',
    success: true,
    confidenceScore: parsed.confidenceScore ?? 0.8,
    data: {
      severity: parsed.severity,
      affectedService: parsed.affectedService,
      summary: parsed.summary,
      isDuplicate: parsed.isDuplicate,
      pageHuman: parsed.pageHuman,
      proceedWithPipeline: parsed.proceedWithPipeline,
    },
    reasoning: parsed.reasoning,
    needsHumanReview: (parsed.confidenceScore ?? 0.8) < 0.6,
  }
}
