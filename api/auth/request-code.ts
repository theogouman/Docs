import {
  authConfigured,
  json,
  makeOtp,
  otpMac,
  readBody,
  setCookie,
  signToken,
} from '../../server/auth'
import { findUser } from '../../server/notion'
import { sendCode } from '../../server/email'

export const config = { maxDuration: 30 }

// Anti-spam best-effort par email (par instance chaude) : 1 envoi / 25 s.
const lastSent = new Map<string, number>()

export default async function handler(req: any, res: any) {
  if (!authConfigured()) {
    json(res, 503, { ok: false, configured: false })
    return
  }
  try {
    const body = await readBody(req)
    const email = String(body?.email ?? '').toLowerCase().trim()
    if (!email) {
      json(res, 400, { ok: false, error: 'email manquant' })
      return
    }

    const user = await findUser(email)
    if (!user) {
      // Email non présent dans la base Users.
      json(res, 200, { ok: false, error: 'unauthorized' })
      return
    }

    const now = Date.now()
    const last = lastSent.get(email) ?? 0
    if (now - last < 25000) {
      json(res, 200, { ok: false, error: 'cooldown', retryIn: Math.ceil((25000 - (now - last)) / 1000) })
      return
    }

    const code = makeOtp()
    const exp = now + 10 * 60 * 1000
    const mac = otpMac(email, exp, code)

    try {
      await sendCode(email, code)
    } catch (e: any) {
      json(res, 500, { ok: false, error: 'send_failed', detail: String(e?.message ?? e) })
      return
    }

    lastSent.set(email, now)
    setCookie(res, 'otp', signToken({ t: 'otp', email, exp, mac, attempts: 0 }), { maxAge: 600 })
    json(res, 200, { ok: true, email })
  } catch (e: any) {
    json(res, 500, { ok: false, error: String(e?.message ?? e) })
  }
}
