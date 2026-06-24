import Logo from './Logo'
import SettingsMenu from './SettingsMenu'

interface Props {
  /** Ouvre le modal des parties prenantes (déclenché depuis la molette sur mobile). */
  onOpenStakeholders: () => void
}

export default function Header({ onOpenStakeholders }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <Logo className="h-6 sm:h-7" />
        <SettingsMenu onOpenStakeholders={onOpenStakeholders} />
      </div>
    </header>
  )
}
