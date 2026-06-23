import type { ReactNode } from 'react'
import { ExternalLink, Mail, Phone, X } from 'lucide-react'
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

const linkClass =
  'underline underline-offset-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'

function InfoLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}

function PartyCard({ p }: { p: Party }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {p.role}
      </p>
      <p className="mt-0.5 font-semibold leading-snug text-gray-900 dark:text-gray-100">{p.name}</p>
      <div className="mt-2 space-y-1.5 text-xs sm:text-sm">
        {p.phone && (
          <InfoLine icon={<Phone className="h-4 w-4" />}>
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
          <InfoLine icon={<Mail className="h-4 w-4" />}>
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
          <InfoLine icon={<ExternalLink className="h-4 w-4" />}>
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
            <X className="h-5 w-5" />
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
