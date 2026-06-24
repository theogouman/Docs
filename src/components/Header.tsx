import { useState } from 'react'
import Logo from './Logo'
import SettingsMenu from './SettingsMenu'
import StakeholdersModal from './StakeholdersModal'

export default function Header() {
  const [stakeholdersOpen, setStakeholdersOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <Logo className="h-6 sm:h-7" />
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-2xl">
            Dataroom - Vente SAS La Relève Hyères / Maley
          </h1>
          <button
            type="button"
            onClick={() => setStakeholdersOpen(true)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
          >
            Voir les parties prenantes de cette vente
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <SettingsMenu />
      </div>

      <StakeholdersModal open={stakeholdersOpen} onClose={() => setStakeholdersOpen(false)} />
    </header>
  )
}
