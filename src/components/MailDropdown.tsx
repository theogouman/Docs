import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Mail } from 'lucide-react'

// Gmail filtré sur l'expéditeur theo@gouman.fr. Outlook : ouverture de la boîte.
const GMAIL_URL = 'https://mail.google.com/mail/u/0/#search/from%3Atheo%40gouman.fr'
const OUTLOOK_URL = 'https://outlook.office.com/mail/'

export default function MailDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
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

  const itemClass =
    'flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      >
        <Mail className="h-4 w-4" />
        Ouvrir mes mails
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`t-dd absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 ${
          open ? 'is-open' : ''
        }`}
      >
        <a href={GMAIL_URL} target="_blank" rel="noopener noreferrer" role="menuitem" className={itemClass}>
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-red-500 text-[11px] font-bold text-white">
            M
          </span>
          Gmail
        </a>
        <a href={OUTLOOK_URL} target="_blank" rel="noopener noreferrer" role="menuitem" className={itemClass}>
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[11px] font-bold text-white">
            O
          </span>
          Outlook
        </a>
      </div>
    </div>
  )
}
