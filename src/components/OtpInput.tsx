import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

const LEN = 5

interface Props {
  value: string
  onChange: (v: string) => void
  onComplete?: (v: string) => void
  disabled?: boolean
  error?: boolean
}

/** Saisie d'un code à 5 chiffres (cases séparées, auto-avance, collage). */
export default function OtpInput({ value, onChange, onComplete, disabled, error }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function setAt(i: number, d: string): string {
    const arr = Array.from({ length: LEN }, (_, k) => value[k] ?? '')
    arr[i] = d
    const next = arr.join('')
    onChange(next)
    return next
  }

  function handleChange(i: number, raw: string) {
    const d = raw.replace(/\D/g, '')
    if (!d) {
      setAt(i, '')
      return
    }
    const next = setAt(i, d[d.length - 1])
    if (i < LEN - 1) refs.current[i + 1]?.focus()
    if (/^\d{5}$/.test(next)) onComplete?.(next)
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (value[i]) setAt(i, '')
      else if (i > 0) {
        refs.current[i - 1]?.focus()
        setAt(i - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus()
    else if (e.key === 'ArrowRight' && i < LEN - 1) refs.current[i + 1]?.focus()
  }

  function handlePaste(e: ClipboardEvent) {
    const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LEN)
    if (!d) return
    e.preventDefault()
    onChange(d)
    refs.current[Math.min(d.length, LEN - 1)]?.focus()
    if (d.length === LEN) onComplete?.(d)
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: LEN }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          aria-label={`Chiffre ${i + 1}`}
          className={`h-[4.5rem] w-12 rounded-2xl border bg-gray-100 text-center text-2xl font-bold text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:bg-gray-900 dark:focus:ring-gray-700 sm:w-16 ${
            error ? 'border-red-300 dark:border-red-500/50' : 'border-gray-200 dark:border-gray-700'
          }`}
        />
      ))}
    </div>
  )
}
