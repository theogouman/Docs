import type { ReactNode } from 'react'
import type { SortMode, ViewMode } from '../lib/types'

interface Props {
  count: number
  total: number
  sort: SortMode
  onSort: (mode: SortMode) => void
  view: ViewMode
  onView: (mode: ViewMode) => void
  /** Action optionnelle affichée à côté du compteur (ex. « Tout télécharger »). */
  leadingAction?: ReactNode
}

export default function Toolbar({ count, total, sort, onSort, view, onView, leadingAction }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-gray-600" aria-live="polite">
          <span className="font-semibold text-gray-900">{count}</span> document
          {count > 1 ? 's' : ''} sur {total}
        </p>
        {leadingAction}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span>Trier&nbsp;:</span>
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortMode)}
            aria-label="Trier les documents"
            className="rounded-lg border border-gray-300 bg-white py-1.5 pl-2 pr-7 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="type">Par type</option>
            <option value="name">Par nom (A → Z)</option>
          </select>
        </label>

        <div
          className="inline-flex overflow-hidden rounded-lg border border-gray-300"
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
    </div>
  )
}
