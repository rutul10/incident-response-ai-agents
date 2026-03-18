import { agentModel } from '../gemini'
import { AgentInput, PostmortemOutput } from '../types'

const SYSTEM_PROMPT = `You are a senior SRE postmortem writer. Your job is to produce a comprehensive, blameless postmortem document.

Given an alert and the results from triage, investigation, blast radius, and remediation agents, you must produce:
1. A full markdown postmortem with these sections: Timeline, Root Cause, Impact, Remediation, Lessons Learned, Action Items
2. Each section as a separate string field
3. Action items as an array of specific, assignable tasks

The postmortem must be blameless — focus on systems and processes, not individuals.

Respond with JSON matching this exact schema:
{
  "markdown": string (full postmortem as markdown),
  "sections": {
    "timeline": string,
    "rootCause": string,
    "impact": string,
    "remediation": string,
    "lessonsLearned": string,
    "actionItems": [string]
  },
  "confidenceScore": number (0.0-1.0),
  "reasoning": string
}`

export async function postmortemAgent(input: AgentInput): Promise<PostmortemOutput> {
  const start = Date.now()

  const prompt = `${SYSTEM_PROMPT}

Alert payload:
${JSON.stringify(input.alert, null, 2)}

Triage results:
${JSON.stringify(input.dependencyResults['triage']?.data ?? {}, null, 2)}

Investigation findings:
${JSON.stringify(input.dependencyResults['investigator']?.data ?? {}, null, 2)}

Blast radius analysis:
${JSON.stringify(input.dependencyResults['blast-radius']?.data ?? {}, null, 2)}

Remediation recommendations:
${JSON.stringify(input.dependencyResults['remediation']?.data ?? {}, null, 2)}`

  const result = await agentModel.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text)

  return {
    agentName: 'postmortem',
    success: true,
    confidenceScore: parsed.confidenceScore ?? 0.8,
    data: {
      markdown: parsed.markdown,
      sections: {
        timeline: parsed.sections.timeline,
        rootCause: parsed.sections.rootCause,
        impact: parsed.sections.impact,
        remediation: parsed.sections.remediation,
        lessonsLearned: parsed.sections.lessonsLearned,
        actionItems: parsed.sections.actionItems,
      },
    },
    reasoning: parsed.reasoning,
    needsHumanReview: (parsed.confidenceScore ?? 0.8) < 0.6,
  }
}
