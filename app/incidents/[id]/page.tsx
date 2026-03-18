import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IncidentDetail({ params }: PageProps) {
  const { id } = await params

  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { result: true },
        orderBy: { id: 'asc' },
      },
      postmortem: true,
    },
  })

  if (!incident) return notFound()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
              &larr; Back
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {incident.scenarioId}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {incident.severity && (
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                incident.severity === 'SEV1' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                incident.severity === 'SEV2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {incident.severity}
              </span>
            )}
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              incident.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              incident.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
              'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}>
              {incident.status}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Agent Tasks */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Agent Trace</h2>
          <div className="mt-4 space-y-3">
            {incident.tasks.map((task) => (
              <div key={task.id} className="rounded-md border border-zinc-100 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'failed' ? 'bg-red-500' :
                      'bg-zinc-300 dark:bg-zinc-600'
                    }`} />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {task.assignedAgent}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {task.result && (
                      <span className={`text-xs font-medium ${
                        (task.result.confidenceScore ?? 0) >= 0.8 ? 'text-green-600 dark:text-green-400' :
                        (task.result.confidenceScore ?? 0) >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {((task.result.confidenceScore ?? 0) * 100).toFixed(0)}% confidence
                      </span>
                    )}
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      task.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
                {task.result && (
                  <pre className="mt-3 max-h-48 overflow-auto rounded bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
                    {JSON.stringify(task.result.output, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Postmortem */}
        {incident.postmortem && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Postmortem</h2>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                incident.postmortem.status === 'needs-review'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {incident.postmortem.status}
              </span>
            </div>
            <div className="mt-4 whitespace-pre-wrap rounded-md bg-zinc-50 p-4 font-mono text-sm text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-200">
              {incident.postmortem.draft}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
