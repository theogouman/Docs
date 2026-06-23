// api/auth.ts — Authentification email + code (autonome : aucun import local,
// pour éviter les soucis de bundling ESM sur Vercel). Routage par ?action=.
import crypto from 'crypto'
import nodemailer from 'nodemailer'

export const config = { maxDuration: 30 }

type Json = any

const SECRET = process.env.AUTH_SECRET || ''
const TOKEN = () => process.env.NOTION_TOKEN || ''
const USERS_DB = () => process.env.NOTION_USERS_DB_ID || '388bad056a95805eab75da1d1daed18c'
const LOGS_DB = () => process.env.NOTION_LOGS_DB_ID || '388bad056a958067821add03dc25c056'
const NV = '2022-06-28'

function authConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN && process.env.AUTH_SECRET)
}

// ---- HMAC / jetons ----
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
function signToken(payload: Record<string, any>): string {
  const body = b64url(JSON.stringify(payload))
  return `${body}.${hmac(body)}`
}
function verifyToken<T = any>(token: string | undefined | null): T | null {
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
function makeOtp(): string {
  return String(crypto.randomInt(0, 100000)).padStart(5, '0')
}
function otpMac(email: string, exp: number, code: string): string {
  return hmac(`otp|${email.toLowerCase().trim()}|${exp}|${code}`)
}

// ---- HTTP / cookies ----
function parseCookies(req: Json): Record<string, string> {
  const header: string = req?.headers?.cookie || ''
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
}
function setCookie(res: Json, name: string, value: string, opts: { maxAge?: number; clear?: boolean } = {}) {
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
function json(res: Json, code: number, obj: any) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(obj))
}
function readBody(req: Json): Promise<any> {
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
    req.on('data', (c: Json) => (data += c))
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

// ---- Notion ----
async function napi(path: string, init: Json = {}): Promise<Response> {
  return fetch(`https://api.notion.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN()}`,
      'Notion-Version': NV,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

interface UserRow {
  pageId: string
  name: string
  email: string
}
let usersCache: { at: number; list: UserRow[] } | null = null

async function getUsers(): Promise<UserRow[]> {
  const now = Date.now()
  if (usersCache && now - usersCache.at < 60000) return usersCache.list
  const list: UserRow[] = []
  let cursor: string | undefined
  do {
    const r = await napi(`databases/${USERS_DB()}/query`, {
      method: 'POST',
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    })
    if (!r.ok) break
    const j: Json = await r.json()
    for (const pg of j.results ?? []) {
      const email = pg?.properties?.Email?.email
      const name = (pg?.properties?.Name?.title ?? []).map((t: Json) => t.plain_text).join('')
      if (email) list.push({ pageId: pg.id, name: name || '', email: String(email) })
    }
    cursor = j.has_more ? j.next_cursor : undefined
  } while (cursor)
  const seen = new Set<string>()
  const deduped = list.filter((u) => {
    const k = u.email.toLowerCase().trim()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  usersCache = { at: now, list: deduped }
  return deduped
}
async function findUser(email: string): Promise<UserRow | null> {
  const e = email.toLowerCase().trim()
  return (await getUsers()).find((u) => u.email.toLowerCase().trim() === e) ?? null
}
async function searchUsers(q: string): Promise<{ email: string; name: string }[]> {
  const s = q.toLowerCase().trim()
  const list = await getUsers()
  const base = s.length < 1 ? list : list.filter((u) => u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s))
  return base.slice(0, 12).map((u) => ({ email: u.email, name: u.name }))
}
function parisDateTime(): string {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  return fmt.format(new Date()).replace(' ', 'T')
}
async function createLog(action: string, email: string, label?: string): Promise<boolean> {
  const user = await findUser(email)
  const properties: Json = {
    Name: { title: [{ text: { content: label || `${action} · ${email}` } }] },
    Action: { select: { name: action } },
    Date: { date: { start: parisDateTime(), time_zone: 'Europe/Paris' } },
  }
  if (user) properties.User = { relation: [{ id: user.pageId }] }
  const r = await napi('pages', {
    method: 'POST',
    body: JSON.stringify({ parent: { database_id: LOGS_DB() }, properties }),
  })
  return r.ok
}

// ---- Email ----
function emailHtml(code: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5f5f5;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111"><div style="max-width:440px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #eee"><p style="margin:0 0 8px;font-size:14px;color:#555">Dataroom — Vente SAS La Relève Hyères / Maley</p><p style="margin:0 0 16px;font-size:15px">Votre code d'accès :</p><div style="font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;padding:14px 0;background:#fafafa;border-radius:12px;border:1px solid #eee">${code}</div><p style="margin:16px 0 0;font-size:13px;color:#777">Ce code expire dans 10 minutes.</p></div></body></html>`
}
async function sendCode(to: string, code: string): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Théo Gouman ⎜ Dataroom <onboarding@resend.dev>',
        to,
        subject: `${code} est votre code de connexion`,
        html: emailHtml(code),
        text: `Votre code d'accès : ${code} (expire dans 10 minutes).`,
      }),
    })
    if (!r.ok) throw new Error(`Resend ${r.status}`)
    return
  }
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD manquants')
  const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } })
  await transport.sendMail({
    from: `Théo Gouman ⎜ Dataroom <${user}>`,
    to,
    subject: `${code} est votre code de connexion`,
    text: `Votre code d'accès : ${code} (expire dans 10 minutes).`,
    html: emailHtml(code),
  })
}

// ---- Actions ----
const lastSent = new Map<string, number>()

async function actMe(req: Json, res: Json) {
  if (!authConfigured()) return json(res, 200, { configured: false, authenticated: false })
  const email = verifyToken<{ email?: string }>(parseCookies(req).session)?.email
  json(res, 200, { configured: true, authenticated: Boolean(email), email: email || undefined })
}
async function actUsers(req: Json, res: Json) {
  if (!authConfigured()) return json(res, 200, { configured: false, results: [] })
  const q = (req.query?.q ?? '').toString()
  try {
    json(res, 200, { configured: true, results: await searchUsers(q) })
  } catch {
    json(res, 200, { configured: true, results: [] })
  }
}
async function actRequestCode(req: Json, res: Json) {
  if (!authConfigured()) return json(res, 503, { ok: false, configured: false })
  const body = await readBody(req)
  const email = String(body?.email ?? '').toLowerCase().trim()
  if (!email) return json(res, 400, { ok: false, error: 'email manquant' })
  let user: UserRow | null = null
  try {
    user = await findUser(email)
  } catch (e: Json) {
    return json(res, 500, { ok: false, error: 'notion', detail: String(e?.message ?? e) })
  }
  if (!user) return json(res, 200, { ok: false, error: 'unauthorized' })
  const now = Date.now()
  const last = lastSent.get(email) ?? 0
  if (now - last < 25000) return json(res, 200, { ok: false, error: 'cooldown', retryIn: Math.ceil((25000 - (now - last)) / 1000) })
  const code = makeOtp()
  const exp = now + 10 * 60 * 1000
  const mac = otpMac(email, exp, code)
  try {
    await sendCode(email, code)
  } catch (e: Json) {
    return json(res, 500, { ok: false, error: 'send_failed', detail: String(e?.message ?? e) })
  }
  lastSent.set(email, now)
  setCookie(res, 'otp', signToken({ t: 'otp', email, exp, mac, attempts: 0 }), { maxAge: 600 })
  json(res, 200, { ok: true, email })
}
async function actVerify(req: Json, res: Json) {
  if (!authConfigured()) return json(res, 503, { ok: false, configured: false })
  const otp = verifyToken<{ email: string; exp: number; mac: string; attempts: number }>(parseCookies(req).otp)
  if (!otp) return json(res, 200, { ok: false, error: 'expired' })
  const body = await readBody(req)
  const code = String(body?.code ?? '').trim()
  if (!/^\d{5}$/.test(code)) return json(res, 200, { ok: false, error: 'invalid' })
  const attempts = otp.attempts || 0
  if (attempts >= 5) {
    setCookie(res, 'otp', '', { clear: true })
    return json(res, 200, { ok: false, error: 'too_many' })
  }
  if (safeEqual(otpMac(otp.email, otp.exp, code), otp.mac)) {
    setCookie(res, 'otp', '', { clear: true })
    setCookie(res, 'session', signToken({ t: 'session', email: otp.email, exp: Date.now() + 7 * 86400000 }), {
      maxAge: 7 * 24 * 3600,
    })
    try {
      await createLog('Connexion', otp.email, "S'est connecté")
    } catch {
      /* best-effort */
    }
    return json(res, 200, { ok: true, email: otp.email })
  }
  const next = attempts + 1
  setCookie(res, 'otp', signToken({ t: 'otp', email: otp.email, exp: otp.exp, mac: otp.mac, attempts: next }), {
    maxAge: 600,
  })
  json(res, 200, { ok: false, error: 'wrong', remaining: Math.max(0, 5 - next) })
}
function actLogout(_req: Json, res: Json) {
  setCookie(res, 'session', '', { clear: true })
  setCookie(res, 'otp', '', { clear: true })
  json(res, 200, { ok: true })
}

export default async function handler(req: Json, res: Json) {
  try {
    const action = (req.query?.action ?? '').toString()
    switch (action) {
      case 'me':
        return await actMe(req, res)
      case 'users':
        return await actUsers(req, res)
      case 'request-code':
        return await actRequestCode(req, res)
      case 'verify':
        return await actVerify(req, res)
      case 'logout':
        return actLogout(req, res)
      default:
        return json(res, 404, { error: 'action inconnue' })
    }
  } catch (e: Json) {
    json(res, 500, { error: String(e?.message ?? e) })
  }
}
