import type { ReactNode } from 'react'
import { LayoutGrid, Table } from 'lucide-react'
import type { ViewMode } from '../lib/types'

interface Props {
  count: number
  /** Total de documents (accepté pour compat. d'appel, plus affiché). */
  total?: number
  view: ViewMode
  onView: (mode: ViewMode) => void
  /** Action optionnelle affichée à côté du compteur (ex. « Tout télécharger »). */
  leadingAction?: ReactNode
}

export default function Toolbar({ count, view, onView, leadingAction }: Props) {
  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
        <p className="whitespace-nowrap text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span> document
          {count > 1 ? 's' : ''}
        </p>
        {leadingAction}
      </div>

      <div
        className="inline-flex shrink-0 self-start overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700"
        role="group"
        aria-label="Mode d'affichage"
      >
        <button
          type="button"
          onClick={() => onView('cards')}
          aria-pressed={view === 'cards'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
            view === 'cards'
              ? 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900'
              : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Cartes
        </button>
        <button
          type="button"
          onClick={() => onView('table')}
          aria-pressed={view === 'table'}
          className={`inline-flex items-center gap-1.5 border-l border-gray-300 px-3 py-1.5 text-sm font-medium transition dark:border-gray-700 ${
            view === 'table'
              ? 'bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900'
              : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <Table className="h-4 w-4" />
          Tableau
        </button>
      </div>
    </div>
  )
}
