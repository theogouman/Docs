import { Download, ExternalLink } from 'lucide-react'
import type { DocItem } from '../lib/types'
import { pdfUrl, pdfDownloadUrl } from '../lib/pdf'
import { logAction } from '../lib/log'

interface Props {
  doc: DocItem
  size?: 'sm' | 'md'
  /** « compact » = boutons icône seule (vue Tableau, plus épuré). */
  variant?: 'default' | 'compact'
  /** Affiche le bouton « Ouvrir » (masqué sur les cartes, qui ouvrent déjà l'aperçu). */
  showOpen?: boolean
}

/**
 * Boutons « Ouvrir » (nouvel onglet) et « Télécharger ».
 * Le PDF n'est résolu/chargé qu'au clic (aucun préchargement).
 */
export default function DocActions({ doc, size = 'sm', variant = 'default', showOpen = true }: Props) {
  const url = pdfUrl(doc)
  const dl = pdfDownloadUrl(doc)

  const onOpen = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    logAction('Ouverture', doc.name)
  }
  const onDownload = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    logAction('Téléchargement', doc.name)
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          aria-label={`Ouvrir le PDF : ${doc.name}`}
          title="Ouvrir"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={dl}
          onClick={onDownload}
          aria-label={`Télécharger le PDF : ${doc.name}`}
          title="Télécharger"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    )
  }

  const pad = size === 'md' ? 'px-3.5 py-2 text-sm' : 'px-3 py-1.5 text-xs'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showOpen && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          aria-label={`Ouvrir le PDF : ${doc.name}`}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-gray-700 font-medium text-white transition hover:bg-gray-600 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100 ${pad}`}
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir
        </a>
      )}
      <a
        href={dl}
        onClick={onDownload}
        aria-label={`Télécharger le PDF : ${doc.name}`}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${pad}`}
      >
        <Download className="h-4 w-4" />
        Télécharger
      </a>
    </div>
  )
}
