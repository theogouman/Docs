import {
  authConfigured,
  json,
  otpMatches,
  parseCookies,
  readBody,
  setCookie,
  signToken,
  verifyToken,
} from '../../server/auth'
import { createLog } from '../../server/notion'

export const config = { maxDuration: 30 }

interface Otp {
  email: string
  exp: number
  mac: string
  attempts: number
}

export default async function handler(req: any, res: any) {
  if (!authConfigured()) {
    json(res, 503, { ok: false, configured: false })
    return
  }
  try {
    const cookies = parseCookies(req)
    const otp = verifyToken<Otp>(cookies.otp)
    if (!otp) {
      json(res, 200, { ok: false, error: 'expired' })
      return
    }

    const body = await readBody(req)
    const code = String(body?.code ?? '').trim()
    if (!/^\d{5}$/.test(code)) {
      json(res, 200, { ok: false, error: 'invalid' })
      return
    }

    const attempts = otp.attempts || 0
    if (attempts >= 5) {
      setCookie(res, 'otp', '', { clear: true })
      json(res, 200, { ok: false, error: 'too_many' })
      return
    }

    if (otpMatches(otp.email, otp.exp, code, otp.mac)) {
      setCookie(res, 'otp', '', { clear: true })
      setCookie(res, 'session', signToken({ t: 'session', email: otp.email, exp: Date.now() + 7 * 86400000 }), {
        maxAge: 7 * 24 * 3600,
      })
      try {
        await createLog('Connexion', otp.email)
      } catch {
        /* log best-effort */
      }
      json(res, 200, { ok: true, email: otp.email })
      return
    }

    const next = attempts + 1
    setCookie(res, 'otp', signToken({ t: 'otp', email: otp.email, exp: otp.exp, mac: otp.mac, attempts: next }), {
      maxAge: 600,
    })
    json(res, 200, { ok: false, error: 'wrong', remaining: Math.max(0, 5 - next) })
  } catch (e: any) {
    json(res, 500, { ok: false, error: String(e?.message ?? e) })
  }
}
