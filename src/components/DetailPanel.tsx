import { useEffect, useState } from 'react'
import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import { pdfUrl } from '../lib/pdf'
import Badge from './Badge'
import DocActions from './DocActions'

interface Props {
  doc: DocItem | null
  onClose: () => void
}

export default function DetailPanel({ doc, onClose }: Props) {
  const [showPreview, setShowPreview] = useState(false)

  // Réinitialise l'aperçu quand on change de document (pas de préchargement).
  useEffect(() => {
    setShowPreview(false)
  }, [doc?.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (doc) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [doc, onClose])

  if (!doc) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div
        className="absolute inset-0 bg-gray-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div>
            <Badge type={doc.type} />
            <h2 id="detail-title" className="mt-3 text-lg font-semibold leading-snug text-gray-900">
              {doc.name}
            </h2>
            {doc.date && (
              <time className="mt-1 block text-sm text-gray-500" dateTime={doc.date}>
                {formatDate(doc.date)}
              </time>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Résumé</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{doc.summary}</p>

          {doc.attention && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Point d'attention
              </h3>
              <p className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
                <span>{doc.attention}</span>
              </p>
            </div>
          )}

          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Fichier</h3>
            <p className="mt-2 break-all font-mono text-xs text-gray-500">{doc.file}</p>
          </div>

          <div className="mt-5">
            {showPreview ? (
              <iframe
                src={pdfUrl(doc.file)}
                title={`Aperçu : ${doc.name}`}
                className="h-96 w-full rounded-lg border border-gray-200"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="w-full rounded-lg border border-dashed border-gray-300 py-6 text-sm text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
              >
                Afficher l'aperçu du PDF
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 p-5">
          <DocActions doc={doc} size="md" />
        </div>
      </aside>
    </div>
  )
}
