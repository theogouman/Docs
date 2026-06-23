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
  const [openCats, setOpenCats] = useState<Set<DocType>>(new Set())
  const [view, setView] = useState<ViewMode>('cards')
  const [detail, setDetail] = useState<DocItem | null>(null)

  const searching = normalize(query).length > 0

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return DOCUMENTS
    return DOCUMENTS.filter((doc) => normalize(`${doc.name} ${doc.summary}`).includes(q))
  }, [query])

  // Groupes par type (ordre fixe), chacun trié par nom A→Z.
  const groups = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({
        type,
        docs: filtered.filter((d) => d.type === type).sort(byName),
      })).filter((g) => g.docs.length > 0),
    [filtered],
  )

  // Vue tableau : liste à plat, ordonnée par type puis par nom.
  const flat = useMemo(() => groups.flatMap((g) => g.docs), [groups])

  // Une catégorie est ouverte si on l'a ouverte (tag/chevron), ou pendant une
  // recherche (on déplie tout ce qui contient des résultats).
  const isOpen = (type: DocType) => searching || openCats.has(type)

  function toggleCat(type: DocType) {
    const willOpen = !openCats.has(type)
    setOpenCats((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
    if (willOpen) {
      setTimeout(() => {
        document
          .getElementById(`cat-section-${type}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
    }
  }

  const openTypes = useMemo(
    () => new Set(TYPE_ORDER.filter((t) => isOpen(t))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openCats, searching],
  )

  return (
    <PasswordGate>
      <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-blue-50">
        <Header />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-4">
            <SearchBar value={query} onChange={setQuery} />
            <TypeFilters
              counts={TYPE_COUNTS}
              selected={openTypes}
              onToggle={toggleCat}
              onClear={() => setOpenCats(new Set())}
            />
            <Toolbar
              count={filtered.length}
              total={TOTAL}
              view={view}
              onView={setView}
              leadingAction={
                <ZipButton
                  docs={DOCUMENTS}
                  zipName="dossier-fenouillet.zip"
                  label="Tout télécharger"
                  foldersByType
                  className="bg-gray-900 text-white hover:bg-gray-700"
                />
              }
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
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <CategorySection
                    key={group.type}
                    type={group.type}
                    docs={group.docs}
                    zipName={`fenouillet-${slug(group.type)}.zip`}
                    open={isOpen(group.type)}
                    onToggle={() => toggleCat(group.type)}
                    onOpenDetail={setDetail}
                  />
                ))}
              </div>
            )}
          </div>

          <footer className="mt-12 border-t border-gray-200 pt-6 text-xs leading-relaxed text-gray-400">
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
