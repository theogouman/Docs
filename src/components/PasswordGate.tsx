import { useState, type FormEvent, type ReactNode } from 'react'

/**
 * Porte d'accès par mot de passe (DISSUASION CÔTÉ CLIENT UNIQUEMENT).
 * Ce n'est PAS une sécurité forte : le mot de passe est présent dans le
 * bundle JavaScript livré au navigateur. Pour un vrai contrôle d'accès,
 * placer le site derrière une authentification d'hébergeur (voir README).
 *
 * Mot de passe configurable via la variable d'environnement
 * VITE_ACCESS_PASSWORD (valeur par défaut : « fenouillet », à changer).
 */
const PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD ?? 'fenouillet'
const STORAGE_KEY = 'fenouillet.unlocked'

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === '1',
  )
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  if (unlocked) return <>{children}</>

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setUnlocked(true)
    } else {
      setError(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
        aria-labelledby="gate-title"
      >
        <h1 id="gate-title" className="text-lg font-semibold text-gray-900">
          Accès restreint
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Documents de la vente du 3 rue Fenouillet, Hyères. Saisissez le mot de
          passe communiqué pour consulter le dossier.
        </p>
        <label htmlFor="gate-password" className="sr-only">
          Mot de passe
        </label>
        <input
          id="gate-password"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          aria-invalid={error}
          aria-describedby={error ? 'gate-error' : undefined}
          className="mt-5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Mot de passe"
        />
        {error && (
          <p id="gate-error" role="alert" className="mt-2 text-sm text-red-600">
            Mot de passe incorrect.
          </p>
        )}
        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          Accéder au dossier
        </button>
        <p className="mt-4 text-xs leading-relaxed text-gray-400">
          Protection de dissuasion uniquement, ne remplace pas une
          authentification d'hébergeur.
        </p>
      </form>
    </div>
  )
}
