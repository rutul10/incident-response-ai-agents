import { prisma } from './prisma'
import { dispatch } from './dispatcher'
import {
  MockAlert,
  Task,
  TaskType,
  AgentOutput,
  PipelineRun,
  TriageOutput,
  PostmortemOutput,
} from './types'

const TASK_GRAPH: { type: TaskType; dependsOn: TaskType[] }[] = [
  { type: 'triage', dependsOn: [] },
  { type: 'investigator', dependsOn: ['triage'] },
  { type: 'blast-radius', dependsOn: ['triage'] },
  { type: 'remediation', dependsOn: ['investigator', 'blast-radius'] },
  { type: 'postmortem', dependsOn: ['remediation'] },
]

function toJson<T>(value: T) {
  return JSON.parse(JSON.stringify(value))
}

export async function runPipeline(alert: MockAlert): Promise<PipelineRun> {
  const pipelineStart = Date.now()

  const incident = await prisma.incident.create({
    data: {
      scenarioId: alert.scenarioId,
      alertPayload: toJson(alert),
      service: alert.service,
      status: 'running',
    },
  })

  const tasks: Task[] = TASK_GRAPH.map((t) => ({
    id: `${incident.id}-${t.type}`,
    type: t.type,
    dependsOn: t.dependsOn.map((dep) => `${incident.id}-${dep}`),
    status: 'pending' as const,
  }))

  for (const task of tasks) {
    await prisma.incidentTask.create({
      data: {
        id: task.id,
        incidentId: incident.id,
        type: task.type,
        dependsOn: task.dependsOn,
        status: 'pending',
        assignedAgent: task.type,
      },
    })
  }

  const results: Record<string, AgentOutput> = {}

  while (true) {
    const unblocked = tasks.filter(
      (t) =>
        t.status === 'pending' &&
        t.dependsOn.every((depId) => {
          const depTask = tasks.find((dt) => dt.id === depId)
          return depTask?.status === 'completed'
        })
    )

    if (unblocked.length === 0) break

    for (const task of unblocked) {
      task.status = 'running'
      await prisma.incidentTask.update({
        where: { id: task.id },
        data: { status: 'running', startedAt: new Date() },
      })
    }

    const execResults = await Promise.all(
      unblocked.map(async (task) => {
        try {
          const output = await dispatch(task.type, alert, results)
          return { task, output, error: null }
        } catch (error) {
          return { task, output: null, error }
        }
      })
    )

    for (const { task, output, error } of execResults) {
      if (error || !output) {
        task.status = 'failed'
        await prisma.incidentTask.update({
          where: { id: task.id },
          data: { status: 'failed', completedAt: new Date() },
        })
        await prisma.incident.update({
          where: { id: incident.id },
          data: { status: 'failed' },
        })
        return {
          incidentId: incident.id,
          status: 'failed',
          tasks,
          totalDurationMs: Date.now() - pipelineStart,
        }
      }

      task.status = 'completed'
      task.result = output
      results[task.type] = output

      await prisma.incidentTask.update({
        where: { id: task.id },
        data: { status: 'completed', completedAt: new Date() },
      })

      await prisma.agentResult.create({
        data: {
          taskId: task.id,
          agentName: output.agentName,
          input: toJson({ alert, dependencyResults: Object.keys(results) }),
          output: toJson(output),
          confidenceScore: output.confidenceScore,
          durationMs: Date.now() - pipelineStart,
        },
      })

      if (task.type === 'triage') {
        const triageData = (output as TriageOutput).data
        await prisma.incident.update({
          where: { id: incident.id },
          data: { severity: triageData.severity, service: triageData.affectedService },
        })

        if (!triageData.proceedWithPipeline) {
          await prisma.incident.update({
            where: { id: incident.id },
            data: { status: 'stopped-at-triage' },
          })
          return {
            incidentId: incident.id,
            status: 'stopped-at-triage',
            tasks,
            totalDurationMs: Date.now() - pipelineStart,
          }
        }
      }
    }
  }

  const postmortemResult = results['postmortem'] as PostmortemOutput
  const triageResult = results['triage'] as TriageOutput

  if (postmortemResult) {
    const lowestConfidence = Math.min(
      ...Object.values(results).map((r) => r.confidenceScore)
    )

    await prisma.postmortem.create({
      data: {
        incidentId: incident.id,
        severity: triageResult.data.severity,
        affectedService: triageResult.data.affectedService,
        timeline: toJson(postmortemResult.data.sections.timeline),
        rootCause: postmortemResult.data.sections.rootCause,
        blastRadius: toJson(results['blast-radius']?.data ?? {}),
        remediationSteps: toJson(results['remediation']?.data ?? {}),
        lessonsLearned: postmortemResult.data.sections.lessonsLearned,
        actionItems: toJson(postmortemResult.data.sections.actionItems),
        draft: postmortemResult.data.markdown,
        status: lowestConfidence < 0.6 ? 'needs-review' : 'draft',
      },
    })
  }

  await prisma.incident.update({
    where: { id: incident.id },
    data: { status: 'completed' },
  })

  return {
    incidentId: incident.id,
    status: 'completed',
    tasks,
    postmortem: postmortemResult,
    totalDurationMs: Date.now() - pipelineStart,
  }
}
