import { useEffect, useRef, useState } from 'react'
import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import { pdfUrl } from '../lib/pdf'
import Badge from './Badge'
import DocActions from './DocActions'

interface Props {
  doc: DocItem | null
  onClose: () => void
}

/**
 * Vue détail en aperçu centré (modal), avec animations d'ouverture /
 * fermeture (scale + opacité, reprises de transitions.dev).
 */
export default function DetailPanel({ doc, onClose }: Props) {
  const [current, setCurrent] = useState<DocItem | null>(doc)
  const [open, setOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>()

  // Pilote l'apparition / disparition pour jouer les transitions.
  useEffect(() => {
    if (doc) {
      if (closeTimer.current) clearTimeout(closeTimer.current)
      setCurrent(doc)
      setShowPreview(false)
      const id = requestAnimationFrame(() => setOpen(true))
      return () => cancelAnimationFrame(id)
    }
    setOpen(false)
    closeTimer.current = setTimeout(() => setCurrent(null), 220)
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [doc])

  // Échap pour fermer + verrouillage du défilement de fond.
  useEffect(() => {
    if (!current) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [current, onClose])

  if (!current) return null
  const state = open ? 'is-open' : 'is-closing'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
    >
      <div
        className={`absolute inset-0 bg-gray-900/50 backdrop-blur-[1px] t-overlay ${state}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl t-modal ${state}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div>
            <Badge type={current.type} />
            <h2 id="detail-title" className="mt-3 text-lg font-semibold leading-snug text-gray-900">
              {current.name}
            </h2>
            {current.date && (
              <time className="mt-1 block text-sm text-gray-500" dateTime={current.date}>
                {formatDate(current.date)}
              </time>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Résumé</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{current.summary}</p>

          <div className="mt-5">
            {showPreview ? (
              <iframe
                src={pdfUrl(current)}
                title={`Aperçu : ${current.name}`}
                className="h-[28rem] w-full rounded-lg border border-gray-200"
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
          <DocActions doc={current} size="md" />
        </div>
      </div>
    </div>
  )
}
