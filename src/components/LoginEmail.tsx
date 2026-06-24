import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, Mail, Send } from 'lucide-react'
import { requestCode, searchUsers, type UserHit } from '../lib/auth'

interface Props {
  onSent: (email: string) => void
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function LoginEmail({ onSent }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState<UserHit[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [choosing, setChoosing] = useState<UserHit | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // La liste n'est chargée qu'au premier focus (rien ne charge au démarrage).
  async function ensureLoaded() {
    if (loaded || loading) return
    setLoading(true)
    const r = await searchUsers('')
    setAll(r)
    setLoaded(true)
    setLoading(false)
  }
  function reveal() {
    setOpen(true)
    ensureLoaded()
  }

  async function send(email: string) {
    if (busy || !email) return
    setBusy(true)
    setError(null)
    const r = await requestCode(email)
    setBusy(false)
    if (r.ok) {
      onSent(email)
      return
    }
    if (r.error === 'unauthorized') setError("Cet email n'a pas accès à la dataroom.")
    else if (r.error === 'cooldown') setError(`Patientez ${r.retryIn ?? 20}s avant de redemander un code.`)
    else if (r.error === 'send_failed') setError("Impossible d'envoyer l'email. Réessayez plus tard.")
    else if (r.error === 'notion') setError("Connexion à Notion impossible (intégration partagée ?).")
    else setError('Une erreur est survenue.')
  }

  // Sélection d'une personne : si plusieurs adresses -> étape de choix.
  function pick(p: UserHit) {
    if (p.emails.length <= 1) send(p.emails[0])
    else {
      setChoosing(p)
      setOpen(false)
    }
  }

  const typed = q.trim()
  const typedValid = EMAIL_RE.test(typed)
  const s = typed.toLowerCase()
  const filtered = s
    ? all.filter((p) => p.name.toLowerCase().includes(s) || p.emails.some((e) => e.toLowerCase().includes(s)))
    : all
  const canSubmit = !busy && (typedValid || filtered.length === 1)

  // ---- Étape de confirmation : choisir l'adresse de réception du code ----
  if (choosing) {
    return (
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => {
            setChoosing(null)
            setError(null)
          }}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          À quelle adresse dois-je envoyer le code ?
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {choosing.emails.length} adresses mails sont enregistrées
        </p>

        <ul className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          {choosing.emails.map((em, i) => (
            <li key={em} className={i > 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}>
              <button
                type="button"
                disabled={busy}
                onClick={() => send(em)}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate text-sm text-gray-800 dark:text-gray-100">{em}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            </li>
          ))}
        </ul>

        {busy && (
          <p className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Envoi du code…
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    )
  }

  // ---- Écran principal : un seul bloc champ + liste révélée au focus ----
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (typedValid) send(typed)
        else if (filtered.length === 1) pick(filtered[0])
      }}
      className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Accès à la dataroom</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Saisissez votre adresse email pour recevoir un code à 5 chiffres.
      </p>

      {/* Bloc unifié : le champ et la liste partagent la même bordure. */}
      <div
        className={`mt-5 overflow-hidden rounded-xl border bg-white transition-colors dark:bg-gray-800 ${
          error ? 'border-red-300 dark:border-red-500/60' : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="email"
            value={q}
            onFocus={reveal}
            onChange={(e) => {
              setQ(e.target.value)
              setError(null)
              if (!open) reveal()
            }}
            placeholder="vous@exemple.com"
            aria-label="Adresse email"
            className="w-full bg-transparent py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Redimensionnement animé : la liste se déplie sous le champ. */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto border-t border-gray-100 dark:divide-gray-700/60 dark:border-gray-700/60">
              {loading && <li className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">Chargement…</li>}
              {!loading && filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">Aucun utilisateur trouvé</li>
              )}
              {filtered.map((p) => (
                <li key={p.emails.join('|')}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => pick(p)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-700/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {p.name || p.emails[0]}
                    </span>
                    <span className="max-w-[50%] shrink-0 truncate text-xs text-gray-400 dark:text-gray-500">
                      {p.emails.length > 1 ? `${p.emails.length} adresses` : p.name ? p.emails[0] : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          canSubmit
            ? 'bg-gray-900 text-white hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white'
            : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
        }`}
      >
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Recevoir mon code
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        Seuls les emails autorisés peuvent accéder au dossier.
      </p>
    </form>
  )
}
