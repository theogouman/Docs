import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'

// Gmail filtré sur l'expéditeur theo@gouman.fr. Outlook : ouverture de la boîte.
const GMAIL_URL = 'https://mail.google.com/mail/u/0/#search/from%3Atheo%40gouman.fr'
const OUTLOOK_URL = 'https://outlook.office.com/mail/'

const GMAIL_ICON =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/1280px-Gmail_icon_%282020%29.svg.png'
const OUTLOOK_ICON =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Microsoft_Outlook_Icon_%282025%E2%80%93present%29.svg/960px-Microsoft_Outlook_Icon_%282025%E2%80%93present%29.svg.png'

/**
 * « Ouvrir mes mails » : bouton circulaire qui se métamorphose en menu
 * Gmail / Outlook (animation « Plus to menu morph » de transitions.dev).
 */
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
    'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'

  // Empreinte fermée (40×40). Le morph est ancré en bas à droite et grandit
  // vers le haut/la gauche en surimpression (z-20), sans pousser la mise en page.
  return (
    <div ref={ref} className="relative z-20 h-10 w-10">
      <div
        className="t-morph absolute bottom-0 right-0 border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10"
        data-open={open}
      >
        <div className="t-morph-menu flex flex-col p-1.5">
          <a href={GMAIL_URL} target="_blank" rel="noopener noreferrer" className={itemClass}>
            <img src={GMAIL_ICON} alt="" className="h-5 w-5 shrink-0 object-contain" />
            Gmail
          </a>
          <a href={OUTLOOK_URL} target="_blank" rel="noopener noreferrer" className={itemClass}>
            <img src={OUTLOOK_ICON} alt="" className="h-5 w-5 shrink-0 object-contain" />
            Outlook
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Ouvrir mes mails"
          title="Ouvrir mes mails"
          className="t-morph-plus text-gray-700 dark:text-gray-200"
        >
          <Mail className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
