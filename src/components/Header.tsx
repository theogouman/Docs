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
          <button
            type="button"
            onClick={() => setStakeholdersOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
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
