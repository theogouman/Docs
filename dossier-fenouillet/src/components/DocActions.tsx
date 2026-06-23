import type { DocItem } from '../lib/types'
import { pdfUrl } from '../lib/pdf'

interface Props {
  doc: DocItem
  size?: 'sm' | 'md'
}

/**
 * Boutons « Ouvrir » (nouvel onglet) et « Télécharger ».
 * Liens statiques : le PDF n'est téléchargé qu'au clic (aucun préchargement).
 */
export default function DocActions({ doc, size = 'sm' }: Props) {
  const url = pdfUrl(doc.file)
  const pad = size === 'md' ? 'px-3.5 py-2 text-sm' : 'px-3 py-1.5 text-xs'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Ouvrir le PDF : ${doc.name}`}
        className={`inline-flex items-center gap-1.5 rounded-lg bg-gray-900 font-medium text-white transition hover:bg-gray-700 ${pad}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5Z" />
          <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z" />
        </svg>
        Ouvrir
      </a>
      <a
        href={url}
        download={doc.file}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Télécharger le PDF : ${doc.name}`}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 transition hover:bg-gray-50 ${pad}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 2a1 1 0 0 1 1 1v7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 10.586V3a1 1 0 0 1 1-1Z" />
          <path d="M4 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z" />
        </svg>
        Télécharger
      </a>
    </div>
  )
}
