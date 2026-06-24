import { useEffect, useState } from 'react'
import { LoaderCircle, RotateCw } from 'lucide-react'
import OtpInput from './OtpInput'
import MailDropdown from './MailDropdown'
import { requestCode, verifyCode } from '../lib/auth'

interface Props {
  email: string
  onBack: () => void
  onSuccess: (email: string) => void
}

export default function LoginCode({ email, onBack, onSuccess }: Props) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(30)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds])

  async function submit(c: string) {
    if (busy) return
    setBusy(true)
    setError(null)
    const r = await verifyCode(c)
    setBusy(false)
    if (r.ok) {
      onSuccess(r.email || email)
      return
    }
    setCode('')
    if (r.error === 'expired') setError('Code expiré. Renvoyez-en un.')
    else if (r.error === 'too_many') setError('Trop de tentatives. Renvoyez un nouveau code.')
    else if (r.error === 'invalid') setError('Code invalide.')
    else setError(`Code incorrect.${r.remaining != null ? ` ${r.remaining} essai(s) restant(s).` : ''}`)
  }

  async function resend() {
    if (seconds > 0 || resending) return
    setResending(true)
    setError(null)
    const r = await requestCode(email)
    setResending(false)
    if (r.ok) {
      setSeconds(30)
      setCode('')
    } else {
      setError('Impossible de renvoyer le code pour le moment.')
    }
  }

  const canResend = seconds <= 0 && !resending

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <img
        src={`${import.meta.env.BASE_URL}anim/key.webp`}
        alt=""
        aria-hidden="true"
        width={72}
        height={72}
        className="mx-auto mb-2 h-16 w-16 select-none"
        draggable={false}
      />
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Saisissez votre code</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Un code à 5 chiffres a été envoyé à<br />
        <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
      </p>

      <div className="mt-6">
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={busy} error={!!error} />
      </div>

      {busy && (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Vérification…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={!canResend}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            canResend
              ? 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700'
              : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-600'
          }`}
        >
          {resending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
          {seconds > 0 ? `Renvoyer un code (${seconds}s)` : 'Renvoyer un code'}
        </button>
        <MailDropdown />
      </div>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        Vous voulez changer d'adresse email ?{' '}
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700 dark:text-gray-100 dark:hover:text-white"
        >
          Changer ici
        </button>
      </p>
    </div>
  )
}
