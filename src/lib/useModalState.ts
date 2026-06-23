import { useEffect, useRef, useState } from 'react'

/**
 * Gère le montage + les classes d'animation d'un modal (ouverture/fermeture
 * scale + opacité de transitions.dev), la touche Échap et le verrouillage du
 * défilement de fond. Retourne `mounted` (rendre ou non) et `state`
 * (`is-open` / `is-closing`) à appliquer aux éléments `.t-modal` / `.t-overlay`.
 */
export function useModalState(open: boolean, onClose: () => void) {
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (open) {
      if (timer.current) clearTimeout(timer.current)
      setMounted(true)
      const id = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(id)
    }
    setShown(false)
    timer.current = setTimeout(() => setMounted(false), 220)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [open])

  useEffect(() => {
    if (!mounted) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mounted, onClose])

  return { mounted, state: (shown ? 'is-open' : 'is-closing') as 'is-open' | 'is-closing' }
}
