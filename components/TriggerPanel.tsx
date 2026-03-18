'use client'

import { useState } from 'react'

const SCENARIOS = [
  { id: 'checkout-db-pool', label: 'Checkout DB Pool Exhaustion', severity: 'critical' },
  { id: 'auth-latency', label: 'Auth Service Latency Spike', severity: 'warning' },
  { id: 'noise-alert', label: 'Background Worker Pod Restart', severity: 'info' },
]

interface TriggerPanelProps {
  onRunComplete: (result: Record<string, unknown>) => void
}

export default function TriggerPanel({ onRunComplete }: TriggerPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setRunning(true)
    setError(null)

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenario }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Pipeline failed')
      }

      const result = await res.json()
      onRunComplete(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRunning(false)
    }
  }

  const selected = SCENARIOS.find((s) => s.id === selectedScenario)!

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Trigger Incident
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Select a scenario and run the AI agent pipeline.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Scenario
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={running}
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              selected.severity === 'critical'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : selected.severity === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {selected.severity}
          </span>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Running pipeline...' : 'Run Pipeline'}
        </button>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  )
}
