import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import Badge from './Badge'
import DocActions from './DocActions'

interface Props {
  doc: DocItem
  onOpenDetail: (doc: DocItem) => void
}

export default function DocumentCard({ doc, onOpenDetail }: Props) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md">
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

      {doc.attention && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <span>{doc.attention}</span>
        </p>
      )}

      <div className="mt-4 flex-1" />
      <div className="pt-1">
        <DocActions doc={doc} />
      </div>
    </article>
  )
}
