import { TYPE_ORDER, TYPE_STYLES, type DocType } from '../lib/types'

interface Props {
  counts: Record<DocType, number>
  selected: Set<DocType>
  onToggle: (type: DocType) => void
  onClear: () => void
}

export default function TypeFilters({ counts, selected, onToggle, onClear }: Props) {
  return (
    <div
      className="no-scrollbar -mx-4 flex items-center gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0"
      role="group"
      aria-label="Filtrer par type"
    >
      {TYPE_ORDER.map((type) => {
        const isOn = selected.has(type)
        const style = TYPE_STYLES[type]
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            aria-pressed={isOn}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-[0.97] ${
              isOn
                ? 'border-gray-900 bg-gray-900 text-white shadow dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOn ? 'bg-white dark:bg-gray-900' : style.dot
              }`}
              aria-hidden="true"
            />
            {type}
            <span
              className={`inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                isOn
                  ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {counts[type]}
            </span>
          </button>
        )
      })}
      {selected.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-gray-500 underline-offset-2 transition hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
        >
          Tout effacer
        </button>
      )}
    </div>
  )
}
