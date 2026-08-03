import { useState } from 'react'
import { Check, Download, ExternalLink, Link2 } from 'lucide-react'
import type { DocItem } from '../lib/types'
import { pdfUrl, pdfDownloadUrl, docShareUrl } from '../lib/pdf'
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
 * Actions d'un document : « Ouvrir » (nouvel onglet), « Télécharger » et
 * « Copier le lien » (lien unique et partageable du document).
 * Le PDF n'est résolu/chargé qu'au clic (aucun préchargement).
 */
export default function DocActions({ doc, size = 'sm', variant = 'default', showOpen = true }: Props) {
  const url = pdfUrl(doc)
  const dl = pdfDownloadUrl(doc)
  const [copied, setCopied] = useState(false)

  const onOpen = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    logAction('Ouverture', doc.name)
  }
  const onDownload = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    logAction('Téléchargement', doc.name)
  }
  async function onCopy(e: { preventDefault: () => void; stopPropagation: () => void }) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(docShareUrl(doc))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* presse-papier indisponible : on ignore */
    }
  }

  if (variant === 'compact') {
    const iconBtn =
      'inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white'
    return (
      <div className="flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onOpen}
          aria-label={`Ouvrir le PDF : ${doc.name}`}
          title="Ouvrir"
          className={iconBtn}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={dl}
          onClick={onDownload}
          aria-label={`Télécharger le PDF : ${doc.name}`}
          title="Télécharger"
          className={iconBtn}
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copier le lien : ${doc.name}`}
          title={copied ? 'Lien copié' : 'Copier le lien'}
          className={iconBtn}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </button>
      </div>
    )
  }

  const pad = size === 'md' ? 'px-3.5 py-2 text-sm' : 'px-3 py-1.5 text-xs'
  const outline = `inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${pad}`
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
        className={outline}
      >
        <Download className="h-4 w-4" />
        Télécharger
      </a>
      <button type="button" onClick={onCopy} aria-label={`Copier le lien : ${doc.name}`} className={outline}>
        {copied ? (
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        {copied ? 'Lien copié' : 'Copier le lien'}
      </button>
    </div>
  )
}
