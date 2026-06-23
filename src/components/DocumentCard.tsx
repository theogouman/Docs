import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import Badge from './Badge'
import DocActions from './DocActions'

interface Props {
  doc: DocItem
  onOpenDetail: (doc: DocItem) => void
  /** Rang dans la grille — décale légèrement l'apparition (effet stagger). */
  index?: number
}

export default function DocumentCard({ doc, onOpenDetail, index = 0 }: Props) {
  return (
    <article
      className="t-reveal flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge type={doc.type} />
        {doc.date && (
          <time className="shrink-0 text-xs text-gray-400" dateTime={doc.date}>
            {formatDate(doc.date)}
          </time>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-gray-900">
        <button
          type="button"
          onClick={() => onOpenDetail(doc)}
          className="text-left hover:text-blue-700"
        >
          {doc.name}
        </button>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">{doc.summary}</p>

      <button
        type="button"
        onClick={() => onOpenDetail(doc)}
        className="mt-1 self-start text-sm font-medium text-blue-700 hover:underline"
      >
        Voir plus
      </button>

      <div className="mt-4 flex-1" />
      <div className="pt-1">
        <DocActions doc={doc} />
      </div>
    </article>
  )
}
