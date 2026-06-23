import { useMemo, useState } from 'react'
import rawDocuments from './data/documents.json'
import {
  TYPE_ORDER,
  type DocItem,
  type DocType,
  type SortMode,
  type ViewMode,
} from './lib/types'
import { normalize } from './lib/format'
import PasswordGate from './components/PasswordGate'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TypeFilters from './components/TypeFilters'
import Toolbar from './components/Toolbar'
import DocumentCard from './components/DocumentCard'
import DocumentTable from './components/DocumentTable'
import DetailPanel from './components/DetailPanel'

const DOCUMENTS = rawDocuments as DocItem[]
const TOTAL = DOCUMENTS.length

const byName = (a: DocItem, b: DocItem) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })

// Compteurs par type, calculés une fois sur l'ensemble du corpus.
const TYPE_COUNTS = TYPE_ORDER.reduce(
  (acc, type) => {
    acc[type] = DOCUMENTS.filter((d) => d.type === type).length
    return acc
  },
  {} as Record<DocType, number>,
)

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<DocType>>(new Set())
  const [sort, setSort] = useState<SortMode>('type')
  const [view, setView] = useState<ViewMode>('cards')
  const [detail, setDetail] = useState<DocItem | null>(null)

  const filtered = useMemo(() => {
    const q = normalize(query)
    return DOCUMENTS.filter((doc) => {
      if (selectedTypes.size > 0 && !selectedTypes.has(doc.type)) return false
      if (!q) return true
      const haystack = normalize(`${doc.name} ${doc.summary}`)
      return haystack.includes(q)
    })
  }, [query, selectedTypes])

  // Groupes ordonnés (tri par type) — chaque groupe trié par nom A→Z.
  const groups = useMemo(() => {
    if (sort !== 'type') return null
    return TYPE_ORDER.map((type) => ({
      type,
      docs: filtered.filter((d) => d.type === type).sort(byName),
    })).filter((g) => g.docs.length > 0)
  }, [filtered, sort])

  const flat = useMemo(() => [...filtered].sort(byName), [filtered])

  function toggleType(type: DocType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const renderCards = (docs: DocItem[]) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} onOpenDetail={setDetail} />
      ))}
    </div>
  )

  return (
    <PasswordGate>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-4">
            <SearchBar value={query} onChange={setQuery} />
            <TypeFilters
              counts={TYPE_COUNTS}
              selected={selectedTypes}
              onToggle={toggleType}
              onClear={() => setSelectedTypes(new Set())}
            />
            <Toolbar
              count={filtered.length}
              total={TOTAL}
              sort={sort}
              onSort={setSort}
              view={view}
              onView={setView}
            />
          </div>

          <div className="mt-6">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                <p className="text-sm text-gray-500">
                  Aucun document ne correspond à votre recherche.
                </p>
              </div>
            ) : view === 'table' ? (
              <DocumentTable docs={flat} onOpenDetail={setDetail} />
            ) : groups ? (
              <div className="space-y-8">
                {groups.map((group) => (
                  <section key={group.type}>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {group.type}
                      <span className="ml-2 font-normal text-gray-400">{group.docs.length}</span>
                    </h2>
                    {renderCards(group.docs)}
                  </section>
                ))}
              </div>
            ) : (
              renderCards(flat)
            )}
          </div>

          <footer className="mt-12 border-t border-gray-200 pt-6 text-xs leading-relaxed text-gray-400">
            <p>
              Dossier confidentiel — données personnelles de tiers. Diffusion
              restreinte au notaire, aux associés et à l'acquéreur.
            </p>
          </footer>
        </main>

        <DetailPanel doc={detail} onClose={() => setDetail(null)} />
      </div>
    </PasswordGate>
  )
}
