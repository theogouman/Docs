import { useState } from 'react'
import { TYPE_STYLES, type DocItem, type DocType } from '../lib/types'
import DocumentCard from './DocumentCard'
import ZipButton from './ZipButton'

interface Props {
  type: DocType
  docs: DocItem[]
  zipName: string
  defaultOpen?: boolean
  onOpenDetail: (doc: DocItem) => void
}

/**
 * Catégorie repliable (toggle) dans un encadré « glassmorphism ».
 * Ouverture / fermeture animée en douceur via l'astuce grid-rows 0fr↔1fr
 * (hauteur auto fluide) + fondu, easing repris de transitions.dev.
 */
export default function CategorySection({
  type,
  docs,
  zipName,
  defaultOpen = true,
  onOpenDetail,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const style = TYPE_STYLES[type]
  const panelId = `cat-${type}`

  return (
    <section className="overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-lg shadow-gray-900/5 ring-1 ring-black/5 backdrop-blur-xl transition-shadow duration-300 hover:shadow-xl">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/40 sm:px-5"
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">{type}</span>
          <span className="rounded-full bg-gray-900/5 px-2 py-0.5 text-xs font-semibold text-gray-500">
            {docs.length}
          </span>
          <svg
            className={`ml-auto h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ${
              open ? 'rotate-180' : ''
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </h2>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-white/50 px-4 pb-5 pt-4 sm:px-5">
            <div className="mb-4 flex justify-end">
              <ZipButton
                docs={docs}
                zipName={zipName}
                label="Télécharger la catégorie"
                className="border border-gray-300 bg-white/70 text-gray-600 hover:bg-white"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc, i) => (
                <DocumentCard key={doc.id} doc={doc} index={i} onOpenDetail={onOpenDetail} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
