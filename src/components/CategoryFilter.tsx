import { useEffect, useRef, useState } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'
import { colorStyle, type Category } from '../lib/types'

interface Props {
  categories: (Category & { count: number })[]
  selected: Set<string>
  onToggle: (type: string) => void
  onClear: () => void
}

/**
 * Filtre de catégories « in-app » : bouton carré dans la barre de recherche
 * qui se métamorphose en panneau déroulant (animation « Plus to menu morph »
 * de transitions.dev). Remplace la liste de pastilles cliquables pour une page
 * plus compacte.
 */
export default function CategoryFilter({ categories, selected, onToggle, onClear }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  if (categories.length === 0) return null

  const activeCount = selected.size

  // Empreinte fermée (48×48). Le morph est ancré en haut à droite et grandit
  // vers le bas / la gauche en surimpression (z-30), sans pousser la mise en page.
  return (
    <div ref={ref} className="relative z-30 h-12 w-12 shrink-0">
      {/* Indicateur de filtres actifs (visible bouton fermé), hors du morph
          qui masque son débordement. */}
      {activeCount > 0 && !open && (
        <span
          className="pointer-events-none absolute -right-1 -top-1 z-40 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gray-900 px-1 text-[11px] font-semibold text-white ring-2 ring-slate-100 dark:bg-gray-100 dark:text-gray-900 dark:ring-gray-900"
          aria-hidden="true"
        >
          {activeCount}
        </span>
      )}

      <div
        className="t-morph t-morph-filter absolute right-0 top-0 border border-gray-300 bg-white shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10"
        data-open={open}
      >
        <div className="t-morph-menu flex flex-col">
          <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Catégories
            </span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="rounded text-xs font-medium text-gray-500 underline-offset-2 transition hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
            {categories.map((cat) => {
              const isOn = selected.has(cat.name)
              const dot = colorStyle(cat.color).dot
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => onToggle(cat.name)}
                  aria-pressed={isOn}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition ${
                    isOn
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                  <Check
                    className={`h-4 w-4 shrink-0 transition ${
                      isOn ? 'text-gray-900 opacity-100 dark:text-gray-100' : 'opacity-0'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="inline-flex h-5 min-w-[1.4rem] shrink-0 items-center justify-center rounded-md bg-white px-1.5 text-[11px] font-semibold tabular-nums text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-white/10">
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Filtrer par catégorie"
          title="Filtrer par catégorie"
          className="t-morph-plus text-gray-700 dark:text-gray-200"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
