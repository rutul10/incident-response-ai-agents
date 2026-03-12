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
  dependencyResults: Record<string, AgentOutput>
}

export interface AgentOutput {
  agentName: string
  success: boolean
  confidenceScore: number
  data: Record<string, unknown>
  reasoning?: string
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
  dependsOn: string[]
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
    proceedWithPipeline: boolean
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
