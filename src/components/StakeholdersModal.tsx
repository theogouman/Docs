import type { ReactNode } from 'react'
import rawStakeholders from '../data/stakeholders.json'
import { useModalState } from '../lib/useModalState'

interface Party {
  role: string
  name: string
  phone?: string
  email?: string
  link?: string
  linkLabel?: string
}
interface Side {
  label: string
  parties: Party[]
}
const DATA = rawStakeholders as { vendeur: Side; acheteur: Side }

interface Props {
  open: boolean
  onClose: () => void
}

const PhoneIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.7a1.5 1.5 0 0 1 1.46 1.14l.55 2.22a1.5 1.5 0 0 1-.4 1.43l-1 1a11 11 0 0 0 4.9 4.9l1-1a1.5 1.5 0 0 1 1.43-.4l2.22.55A1.5 1.5 0 0 1 18 14.8v1.7a1.5 1.5 0 0 1-1.5 1.5A14.5 14.5 0 0 1 2 3.5Z" />
  </svg>
)
const MailIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M3 4h14a1 1 0 0 1 1 1v.4l-8 4.6-8-4.6V5a1 1 0 0 1 1-1Z" />
    <path d="M18 7.3V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.3l8 4.6 8-4.6Z" />
  </svg>
)
const LinkIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M8.5 5.5a3 3 0 0 1 4.24 0l1.76 1.76a3 3 0 0 1 0 4.24l-1 1a1 1 0 1 1-1.42-1.42l1-1a1 1 0 0 0 0-1.41L11.33 6.9a1 1 0 0 0-1.41 0l-1 1A1 1 0 1 1 7.5 6.5l1-1Z" />
    <path d="M11.5 14.5a3 3 0 0 1-4.24 0L5.5 12.74a3 3 0 0 1 0-4.24l1-1a1 1 0 1 1 1.42 1.42l-1 1a1 1 0 0 0 0 1.41l1.76 1.77a1 1 0 0 0 1.41 0l1-1a1 1 0 1 1 1.42 1.42l-1 1Z" />
  </svg>
)

function InfoLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}

function PartyCard({ p }: { p: Party }) {
  const linkClass = 'text-blue-700 hover:underline dark:text-blue-400'
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
        {p.role}
      </p>
      <p className="mt-0.5 font-semibold leading-snug text-gray-900 dark:text-gray-100">{p.name}</p>
      <div className="mt-2 space-y-1.5 text-xs sm:text-sm">
        {p.phone && (
          <InfoLine icon={PhoneIcon}>
            <a
              href={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {p.phone}
            </a>
          </InfoLine>
        )}
        {p.email && (
          <InfoLine icon={MailIcon}>
            <a
              href={`mailto:${p.email}`}
              className={`break-all ${linkClass}`}
              onClick={(e) => e.stopPropagation()}
            >
              {p.email}
            </a>
          </InfoLine>
        )}
        {p.link && (
          <InfoLine icon={LinkIcon}>
            <a
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              {p.linkLabel ?? 'Voir la fiche'}
            </a>
          </InfoLine>
        )}
      </div>
    </div>
  )
}

function Column({ side }: { side: Side }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{side.label}</h3>
      <div className="space-y-3">
        {side.parties.map((p, i) => (
          <PartyCard key={i} p={p} />
        ))}
      </div>
    </div>
  )
}

export default function StakeholdersModal({ open, onClose }: Props) {
  const { mounted, state } = useModalState(open, onClose)
  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stk-title"
    >
      <div
        className={`absolute inset-0 bg-gray-900/50 backdrop-blur-[1px] t-overlay ${state}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl t-modal ${state} dark:bg-gray-900 dark:ring-1 dark:ring-white/10`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-800">
          <div>
            <h2 id="stk-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Parties prenantes de la vente
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Personnes et organisations impliquées dans l'opération.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Toujours deux colonnes (vendeur / acquéreur), même sur mobile. */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
            <Column side={DATA.vendeur} />
            <Column side={DATA.acheteur} />
          </div>
        </div>
      </div>
    </div>
  )
}
