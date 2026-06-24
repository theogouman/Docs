import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import Logo from './Logo'
import PasswordGate from './PasswordGate'
import LoginEmail from './LoginEmail'
import LoginCode from './LoginCode'
import { fetchMe } from '../lib/auth'

type Phase = 'loading' | 'legacy' | 'email' | 'code' | 'authed'

/**
 * Porte d'accès. Si l'auth Notion n'est pas configurée (variables d'env
 * absentes), on retombe sur la porte mot de passe historique pour ne jamais
 * bloquer la dataroom. Sinon : login par email + code à 5 chiffres, avec une
 * transition « page side-by-side » entre les deux étapes.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [email, setEmail] = useState('')
  const page1Ref = useRef<HTMLDivElement>(null)
  const page2Ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    let alive = true
    fetchMe().then((me) => {
      if (!alive) return
      if (!me.configured) setPhase('legacy')
      else if (me.authenticated) setPhase('authed')
      else setPhase('email')
    })
    return () => {
      alive = false
    }
  }, [])

  const onLogin = phase === 'email' || phase === 'code'
  const dataPage = phase === 'code' ? '2' : '1'

  // Le conteneur prend la hauteur de la page active (transition douce) et
  // suit les changements de taille (ex. liste d'emails qui se déplie).
  useLayoutEffect(() => {
    if (!onLogin) return
    const el = dataPage === '2' ? page2Ref.current : page1Ref.current
    if (!el) return
    const update = () => setHeight(el.scrollHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [onLogin, dataPage])

  // On place le focus sur la 1re case du code en arrivant sur la page « code ».
  // (On ne focalise PAS l'email au départ, sinon sa liste se déplierait seule.)
  useEffect(() => {
    if (onLogin && dataPage === '2') page2Ref.current?.querySelector('input')?.focus()
  }, [onLogin, dataPage])

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoaderCircle className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (phase === 'legacy') return <PasswordGate>{children}</PasswordGate>
  if (phase === 'authed') return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <Logo className="h-8 w-auto text-gray-900 dark:text-white" />

      <div
        className="t-page-slide w-full max-w-md transition-[height] duration-300 ease-out"
        data-page={dataPage}
        style={{ height }}
      >
        <section className="t-page" data-page-id="1">
          <div ref={page1Ref}>
            <LoginEmail
              onSent={(e) => {
                setEmail(e)
                setPhase('code')
              }}
            />
          </div>
        </section>
        <section className="t-page" data-page-id="2">
          <div ref={page2Ref}>
            <LoginCode
              key={email || 'code'}
              email={email}
              onBack={() => setPhase('email')}
              onSuccess={() => setPhase('authed')}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
