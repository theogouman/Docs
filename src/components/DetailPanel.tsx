import { useEffect, useState } from 'react'
import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import { pdfUrl } from '../lib/pdf'
import { useModalState } from '../lib/useModalState'
import Badge from './Badge'
import DocActions from './DocActions'

interface Props {
  doc: DocItem | null
  onClose: () => void
}

/**
 * Vue document en deux colonnes : à gauche le détail (titre, date,
 * description, téléchargement), à droite le PDF chargé directement.
 * Sur mobile, les colonnes s'empilent (détail puis PDF).
 */
export default function DetailPanel({ doc, onClose }: Props) {
  const [current, setCurrent] = useState<DocItem | null>(doc)
  useEffect(() => {
    if (doc) setCurrent(doc)
  }, [doc])

  const { mounted, state } = useModalState(!!doc, onClose)
  if (!mounted || !current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
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
        className={`relative z-10 flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl t-modal ${state} dark:bg-gray-900 dark:ring-1 dark:ring-white/10 md:h-[88vh] md:flex-row`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-20 rounded-lg bg-white/90 p-1.5 text-gray-500 shadow-sm transition hover:bg-white hover:text-gray-800 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>

        {/* Colonne gauche : détail */}
        <div className="flex max-h-[40vh] w-full shrink-0 flex-col overflow-y-auto border-b border-gray-200 p-5 dark:border-gray-800 md:max-h-none md:w-80 md:border-b-0 md:border-r lg:w-96">
          <div>
            <Badge type={current.type} />
          </div>
          <h2
            id="detail-title"
            className="mt-3 pr-8 text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100"
          >
            {current.name}
          </h2>
          {current.date && (
            <time className="mt-1 block text-sm text-gray-500 dark:text-gray-400" dateTime={current.date}>
              {formatDate(current.date)}
            </time>
          )}

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Description
          </h3>
          <p className="mt-2 text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-300">
            {current.summary}
          </p>

          <div className="mt-6 pt-1">
            <DocActions doc={current} size="md" />
          </div>
        </div>

        {/* Colonne droite : PDF chargé directement */}
        <div className="relative min-h-0 flex-1 bg-gray-100 dark:bg-gray-950">
          <iframe
            src={pdfUrl(current)}
            title={`Aperçu : ${current.name}`}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  )
}
