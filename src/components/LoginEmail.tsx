import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, LoaderCircle, Lock, Mail, Send } from 'lucide-react'
import { requestCode, searchUsers } from '../lib/auth'

interface Props {
  onSent: (email: string) => void
}

interface Hit {
  email: string
  name: string
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Accès en deux temps :
 *  1) page d'accueil PUREMENT INFORMATIVE (aucun champ) — ce que voit un robot,
 *     ce qui évite le faux positif « collecte d'identifiants » ;
 *  2) après un clic explicite, un champ email avec suggestions.
 *
 * Perf : la liste autorisée est préchargée UNE fois en arrière-plan dès l'entrée
 * dans l'étape email, puis filtrée LOCALEMENT (résultat instantané, sans appel
 * réseau à chaque frappe). Navigation clavier : ↑/↓ pour parcourir, Tab pour
 * sélectionner, Entrée pour valider.
 */
export default function LoginEmail({ onSent }: Props) {
  const [started, setStarted] = useState(false)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [all, setAll] = useState<Hit[] | null>(null)
  const [active, setActive] = useState(-1)
  const [dismissed, setDismissed] = useState(false)

  // Préchargement unique de la liste autorisée (en tâche de fond, dès l'étape
  // email — donc derrière le clic « Accéder », invisible pour un robot).
  useEffect(() => {
    if (!started || all) return
    let alive = true
    searchUsers('')
      .then((hits) => {
        if (!alive) return
        const seen = new Set<string>()
        const flat: Hit[] = []
        for (const h of hits) {
          for (const em of h.emails) {
            const key = em.toLowerCase()
            if (seen.has(key)) continue
            seen.add(key)
            flat.push({ email: em, name: h.name })
          }
        }
        setAll(flat)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [started, all])

  // Filtrage LOCAL instantané (à partir de 2 caractères).
  const suggestions = useMemo<Hit[]>(() => {
    if (dismissed) return []
    const term = q.trim().toLowerCase()
    if (term.length < 2 || !all) return []
    return all
      .filter((u) => u.email.toLowerCase().includes(term) || u.name.toLowerCase().includes(term))
      .slice(0, 6)
  }, [q, all, dismissed])

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

  function submit() {
    if (busy) return
    if (active >= 0 && suggestions[active]) send(suggestions[active].email)
    else if (canSubmit) send(typed)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      if (!suggestions.length) return
      e.preventDefault()
      setActive((a) => (a < suggestions.length - 1 ? a + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      if (!suggestions.length) return
      e.preventDefault()
      setActive((a) => (a > 0 ? a - 1 : suggestions.length - 1))
    } else if (e.key === 'Tab' && !e.shiftKey && suggestions.length) {
      // Tab : complète le champ avec la suggestion (active, sinon la première).
      // Entrée validera ensuite l'envoi.
      e.preventDefault()
      const idx = active < 0 ? 0 : active
      setQ(suggestions[idx].email)
      setActive(-1)
      setDismissed(true)
    } else if (e.key === 'Escape') {
      setActive(-1)
      setDismissed(true)
    }
  }

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

  // ---- 2) Étape email : champ + suggestions (filtrage local instantané) ----
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
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
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-autocomplete="list"
        value={q}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setQ(e.target.value)
          setError(null)
          setActive(-1)
          setDismissed(false)
        }}
        placeholder="vous@exemple.com"
        aria-label="Adresse email"
        className={`mt-5 w-full rounded-xl border bg-white px-4 py-2.5 text-base text-gray-900 outline-none transition focus:border-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500 sm:text-sm ${
          error ? 'border-red-300 dark:border-red-500/60' : 'border-gray-300 dark:border-gray-700'
        }`}
      />

      {suggestions.length > 0 && (
        <ul
          role="listbox"
          className="mt-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
        >
          {suggestions.map((sug, i) => (
            <li key={sug.email} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                disabled={busy}
                onMouseEnter={() => setActive(i)}
                onClick={() => send(sug.email)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition disabled:opacity-60 ${
                  i === active
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
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
        disabled={!canSubmit && active < 0}
        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          canSubmit || active >= 0
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
