import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import StakeholdersModal from './StakeholdersModal'

export default function Header() {
  const [stakeholdersOpen, setStakeholdersOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
            Dataroom - Vente SAS La Relève Hyères / Maley
          </h1>
          <button
            type="button"
            onClick={() => setStakeholdersOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Voir les parties prenantes de cette vente
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <ThemeToggle />
      </div>

      <StakeholdersModal open={stakeholdersOpen} onClose={() => setStakeholdersOpen(false)} />
    </header>
  )
}
