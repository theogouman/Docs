import { TYPE_STYLES, type DocItem, type DocType } from '../lib/types'
import DocumentCard from './DocumentCard'
import ZipButton from './ZipButton'

interface Props {
  type: DocType
  docs: DocItem[]
  zipName: string
  open: boolean
  onToggle: () => void
  onOpenDetail: (doc: DocItem) => void
  /** Si false : section non repliable (cas d'une seule catégorie affichée). */
  collapsible?: boolean
}

/**
 * Catégorie dans un encadré « glassmorphism ».
 * - Plusieurs catégories : repliable (toggle) avec animation fluide.
 * - Une seule catégorie : non repliable, documents affichés directement.
 */
export default function CategorySection({
  type,
  docs,
  zipName,
  open,
  onToggle,
  onOpenDetail,
  collapsible = true,
}: Props) {
  const style = TYPE_STYLES[type]
  const panelId = `cat-panel-${type}`
  const expanded = collapsible ? open : true

  const heading = (
    <>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      <span className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
        {type}
      </span>
      <span className="rounded-full bg-gray-900/5 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-400">
        {docs.length}
      </span>
    </>
  )

  return (
    <section
      id={`cat-section-${type}`}
      className="scroll-mt-4 overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-lg shadow-gray-900/5 ring-1 ring-black/5 backdrop-blur-xl transition-shadow duration-300 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20 dark:ring-white/10"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left transition hover:bg-white/50 dark:hover:bg-white/10"
          >
            {heading}
          </button>
        ) : (
          <div className="flex flex-1 items-center gap-3 px-1 py-1">{heading}</div>
        )}

        <ZipButton
          docs={docs}
          zipName={zipName}
          label="Télécharger la catégorie"
          responsiveLabel
          className="border border-gray-300 bg-white/70 text-gray-600 hover:bg-white dark:border-gray-700 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20"
        />

        {collapsible && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? 'Replier la catégorie' : 'Déplier la catégorie'}
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-white/60 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <svg
              className={`h-5 w-5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
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
        )}
      </div>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-white/50 px-4 pb-5 pt-4 dark:border-white/10 sm:px-5">
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
