'use client'

interface TaskResult {
  id: string
  type: string
  status: string
  result?: {
    agentName: string
    confidenceScore: number
    durationMs?: number
    reasoning?: string
  }
}

interface PipelineTraceProps {
  tasks: TaskResult[]
  status: string
  totalDurationMs: number
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const AGENT_LABELS: Record<string, string> = {
  triage: 'Triage',
  investigator: 'Investigator',
  'blast-radius': 'Blast Radius',
  remediation: 'Remediation',
  postmortem: 'Postmortem',
}

export default function PipelineTrace({ tasks, status, totalDurationMs }: PipelineTraceProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Pipeline Trace
        </h2>
        <div className="flex items-center gap-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
            {status}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {(totalDurationMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-md border border-zinc-100 px-4 py-3 dark:border-zinc-800"
          >
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-2 w-2 rounded-full ${
                task.status === 'completed' ? 'bg-green-500' :
                task.status === 'running' ? 'bg-blue-500 animate-pulse' :
                task.status === 'failed' ? 'bg-red-500' :
                'bg-zinc-300 dark:bg-zinc-600'
              }`} />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {AGENT_LABELS[task.type] || task.type}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {task.result && (
                <>
                  <span className={`text-xs font-medium ${
                    task.result.confidenceScore >= 0.8 ? 'text-green-600 dark:text-green-400' :
                    task.result.confidenceScore >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {(task.result.confidenceScore * 100).toFixed(0)}% confidence
                  </span>
                </>
              )}
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] || STATUS_STYLES.pending}`}>
                {task.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
