import { useEffect, useMemo, useState } from 'react'
import rawDocuments from './data/documents.json'
import rawCategories from './data/categories.json'
import type { Category, DocItem, NotionColor, ViewMode } from './lib/types'
import { TypeColorContext } from './lib/categories'
import { normalize } from './lib/format'
import { logAction } from './lib/log'
import AuthGate from './components/AuthGate'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import TypeFilters from './components/TypeFilters'
import Toolbar from './components/Toolbar'
import DocumentTable from './components/DocumentTable'
import DetailPanel from './components/DetailPanel'
import ZipButton from './components/ZipButton'
import CategorySection from './components/CategorySection'

const DOCUMENTS = rawDocuments as DocItem[]
const FALLBACK_CATEGORIES = rawCategories as Category[]
const TOTAL = DOCUMENTS.length

const byName = (a: DocItem, b: DocItem) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
const slug = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

interface LiveTypes {
  order: Category[]
  map: Record<string, string>
}

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  // Catégories repliées manuellement (par défaut tout est ouvert).
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [view, setView] = useState<ViewMode>('cards')
  const [detail, setDetail] = useState<DocItem | null>(null)
  // Catégories « Type » récupérées en live depuis Notion (repli statique).
  const [live, setLive] = useState<LiveTypes | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}api/types`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && Array.isArray(d.order) && d.order.length) setLive(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const categoriesAll = live?.order?.length ? live.order : FALLBACK_CATEGORIES
  const typeMap = live?.map

  // Chaque document reçoit son Type LIVE (repli sur le type statique).
  const docs = useMemo(
    () => DOCUMENTS.map((d) => ({ ...d, type: typeMap?.[d.notionId] ?? d.type })),
    [typeMap],
  )

  // Couleur d'un nom de type (live), repli gris si inconnu.
  const colorFor = useMemo(() => {
    const m = new Map(categoriesAll.map((c) => [c.name, c.color]))
    return (name: string): NotionColor => m.get(name) ?? 'gray'
  }, [categoriesAll])

  const searching = normalize(query).length > 0

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return docs
    return docs.filter((d) => normalize(`${d.name} ${d.summary}`).includes(q))
  }, [docs, query])

  // Ordre des catégories : celui de Notion, + tout type présent hors schéma.
  const orderedTypeNames = useMemo(() => {
    const names = categoriesAll.map((c) => c.name)
    for (const d of docs) if (!names.includes(d.type)) names.push(d.type)
    return names
  }, [categoriesAll, docs])

  // Catégories filtrables (avec compteur), uniquement celles ayant des documents.
  const filterCategories = useMemo(
    () =>
      orderedTypeNames
        .map((name) => ({
          name,
          color: colorFor(name),
          count: docs.filter((d) => d.type === name).length,
        }))
        .filter((c) => c.count > 0),
    [orderedTypeNames, docs, colorFor],
  )

  // Groupes affichés (recherche + filtre de tags).
  const groups = useMemo(
    () =>
      orderedTypeNames
        .map((name) => ({
          type: name,
          color: colorFor(name),
          docs: filtered.filter((d) => d.type === name).sort(byName),
        }))
        .filter((g) => g.docs.length > 0)
        .filter((g) => selectedTypes.size === 0 || selectedTypes.has(g.type)),
    [orderedTypeNames, filtered, selectedTypes, colorFor],
  )

  const flat = useMemo(() => groups.flatMap((g) => g.docs), [groups])
  const shownCount = flat.length
  // Une seule catégorie affichée -> pas d'accordéon.
  const collapsible = groups.length > 1
  const isOpen = (type: string) => searching || !collapsed.has(type)

  function toggleFilter(type: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  function toggleCollapse(type: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  // Ouvrir le détail = consulter le document -> on journalise une « Ouverture ».
  function openDetail(doc: DocItem) {
    logAction('Ouverture', doc.name)
    setDetail(doc)
  }

  return (
    <AuthGate>
      <TypeColorContext.Provider value={colorFor}>
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
          <Header />

          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="space-y-4">
              <SearchBar value={query} onChange={setQuery} />
              <TypeFilters
                categories={filterCategories}
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
                    docs={docs}
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
                <DocumentTable docs={flat} onOpenDetail={openDetail} />
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <CategorySection
                      key={group.type}
                      type={group.type}
                      color={group.color}
                      docs={group.docs}
                      zipName={`fenouillet-${slug(group.type) || 'categorie'}.zip`}
                      open={isOpen(group.type)}
                      onToggle={() => toggleCollapse(group.type)}
                      onOpenDetail={openDetail}
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
              <p className="mt-2">
                Plateforme administrée par{' '}
                <span className="t-tt-wrap">
                  <button
                    type="button"
                    aria-describedby="admin-tt"
                    className="t-tt-trigger cursor-default font-medium text-gray-600 underline decoration-dotted underline-offset-2 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Théo Gouman
                  </button>
                  <span className="t-tt" id="admin-tt" role="tooltip">
                    06 46 26 26 10 · theo@gouman.fr
                  </span>
                </span>
                .
              </p>
            </footer>
          </main>

          <DetailPanel doc={detail} onClose={() => setDetail(null)} />
        </div>
      </TypeColorContext.Provider>
    </AuthGate>
  )
}
