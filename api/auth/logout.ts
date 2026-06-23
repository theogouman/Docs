import { json, setCookie } from '../../server/auth'

export default function handler(_req: any, res: any) {
  setCookie(res, 'session', '', { clear: true })
  setCookie(res, 'otp', '', { clear: true })
  json(res, 200, { ok: true })
}
