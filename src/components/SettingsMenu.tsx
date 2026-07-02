import { useEffect, useRef, useState } from 'react'
import { Moon, Settings, Sun, Users } from 'lucide-react'

interface Props {
  /** Ouvre le modal des parties prenantes (entrée affichée sur mobile uniquement). */
  onOpenStakeholders: () => void
}

type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Molette de réglages : panneau de choix de l'apparence (onglets glissants
 * « Clair / Sombre », style transitions.dev) ; regroupe aussi, sur mobile,
 * l'accès aux parties prenantes.
 */
export default function SettingsMenu({ onOpenStakeholders }: Props) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const wrapRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)

  // Applique le thème et le mémorise.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* stockage indisponible : on ignore */
    }
  }, [theme])

  // Fermeture au clic extérieur / Échap.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
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

  // Place la pastille glissante sous l'onglet actif.
  function movePill(animate: boolean) {
    const tabs = tabsRef.current
    const pill = pillRef.current
    if (!tabs || !pill) return
    const active = tabs.querySelector<HTMLButtonElement>('[aria-selected="true"]')
    if (!active) return
    if (!animate) {
      const prev = pill.style.transition
      pill.style.transition = 'none'
      pill.style.transform = `translateX(${active.offsetLeft}px)`
      pill.style.width = `${active.offsetWidth}px`
      void pill.offsetWidth // force le reflow avant de réautoriser l'animation
      pill.style.transition = prev
    } else {
      pill.style.transform = `translateX(${active.offsetLeft}px)`
      pill.style.width = `${active.offsetWidth}px`
    }
  }

  // Snap sans animation à l'ouverture (le panneau vient d'être monté).
  useEffect(() => {
    if (open) requestAnimationFrame(() => movePill(false))
  }, [open])

  // Glisse la pastille quand l'apparence change (panneau ouvert).
  useEffect(() => {
    if (open) movePill(true)
  }, [theme, open])

  const tabClass = 't-tab inline-flex items-center gap-1.5 text-sm font-medium'

  return (
    <div ref={wrapRef} className="relative z-50 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Réglages"
        title="Réglages"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <Settings className={`h-5 w-5 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right rounded-2xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10">
          {/* Sur mobile, le bouton « parties prenantes » est regroupé ici. */}
          <div className="mb-3 sm:hidden">
            <button
              type="button"
              onClick={() => {
                onOpenStakeholders()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Users className="h-4 w-4" />
              Voir les parties prenantes
            </button>
            <div className="mt-3 border-t border-gray-100 dark:border-gray-800" />
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Apparence
          </p>

          <div ref={tabsRef} className="t-tabs w-full" role="tablist" aria-label="Apparence">
            <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={theme === 'light'}
              onClick={() => setTheme('light')}
              className={`${tabClass} flex-1 justify-center`}
            >
              <Sun className="h-4 w-4" />
              Clair
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={theme === 'dark'}
              onClick={() => setTheme('dark')}
              className={`${tabClass} flex-1 justify-center`}
            >
              <Moon className="h-4 w-4" />
              Sombre
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
