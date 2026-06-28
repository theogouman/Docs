import { useEffect, useState } from 'react'
import { ChevronLeft, LoaderCircle, Lock, Mail, Send } from 'lucide-react'
import { requestCode, searchUsers } from '../lib/auth'

interface Props {
  onSent: (email: string) => void
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Accès en deux temps :
 *  1) une page d'accueil PUREMENT INFORMATIVE (aucun champ de saisie) — c'est
 *     ce que voit un robot non connecté, ce qui évite d'être classé comme
 *     « page de collecte d'identifiants » (faux positif Safe Browsing) ;
 *  2) après un clic explicite, un simple champ email (sans liste publique
 *     d'utilisateurs) pour recevoir le code.
 */
export default function LoginEmail({ onSent }: Props) {
  const [started, setStarted] = useState(false)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<{ email: string; name: string }[]>([])

  // Suggestion d'adresse à partir de 2 caractères (après le clic « Accéder »).
  // Volontairement gardée derrière la saisie : invisible pour un robot, et on
  // n'expose jamais toute la liste d'un coup.
  useEffect(() => {
    if (!started) return
    const term = q.trim().toLowerCase()
    if (term.length < 2) {
      setSuggestions([])
      return
    }
    let alive = true
    const t = setTimeout(async () => {
      const hits = await searchUsers(term)
      if (!alive) return
      const seen = new Set<string>()
      const flat: { email: string; name: string }[] = []
      for (const h of hits) {
        for (const em of h.emails) {
          const key = em.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          flat.push({ email: em, name: h.name })
        }
      }
      setSuggestions(flat.slice(0, 6))
    }, 150)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [q, started])

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
    if (r.error === 'unauthorized') setError("Cet email n'a pas accès à l'espace.")
    else if (r.error === 'cooldown') setError(`Patientez ${r.retryIn ?? 20}s avant de redemander un code.`)
    else if (r.error === 'send_failed') setError("Impossible d'envoyer l'email. Réessayez plus tard.")
    else if (r.error === 'notion') setError('Service momentanément indisponible. Réessayez.')
    else setError('Une erreur est survenue.')
  }

  const typed = q.trim()
  const canSubmit = !busy && EMAIL_RE.test(typed)

  // ---- 1) Page d'accueil informative (aucun formulaire) ----
  if (!started) {
    return (
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
          <Lock className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Espace documentaire privé
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Documents de la vente immobilière de la SAS La Relève Hyères. L'accès est strictement
          réservé aux parties autorisées (notaire, associés, acquéreur), sur invitation.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-600 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Accéder à mon espace
        </button>
        <p className="mt-4 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
          Portail privé. Aucun mot de passe, paiement ou coordonnée bancaire ne vous sera jamais
          demandé.
        </p>
      </div>
    )
  }

  // ---- 2) Étape email (après clic explicite) : champ simple, sans liste ----
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) send(typed)
      }}
      className="w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <button
        type="button"
        onClick={() => {
          setStarted(false)
          setError(null)
        }}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </button>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Recevoir mon code de connexion
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Saisissez l'adresse email à laquelle vous avez été invité.
      </p>

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
        className={`mt-5 w-full rounded-xl border bg-white px-4 py-2.5 text-base text-gray-900 outline-none transition focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500 sm:text-sm ${
          error ? 'border-red-300 dark:border-red-500/60' : 'border-gray-300 dark:border-gray-700'
        }`}
      />

      {suggestions.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          {suggestions.map((sug) => (
            <li key={sug.email} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
              <button
                type="button"
                disabled={busy}
                onClick={() => send(sug.email)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
              >
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="min-w-0 flex-1">
                  {sug.name && (
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {sug.name}
                    </span>
                  )}
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{sug.email}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          canSubmit
            ? 'bg-gray-700 text-white hover:bg-gray-600 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-100'
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
        Aucun mot de passe ni coordonnée bancaire ne vous sera jamais demandé.
      </p>
    </form>
  )
}
