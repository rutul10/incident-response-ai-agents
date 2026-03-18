'use client'

import { useState } from 'react'

interface PostmortemViewerProps {
  markdown: string
  status: string
}

export default function PostmortemViewer({ markdown, status }: PostmortemViewerProps) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(markdown)

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Postmortem Draft
        </h2>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === 'needs-review'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {status}
          </span>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {editing ? 'Preview' : 'Edit'}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-96 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap rounded-md bg-zinc-50 p-4 font-mono text-sm dark:bg-zinc-800/50">
            {content}
          </div>
        )}
      </div>
    </div>
  )
}
