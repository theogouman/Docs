// api/log.ts — Journalise Ouverture / Téléchargement dans la base Logs Notion.
// Autonome (aucun import local) pour un bundling ESM fiable sur Vercel.
import crypto from 'crypto'

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
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}
function verifyToken<T = any>(token: string | undefined | null): T | null {
  if (!token || !SECRET) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const body = token.slice(0, i)
  const mac = token.slice(i + 1)
  if (!safeEqual(mac, crypto.createHmac('sha256', SECRET).update(body).digest('base64url'))) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload?.exp && Date.now() > payload.exp) return null
    return payload as T
  } catch {
    return null
  }
}
function parseCookies(req: Json): Record<string, string> {
  const header: string = req?.headers?.cookie || ''
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  }
  return out
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
async function findUserPageId(email: string): Promise<string | null> {
  const e = email.toLowerCase().trim()
  let cursor: string | undefined
  do {
    const r = await napi(`databases/${USERS_DB()}/query`, {
      method: 'POST',
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    })
    if (!r.ok) return null
    const j: Json = await r.json()
    for (const pg of j.results ?? []) {
      const em = pg?.properties?.Email?.email
      if (em && String(em).toLowerCase().trim() === e) return pg.id
    }
    cursor = j.has_more ? j.next_cursor : undefined
  } while (cursor)
  return null
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

export default async function handler(req: Json, res: Json) {
  if (!authConfigured()) return json(res, 200, { ok: false, configured: false })
  const email = verifyToken<{ email?: string }>(parseCookies(req).session)?.email
  if (!email) return json(res, 401, { ok: false, error: 'unauthenticated' })
  try {
    const body = await readBody(req)
    const action = body?.action
    if (action !== 'Ouverture' && action !== 'Téléchargement') {
      return json(res, 400, { ok: false, error: 'action invalide' })
    }
    const pageId = await findUserPageId(email)
    const properties: Json = {
      Name: { title: [{ text: { content: String(body?.label || `${action} · ${email}`) } }] },
      Action: { select: { name: action } },
      Date: { date: { start: parisDateTime(), time_zone: 'Europe/Paris' } },
    }
    if (pageId) properties.User = { relation: [{ id: pageId }] }
    await napi('pages', { method: 'POST', body: JSON.stringify({ parent: { database_id: LOGS_DB() }, properties }) })
    json(res, 200, { ok: true })
  } catch (e: Json) {
    json(res, 200, { ok: false, error: String(e?.message ?? e) })
  }
}
