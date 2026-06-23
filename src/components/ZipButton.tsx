import { useState, type MouseEvent } from 'react'
import { Download, LoaderCircle } from 'lucide-react'
import type { DocItem } from '../lib/types'
import { downloadDocsAsZip } from '../lib/download'

interface Props {
  docs: DocItem[]
  zipName: string
  label: string
  busyLabel?: string
  className?: string
  size?: 'sm' | 'md'
  /** Range les PDF dans des sous-dossiers par catégorie. */
  foldersByType?: boolean
  /** Masque le libellé sur mobile (icône seule) pour gagner de la place. */
  responsiveLabel?: boolean
}

/** Bouton de téléchargement ZIP (un lot de PDF), avec état de progression. */
export default function ZipButton({
  docs,
  zipName,
  label,
  busyLabel = 'Préparation',
  className = '',
  size = 'sm',
  foldersByType = false,
  responsiveLabel = false,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState(false)

  async function handle(e: MouseEvent) {
    e.stopPropagation()
    if (busy || docs.length === 0) return
    setBusy(true)
    setError(false)
    setProgress({ done: 0, total: docs.length })
    try {
      await downloadDocsAsZip(docs, zipName, {
        foldersByType,
        onProgress: (done, total) => setProgress({ done, total }),
      })
    } catch {
      setError(true)
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const pad = size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
  const labelClass = responsiveLabel ? 'hidden sm:inline' : ''

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy || docs.length === 0}
      aria-label={`${label} (${docs.length})`}
      title={label}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${pad} ${className}`}
    >
      {busy ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          <span>{progress ? `${busyLabel} ${progress.done}/${progress.total}` : `${busyLabel}…`}</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span className={labelClass}>{error ? 'Réessayer' : label}</span>
        </>
      )}
    </button>
  )
}
