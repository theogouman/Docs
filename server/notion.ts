// server/notion.ts — Accès Notion côté serveur (API officielle) :
// lecture des utilisateurs autorisés (base Users) et création des logs (base Logs).

const TOKEN = () => process.env.NOTION_TOKEN || ''
const USERS_DB = () => process.env.NOTION_USERS_DB_ID || '388bad056a95805eab75da1d1daed18c'
const LOGS_DB = () => process.env.NOTION_LOGS_DB_ID || '388bad056a958067821add03dc25c056'
const NOTION_VERSION = '2022-06-28'

type Json = any

async function napi(path: string, init: any = {}): Promise<Response> {
  return fetch(`https://api.notion.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN()}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
}

export interface UserRow {
  pageId: string
  name: string
  email: string
}

let usersCache: { at: number; list: UserRow[] } | null = null
const USERS_TTL_MS = 60 * 1000

/** Tous les utilisateurs autorisés (par email). Mis en cache ~60 s. */
export async function getUsers(): Promise<UserRow[]> {
  const now = Date.now()
  if (usersCache && now - usersCache.at < USERS_TTL_MS) return usersCache.list

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

  // Les emails de « Other Email » sont eux-mêmes des pages Users (avec leur
  // propre propriété Email), donc déjà inclus ci-dessus. On dédoublonne.
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

export async function findUser(email: string): Promise<UserRow | null> {
  const e = email.toLowerCase().trim()
  const list = await getUsers()
  return list.find((u) => u.email.toLowerCase().trim() === e) ?? null
}

export async function searchUsers(q: string): Promise<{ email: string; name: string }[]> {
  const s = q.toLowerCase().trim()
  if (s.length < 2) return []
  const list = await getUsers()
  return list
    .filter((u) => u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s))
    .slice(0, 8)
    .map((u) => ({ email: u.email, name: u.name }))
}

/** Date/heure locale de Paris au format naïf « YYYY-MM-DDTHH:mm:ss ». */
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

export type LogAction = 'Connexion' | 'Ouverture' | 'Téléchargement'

/** Crée une page dans la base Logs (Action, Date Paris, User par email). */
export async function createLog(action: LogAction, email: string, label?: string): Promise<boolean> {
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
