// api/documents.ts — Liste EN LIVE les documents de la base Notion
// (id de page, nom, type, résumé « Notes », nom de fichier, date de création).
// Le client fusionne ces données avec le JSON statique : les documents connus
// conservent leurs résumés/dates curatés, les nouveaux documents apparaissent.
//
// Autonome (aucun import local) pour un bundling ESM fiable sur Vercel.
// API officielle si NOTION_TOKEN, sinon liste vide (le client garde le statique).

export const config = { maxDuration: 30 }

const COLLECTION_ID = '387bad05-6a95-800d-8ae6-000b8759702e'
const DATABASE_ID = '387bad05-6a95-80a6-85ec-d4981181fac0'
const NOTION_VERSION = '2022-06-28'
const CACHE_TTL_MS = 30 * 1000

type Json = any

let cache: { at: number; data: { documents: Json[] } } | null = null

function dashify(id: string): string {
  const s = (id || '').replace(/-/g, '')
  if (s.length !== 32) return id
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
}
function plain(rich: Json): string {
  return Array.isArray(rich) ? rich.map((t: Json) => t?.plain_text ?? '').join('') : ''
}

/** API officielle : toutes les lignes de la base Documents. */
async function viaToken(token: string): Promise<{ documents: Json[] } | null> {
  const headers = { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION }
  const documents: Json[] = []
  let cursor: string | undefined
  do {
    const body = JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 })
    let res = (await fetch(`https://api.notion.com/v1/data_sources/${COLLECTION_ID}/query`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body,
    }).catch(() => null)) as Response | null

    // Repli sur l'endpoint « databases » si « data_sources » indisponible.
    if (!res || !res.ok) {
      res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body,
      })
    }
    if (!res.ok) break
    const j: Json = await res.json()
    for (const pg of j.results ?? []) {
      const props = pg?.properties ?? {}
      const files = props.Fichier?.files ?? []
      // On n'expose que les documents qui ont effectivement un fichier joint.
      if (!Array.isArray(files) || !files.length) continue
      const name = plain(props.Name?.title)
      const type = props.Type?.select?.name ?? ''
      const summary = plain(props.Notes?.rich_text)
      const file = files[0]?.name ?? ''
      if (pg?.id) {
        documents.push({
          notionId: dashify(pg.id),
          name,
          type,
          summary,
          file,
          created: pg?.created_time ?? '',
        })
      }
    }
    cursor = j.has_more ? j.next_cursor : undefined
  } while (cursor)
  return documents.length ? { documents } : null
}

function send(res: Json, code: number, obj: any, sMaxAge = 0) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${sMaxAge}`)
  res.end(JSON.stringify(obj))
}

export default async function handler(_req: Json, res: Json) {
  try {
    const now = Date.now()
    if (cache && now - cache.at < CACHE_TTL_MS) return send(res, 200, cache.data, 30)

    const token = process.env.NOTION_TOKEN
    const data = token ? await viaToken(token) : null
    if (!data) return send(res, 200, { documents: [] }, 30) // -> le client garde le statique

    cache = { at: now, data }
    send(res, 200, data, 30)
  } catch (err: any) {
    send(res, 200, { documents: [], error: String(err?.message ?? err) }, 0)
  }
}
