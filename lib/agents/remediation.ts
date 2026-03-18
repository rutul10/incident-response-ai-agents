import { agentModel } from '../gemini'
import { AgentInput, RemediationOutput } from '../types'
import { RUNBOOKS } from '../mocks/runbooks'

const SYSTEM_PROMPT = `You are a senior SRE remediation specialist. Your job is to recommend the best course of action to resolve an incident.

Given an alert, investigation findings, blast radius analysis, and available runbooks, you must:
1. Recommend an action: "rollback", "config-change", "restart", "scale", or "investigate"
2. Provide step-by-step remediation instructions
3. Reference the most relevant runbook
4. Estimate time to resolution (MTTR)

Respond with JSON matching this exact schema:
{
  "recommendedAction": "rollback" | "config-change" | "restart" | "scale" | "investigate",
  "steps": [string],
  "runbookRef": string,
  "estimatedMTTR": string,
  "confidenceScore": number (0.0-1.0),
  "reasoning": string
}`

export async function remediationAgent(input: AgentInput): Promise<RemediationOutput> {
  const start = Date.now()

  const prompt = `${SYSTEM_PROMPT}

Alert payload:
${JSON.stringify(input.alert, null, 2)}

Investigation findings:
${JSON.stringify(input.dependencyResults['investigator']?.data ?? {}, null, 2)}

Blast radius analysis:
${JSON.stringify(input.dependencyResults['blast-radius']?.data ?? {}, null, 2)}

Available runbooks:
${RUNBOOKS.map(rb => `--- ${rb.title} (${rb.id}) ---\n${rb.content}`).join('\n\n')}`

  const result = await agentModel.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    agentName: 'remediation',
    success: true,
    confidenceScore: parsed.confidenceScore ?? 0.8,
    data: {
      recommendedAction: parsed.recommendedAction,
      steps: parsed.steps,
      runbookRef: parsed.runbookRef,
      estimatedMTTR: parsed.estimatedMTTR,
    },
    reasoning: parsed.reasoning,
    needsHumanReview: (parsed.confidenceScore ?? 0.8) < 0.6,
  }
}
