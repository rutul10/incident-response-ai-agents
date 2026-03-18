import { agentModel } from '../gemini'
import { AgentInput, BlastRadiusOutput } from '../types'
import { SERVICE_GRAPH } from '../mocks/dependencies'

const SYSTEM_PROMPT = `You are a senior SRE blast radius analyst. Your job is to assess the impact of an incident across the service dependency graph.

Given an alert, triage results, and the service dependency graph, you must:
1. Identify all upstream callers affected
2. Identify all downstream dependencies affected
3. Estimate the number of users impacted
4. List features that are degraded or down
5. Flag if there are compliance implications (e.g. payment, auth, or PII services affected)

Respond with JSON matching this exact schema:
{
  "upstreamCallers": [string],
  "downstreamDeps": [string],
  "estimatedUsersAffected": number,
  "featuresDown": [string],
  "complianceFlag": boolean,
  "confidenceScore": number (0.0-1.0),
  "reasoning": string
}`

export async function blastRadiusAgent(input: AgentInput): Promise<BlastRadiusOutput> {
  const start = Date.now()

  const service = input.alert.service
  const deps = SERVICE_GRAPH[service] ?? null

  const prompt = `${SYSTEM_PROMPT}

Alert payload:
${JSON.stringify(input.alert, null, 2)}

Triage results:
${JSON.stringify(input.dependencyResults['triage']?.data ?? {}, null, 2)}

Service dependency graph for ${service}:
${JSON.stringify(deps, null, 2)}

Full service graph (for transitive impact analysis):
${JSON.stringify(SERVICE_GRAPH, null, 2)}`

  const result = await agentModel.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    agentName: 'blast-radius',
    success: true,
    confidenceScore: parsed.confidenceScore ?? 0.8,
    data: {
      upstreamCallers: parsed.upstreamCallers,
      downstreamDeps: parsed.downstreamDeps,
      estimatedUsersAffected: parsed.estimatedUsersAffected,
      featuresDown: parsed.featuresDown,
      complianceFlag: parsed.complianceFlag,
    },
    reasoning: parsed.reasoning,
    needsHumanReview: (parsed.confidenceScore ?? 0.8) < 0.6,
  }
}
