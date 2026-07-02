// api/log.ts — Journalise Ouverture / Téléchargement dans la base Logs Notion.
// L'accès étant public (plus de login), les entrées sont anonymes : pas de
// relation utilisateur. Autonome (aucun import local) pour un bundling ESM fiable.

export const config = { maxDuration: 30 }

type Json = any

const TOKEN = () => process.env.NOTION_TOKEN || ''
const LOGS_DB = () => process.env.NOTION_LOGS_DB_ID || '388bad056a958067821add03dc25c056'
const NV = '2022-06-28'

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
  if (!TOKEN()) return json(res, 200, { ok: false, configured: false })
  try {
    const body = await readBody(req)
    const action = body?.action
    if (action !== 'Ouverture' && action !== 'Téléchargement') {
      return json(res, 400, { ok: false, error: 'action invalide' })
    }
    const properties: Json = {
      Name: { title: [{ text: { content: String(body?.label || action) } }] },
      Action: { select: { name: action } },
      Date: { date: { start: parisDateTime(), time_zone: 'Europe/Paris' } },
    }
    await napi('pages', { method: 'POST', body: JSON.stringify({ parent: { database_id: LOGS_DB() }, properties }) })
    json(res, 200, { ok: true })
  } catch (e: Json) {
    json(res, 200, { ok: false, error: String(e?.message ?? e) })
  }
}
