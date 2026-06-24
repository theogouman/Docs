import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import { useModalState } from '../lib/useModalState'
import Badge from './Badge'
import DocActions from './DocActions'
import PdfView from './PdfView'

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
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
    >
      <div
        className={`absolute inset-0 bg-gray-900/50 backdrop-blur-[1px] t-overlay ${state}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centrage dans la zone réellement visible (100svh) pour des marges
          haut/bas régulières sur mobile. Un clic sur cette zone (en dehors de
          la carte) referme le document. */}
      <div
        className="absolute inset-x-0 top-0 flex h-[100svh] items-center justify-center p-3 sm:p-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          className={`relative z-10 flex h-[85svh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl t-modal ${state} dark:bg-gray-900 dark:ring-1 dark:ring-white/10 md:h-[90svh] md:flex-row`}
        >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 z-20 rounded-lg bg-white/90 p-1.5 text-gray-500 shadow-sm transition hover:bg-white hover:text-gray-800 dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Colonne gauche : détail. En-tête (badge, titre, date) et bouton de
            téléchargement restent toujours visibles ; seule la description
            défile si elle est trop longue, pour que tout tienne dans l'encadré
            sans en changer la taille. */}
        <div className="flex max-h-[40vh] w-full shrink-0 flex-col overflow-hidden border-b border-gray-200 p-5 dark:border-gray-800 md:max-h-none md:w-80 md:overflow-y-auto md:border-b-0 md:border-r lg:w-96">
          <div className="shrink-0">
            <Badge type={current.type} />
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
          </div>

          <p className="no-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-300 md:flex-none md:overflow-visible">
            {current.summary}
          </p>

          <div className="mt-4 shrink-0 pt-1 md:mt-6">
            <DocActions doc={current} size="md" />
          </div>
        </div>

        {/* Colonne droite : PDF rendu par pdf.js (calé sur la largeur) */}
        <div className="relative min-h-0 flex-1 bg-gray-100 dark:bg-gray-950">
          <PdfView doc={current} />
        </div>
        </div>
      </div>
    </div>
  )
}
