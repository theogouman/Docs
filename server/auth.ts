// server/auth.ts — Auth sans base de données : HMAC (codes OTP + session),
// cookies, utilitaires. Partagé par les routes /api/auth/* et /api/pdf, /api/log.
import crypto from 'crypto'

const SECRET = process.env.AUTH_SECRET || ''

/** L'auth est active dès que le token Notion ET le secret HMAC sont présents. */
export function authConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN && process.env.AUTH_SECRET)
}

function b64url(input: crypto.BinaryLike): string {
  return Buffer.from(input as any).toString('base64url')
}
function hmac(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
}
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

/** Jeton signé (corps base64url + HMAC). Le `exp` (ms) est vérifié. */
export function signToken(payload: Record<string, any>): string {
  const body = b64url(JSON.stringify(payload))
  return `${body}.${hmac(body)}`
}
export function verifyToken<T = any>(token: string | undefined | null): T | null {
  if (!token || !SECRET) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const body = token.slice(0, i)
  const mac = token.slice(i + 1)
  if (!safeEqual(mac, hmac(body))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload?.exp && Date.now() > payload.exp) return null
    return payload as T
  } catch {
    return null
  }
}

/** Code à 5 chiffres + MAC lié à (email, expiration, code). */
export function makeOtp(): string {
  return String(crypto.randomInt(0, 100000)).padStart(5, '0')
}
export function otpMac(email: string, exp: number, code: string): string {
  return hmac(`otp|${email.toLowerCase().trim()}|${exp}|${code}`)
}
export function otpMatches(email: string, exp: number, code: string, mac: string): boolean {
  return safeEqual(otpMac(email, exp, code), mac)
}

// ---- Cookies ----
export function parseCookies(req: any): Record<string, string> {
  const header: string = req?.headers?.cookie || ''
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
}
export function setCookie(
  res: any,
  name: string,
  value: string,
  opts: { maxAge?: number; clear?: boolean } = {},
): void {
  const parts = [
    `${name}=${opts.clear ? '' : encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ]
  if (opts.clear) parts.push('Max-Age=0')
  else if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`)
  const cookie = parts.join('; ')
  const prev = res.getHeader('Set-Cookie')
  res.setHeader('Set-Cookie', prev ? ([] as string[]).concat(prev as any, cookie) : cookie)
}

// ---- Petits utilitaires HTTP ----
export function json(res: any, code: number, obj: any): void {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(obj))
}
export function readBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body))
    } catch {
      return Promise.resolve({})
    }
  }
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c: any) => (data += c))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

/** Email de session courant (ou null) à partir du cookie. */
export function sessionEmail(req: any): string | null {
  const cookies = parseCookies(req)
  const s = verifyToken<{ email?: string }>(cookies.session)
  return s?.email ?? null
}
