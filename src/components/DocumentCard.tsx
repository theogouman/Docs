import type { KeyboardEvent } from 'react'
import type { DocItem } from '../lib/types'
import { formatDate } from '../lib/format'
import DocActions from './DocActions'

interface Props {
  doc: DocItem
  onOpenDetail: (doc: DocItem) => void
  /** Rang dans la grille : décale légèrement l'apparition (effet stagger). */
  index?: number
}

export default function DocumentCard({ doc, onOpenDetail, index = 0 }: Props) {
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpenDetail(doc)
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(doc)}
      onKeyDown={onKeyDown}
      className="t-reveal group flex h-full cursor-pointer flex-col rounded-xl border border-white/70 bg-white/80 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      {doc.date && (
        <time className="block text-xs text-gray-400" dateTime={doc.date}>
          {formatDate(doc.date)}
        </time>
      )}

      <h3 className="mt-2 text-base font-semibold leading-snug text-gray-900 dark:text-gray-100">
        {doc.name}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm font-normal leading-relaxed text-gray-600 dark:text-gray-300">
        {doc.summary}
      </p>

      <div className="mt-4 flex-1" />
      <div className="pt-1">
        <DocActions doc={doc} showOpen={false} />
      </div>
    </article>
  )
}
