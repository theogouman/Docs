import { useMemo, useState } from 'react'
import rawDocuments from './data/documents.json'
import { TYPE_ORDER, type DocItem, type DocType, type ViewMode } from './lib/types'
import { normalize } from './lib/format'
import PasswordGate from './components/PasswordGate'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TypeFilters from './components/TypeFilters'
import Toolbar from './components/Toolbar'
import DocumentTable from './components/DocumentTable'
import DetailPanel from './components/DetailPanel'
import ZipButton from './components/ZipButton'
import CategorySection from './components/CategorySection'

const DOCUMENTS = rawDocuments as DocItem[]
const TOTAL = DOCUMENTS.length

const byName = (a: DocItem, b: DocItem) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })

const slug = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

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
  // Catégories repliées manuellement (par défaut tout est ouvert).
  const [collapsed, setCollapsed] = useState<Set<DocType>>(new Set())
  const [view, setView] = useState<ViewMode>('cards')
  const [detail, setDetail] = useState<DocItem | null>(null)

  const searching = normalize(query).length > 0

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return DOCUMENTS
    return DOCUMENTS.filter((doc) => normalize(`${doc.name} ${doc.summary}`).includes(q))
  }, [query])

  // Groupes par type (ordre fixe), chacun trié par nom A→Z, restreints au
  // filtre de catégories (tags) s'il y en a un.
  const groups = useMemo(() => {
    return TYPE_ORDER.map((type) => ({
      type,
      docs: filtered.filter((d) => d.type === type).sort(byName),
    }))
      .filter((g) => g.docs.length > 0)
      .filter((g) => selectedTypes.size === 0 || selectedTypes.has(g.type))
  }, [filtered, selectedTypes])

  const flat = useMemo(() => groups.flatMap((g) => g.docs), [groups])
  const shownCount = flat.length
  // Une seule catégorie affichée -> pas d'accordéon (#4).
  const collapsible = groups.length > 1

  const isOpen = (type: DocType) => searching || !collapsed.has(type)

  function toggleFilter(type: DocType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function toggleCollapse(type: DocType) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  return (
    <PasswordGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
        <Header />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-4">
            <SearchBar value={query} onChange={setQuery} />
            <TypeFilters
              counts={TYPE_COUNTS}
              selected={selectedTypes}
              onToggle={toggleFilter}
              onClear={() => setSelectedTypes(new Set())}
            />
            <Toolbar
              count={shownCount}
              total={TOTAL}
              view={view}
              onView={setView}
              leadingAction={
                <ZipButton
                  docs={DOCUMENTS}
                  zipName="dossier-fenouillet.zip"
                  label="Tout télécharger"
                  foldersByType
                  className="bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                />
              }
            />
          </div>

          <div className="mt-6">
            {shownCount === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucun document ne correspond à votre recherche.
                </p>
              </div>
            ) : view === 'table' ? (
              <DocumentTable docs={flat} onOpenDetail={setDetail} />
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <CategorySection
                    key={group.type}
                    type={group.type}
                    docs={group.docs}
                    zipName={`fenouillet-${slug(group.type)}.zip`}
                    open={isOpen(group.type)}
                    onToggle={() => toggleCollapse(group.type)}
                    onOpenDetail={setDetail}
                    collapsible={collapsible}
                  />
                ))}
              </div>
            )}
          </div>

          <footer className="mt-12 border-t border-gray-200 pt-6 text-xs leading-relaxed text-gray-400 dark:border-gray-800 dark:text-gray-500">
            <p>
              Dossier confidentiel. Données personnelles de tiers, diffusion
              restreinte au notaire, aux associés et à l'acquéreur.
            </p>
          </footer>
        </main>

        <DetailPanel doc={detail} onClose={() => setDetail(null)} />
      </div>
    </PasswordGate>
  )
}
