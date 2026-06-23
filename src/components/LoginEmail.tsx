import { useEffect, useState } from 'react'
import { ChevronRight, LoaderCircle, Mail } from 'lucide-react'
import { requestCode, searchUsers, type UserHit } from '../lib/auth'

interface Props {
  onSent: (email: string) => void
}

export default function LoginEmail({ onSent }: Props) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<UserHit[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const s = q.trim()
    if (s.length < 2) {
      setHits([])
      return
    }
    let alive = true
    const t = setTimeout(async () => {
      const r = await searchUsers(s)
      if (alive) setHits(r)
    }, 200)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q])

  async function send(email: string) {
    if (busy) return
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
    else setError('Une erreur est survenue.')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const exact = hits.find((h) => h.email.toLowerCase() === q.trim().toLowerCase())
        if (exact) send(exact.email)
        else if (hits.length === 1) send(hits[0].email)
      }}
      className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Accès à la dataroom</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Saisissez votre adresse email pour recevoir un code à 5 chiffres.
      </p>

      <div className="relative mt-5">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="email"
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setError(null)
          }}
          placeholder="vous@exemple.com"
          aria-label="Adresse email"
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
        />
      </div>

      {hits.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {hits.map((h) => (
            <li key={h.email}>
              <button
                type="button"
                disabled={busy}
                onClick={() => send(h.email)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
              >
                <span className="min-w-0">
                  {h.name && (
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {h.name}
                    </span>
                  )}
                  <span className="block truncate text-sm text-gray-500 dark:text-gray-400">{h.email}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {busy && (
        <p className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Envoi du code…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="mt-5 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        Seuls les emails autorisés peuvent accéder au dossier. Commencez à taper pour retrouver le vôtre.
      </p>
    </form>
  )
}
