import { useEffect, useState, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import PasswordGate from './PasswordGate'
import LoginEmail from './LoginEmail'
import LoginCode from './LoginCode'
import { fetchMe } from '../lib/auth'

type Phase = 'loading' | 'legacy' | 'email' | 'code' | 'authed'

/**
 * Porte d'accès. Si l'auth Notion n'est pas configurée (variables d'env
 * absentes), on retombe sur la porte mot de passe historique pour ne jamais
 * bloquer la dataroom. Sinon : login par email + code à 5 chiffres.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [email, setEmail] = useState('')

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      {phase === 'email' ? (
        <LoginEmail
          onSent={(e) => {
            setEmail(e)
            setPhase('code')
          }}
        />
      ) : (
        <LoginCode email={email} onBack={() => setPhase('email')} onSuccess={() => setPhase('authed')} />
      )}
    </div>
  )
}
