import { useState } from 'react'
import type { DocItem } from '../lib/types'
import { downloadDocsAsZip } from '../lib/download'

interface Props {
  docs: DocItem[]
  zipName: string
  label: string
  busyLabel?: string
  className?: string
  size?: 'sm' | 'md'
}

/** Bouton de téléchargement ZIP (un lot de PDF), avec état de progression. */
export default function ZipButton({
  docs,
  zipName,
  label,
  busyLabel = 'Préparation',
  className = '',
  size = 'sm',
}: Props) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState(false)

  async function handle() {
    if (busy || docs.length === 0) return
    setBusy(true)
    setError(false)
    setProgress({ done: 0, total: docs.length })
    try {
      await downloadDocsAsZip(docs, zipName, (done, total) => setProgress({ done, total }))
    } catch {
      setError(true)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const pad = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy || docs.length === 0}
      aria-label={`${label} (${docs.length})`}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${pad} ${className}`}
    >
      {busy ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
          </svg>
          {progress ? `${busyLabel} ${progress.done}/${progress.total}` : `${busyLabel}…`}
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 2a1 1 0 0 1 1 1v7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 10.586V3a1 1 0 0 1 1-1Z" />
            <path d="M4 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z" />
          </svg>
          {error ? 'Réessayer' : label}
        </>
      )}
    </button>
  )
}
