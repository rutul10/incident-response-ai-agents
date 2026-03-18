'use client'

import { useState, useEffect } from 'react'
import TriggerPanel from '@/components/TriggerPanel'
import PipelineTrace from '@/components/PipelineTrace'
import PostmortemViewer from '@/components/PostmortemViewer'
import Link from 'next/link'

interface PipelineResult {
  incidentId: string
  status: string
  tasks: Array<{
    id: string
    type: string
    status: string
    result?: {
      agentName: string
      confidenceScore: number
      durationMs?: number
      reasoning?: string
    }
  }>
  postmortem?: {
    data: {
      markdown: string
    }
    confidenceScore: number
  }
  totalDurationMs: number
}

interface IncidentSummary {
  id: string
  scenarioId: string
  severity: string | null
  service: string | null
  status: string
  createdAt: string
}

export default function Dashboard() {
  const [latestRun, setLatestRun] = useState<PipelineResult | null>(null)
  const [incidents, setIncidents] = useState<IncidentSummary[]>([])

  useEffect(() => {
    fetch('/api/incidents')
      .then((res) => res.json())
      .then(setIncidents)
      .catch(console.error)
  }, [])

  function handleRunComplete(result: Record<string, unknown>) {
    setLatestRun(result as unknown as PipelineResult)
    // Refresh incident list
    fetch('/api/incidents')
      .then((res) => res.json())
      .then(setIncidents)
      .catch(console.error)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Incident Response Pipeline
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">P5 — Multi-Agent Orchestration</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TriggerPanel onRunComplete={handleRunComplete} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {latestRun && (
              <>
                <PipelineTrace
                  tasks={latestRun.tasks}
                  status={latestRun.status}
                  totalDurationMs={latestRun.totalDurationMs}
                />
                {latestRun.postmortem && (
                  <PostmortemViewer
                    markdown={latestRun.postmortem.data.markdown}
                    status={
                      latestRun.postmortem.confidenceScore < 0.6
                        ? 'needs-review'
                        : 'draft'
                    }
                  />
                )}
              </>
            )}

            {!latestRun && (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Select a scenario and run the pipeline to see results here.
                </p>
              </div>
            )}
          </div>
        </div>

        {incidents.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Past Incidents
            </h2>
            <div className="mt-4 space-y-2">
              {incidents.map((inc) => (
                <Link
                  key={inc.id}
                  href={`/incidents/${inc.id}`}
                  className="flex items-center justify-between rounded-md border border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {inc.scenarioId}
                    </span>
                    {inc.severity && (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        inc.severity === 'SEV1' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        inc.severity === 'SEV2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {inc.severity}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(inc.createdAt).toLocaleString()}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      inc.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      inc.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
