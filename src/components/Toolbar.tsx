import type { ReactNode } from 'react'
import type { ViewMode } from '../lib/types'

interface Props {
  count: number
  total: number
  view: ViewMode
  onView: (mode: ViewMode) => void
  /** Action optionnelle affichée à côté du compteur (ex. « Tout télécharger »). */
  leadingAction?: ReactNode
}

export default function Toolbar({ count, total, view, onView, leadingAction }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-gray-600" aria-live="polite">
          <span className="font-semibold text-gray-900">{count}</span> document
          {count > 1 ? 's' : ''} sur {total}
        </p>
        {leadingAction}
      </div>

      <div
        className="inline-flex self-start overflow-hidden rounded-lg border border-gray-300"
        role="group"
        aria-label="Mode d'affichage"
      >
        <button
          type="button"
          onClick={() => onView('cards')}
          aria-pressed={view === 'cards'}
          className={`px-3 py-1.5 text-sm font-medium transition ${
            view === 'cards' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Cartes
        </button>
        <button
          type="button"
          onClick={() => onView('table')}
          aria-pressed={view === 'table'}
          className={`border-l border-gray-300 px-3 py-1.5 text-sm font-medium transition ${
            view === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Tableau
        </button>
      </div>
    </div>
  )
}
