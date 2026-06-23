import { TYPE_ORDER, TYPE_STYLES, type DocType } from '../lib/types'

interface Props {
  counts: Record<DocType, number>
  selected: Set<DocType>
  onToggle: (type: DocType) => void
  onClear: () => void
}

export default function TypeFilters({ counts, selected, onToggle, onClear }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par type">
      {TYPE_ORDER.map((type) => {
        const isOn = selected.has(type)
        const style = TYPE_STYLES[type]
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            aria-pressed={isOn}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              isOn
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isOn ? 'bg-white' : style.dot}`}
              aria-hidden="true"
            />
            {type}
            <span className={isOn ? 'text-gray-300' : 'text-gray-400'}>{counts[type]}</span>
          </button>
        )
      })}
      {selected.size > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline"
        >
          Tout effacer
        </button>
      )}
    </div>
  )
}
