import rawStakeholders from '../data/stakeholders.json'
import { useModalState } from '../lib/useModalState'

interface Stakeholder {
  role: string
  name: string
  org: string
  email: string
  phone: string
  address: string
  note: string
}

const STAKEHOLDERS = rawStakeholders as Stakeholder[]

interface Props {
  open: boolean
  onClose: () => void
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-14 shrink-0 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </span>
      {value ? (
        href ? (
          <a
            href={href}
            className="break-all text-blue-700 hover:underline dark:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            {value}
          </a>
        ) : (
          <span className="break-words text-gray-700 dark:text-gray-200">{value}</span>
        )
      ) : (
        <span className="italic text-gray-400 dark:text-gray-600">à compléter</span>
      )}
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
        className={`relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl t-modal ${state} dark:bg-gray-900 dark:ring-1 dark:ring-white/10`}
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

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STAKEHOLDERS.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                  {s.role}
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{s.name}</p>
                {s.org && <p className="text-sm text-gray-500 dark:text-gray-400">{s.org}</p>}
                <div className="mt-3 space-y-1 text-sm">
                  <Row label="Email" value={s.email} href={s.email ? `mailto:${s.email}` : undefined} />
                  <Row label="Tél" value={s.phone} href={s.phone ? `tel:${s.phone.replace(/\s/g, '')}` : undefined} />
                  <Row label="Adresse" value={s.address} />
                </div>
                {s.note && (
                  <p className="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    {s.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
