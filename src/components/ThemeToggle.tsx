import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Bascule jour / nuit, mémorisée dans localStorage. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* stockage indisponible : on ignore */
    }
  }, [theme])

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Activer le mode jour' : 'Activer le mode nuit'}
      title={dark ? 'Mode jour' : 'Mode nuit'}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}
