import { TaskType, AgentInput, AgentOutput, MockAlert } from './types'
import { triageAgent } from './agents/triage'
import { investigatorAgent } from './agents/investigator'
import { blastRadiusAgent } from './agents/blast-radius'
import { remediationAgent } from './agents/remediation'
import { postmortemAgent } from './agents/postmortem'

const AGENT_MAP: Record<TaskType, (input: AgentInput) => Promise<AgentOutput>> = {
  triage: triageAgent,
  investigator: investigatorAgent,
  'blast-radius': blastRadiusAgent,
  remediation: remediationAgent,
  postmortem: postmortemAgent,
}

export async function dispatch(
  taskType: TaskType,
  alert: MockAlert,
  dependencyResults: Record<string, AgentOutput>
): Promise<AgentOutput> {
  const agent = AGENT_MAP[taskType]
  if (!agent) {
    throw new Error(`No agent registered for task type: ${taskType}`)
  }

  const input: AgentInput = { alert, dependencyResults }
  return agent(input)
}
