// api/types.ts — Renvoie EN LIVE les catégories (tags « Type » Notion) :
//   { order: [{ name, color }], map: { <notionId>: <typeName> } }
//
// `order` = options du select « Type » dans l'ordre du schéma Notion (+ couleur).
// `map`   = type courant de chaque document (par id de page).
//
// Deux modes : API officielle si NOTION_TOKEN défini, sinon endpoints publics
// (la base est publiée publiquement). Mise en cache courte (~60 s) pour rester
// « live » sans marteler Notion.

import documents from '../src/data/documents.json'

export const config = { maxDuration: 30 }

const COLLECTION_ID = '387bad05-6a95-800d-8ae6-000b8759702e'
const DATABASE_ID = '387bad05-6a95-80a6-85ec-d4981181fac0'
const SPACE_ID = '044d7f69-a713-4bfa-a4e4-53a306821dcf'
const NOTION_VERSION = '2022-06-28'
const CACHE_TTL_MS = 60 * 1000

type Json = any

let cache: { at: number; data: { order: Json[]; map: Record<string, string> } } | null = null

function dashify(id: string): string {
  const s = (id || '').replace(/-/g, '')
  if (s.length !== 32) return id
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
}

const IDS: string[] = (documents as Json[]).map((d) => dashify(d.notionId))

/** API officielle : schéma (options du select) + lignes (id -> Type). */
async function viaToken(token: string) {
  const headers = { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION }

  const dbRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, { headers })
  if (!dbRes.ok) return null
  const db: Json = await dbRes.json()
  const props = db.properties ?? {}
  const typeProp =
    props.Type ?? Object.values(props).find((p: Json) => p?.type === 'select' && p?.name === 'Type')
  const options = typeProp?.select?.options ?? []
  const order = options.map((o: Json) => ({ name: o.name, color: o.color }))
  if (!order.length) return null

  const map: Record<string, string> = {}
  let cursor: string | undefined
  do {
    const qRes = await fetch(`https://api.notion.com/v1/data_sources/${COLLECTION_ID}/query`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    }).catch(() => null) as Response | null

    // Repli sur l'endpoint « databases » si « data_sources » indisponible.
    const res =
      qRes && qRes.ok
        ? qRes
        : await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
          })
    if (!res.ok) break
    const q: Json = await res.json()
    for (const pg of q.results ?? []) {
      const name = pg?.properties?.Type?.select?.name
      if (pg?.id && name) map[dashify(pg.id)] = name
    }
    cursor = q.has_more ? q.next_cursor : undefined
  } while (cursor)

  return { order, map }
}

/** Page publique : schéma via l'enregistrement collection + lignes par lots. */
async function viaPublic() {
  const cRes = await fetch('https://www.notion.so/api/v3/syncRecordValues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ pointer: { table: 'collection', id: COLLECTION_ID, spaceId: SPACE_ID }, version: -1 }],
    }),
  })
  if (!cRes.ok) return null
  const cj: Json = await cRes.json()
  const cMap = cj.recordMapWithRoles?.collection ?? cj.recordMap?.collection ?? {}
  const cVal = cMap[COLLECTION_ID]?.value?.value ?? cMap[COLLECTION_ID]?.value
  const schema = cVal?.schema ?? {}

  let typePropId: string | undefined
  let options: Json[] = []
  for (const [pid, def] of Object.entries<Json>(schema)) {
    if (def?.name === 'Type' && def?.type === 'select') {
      typePropId = pid
      options = def.options ?? []
      break
    }
  }
  if (!typePropId) return null
  const order = options.map((o: Json) => ({ name: o.value, color: o.color }))

  const rRes = await fetch('https://www.notion.so/api/v3/syncRecordValues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: IDS.map((id) => ({ pointer: { table: 'block', id, spaceId: SPACE_ID }, version: -1 })),
    }),
  })
  const map: Record<string, string> = {}
  if (rRes.ok) {
    const rj: Json = await rRes.json()
    const bMap = rj.recordMapWithRoles?.block ?? rj.recordMap?.block ?? {}
    for (const id of IDS) {
      const bv = bMap[id]?.value?.value ?? bMap[id]?.value
      const cell = bv?.properties?.[typePropId]
      const name = Array.isArray(cell) ? cell?.[0]?.[0] : undefined
      if (typeof name === 'string' && name) map[id] = name
    }
  }
  return { order, map }
}

export default async function handler(_req: Json, res: Json) {
  try {
    const now = Date.now()
    if (cache && now - cache.at < CACHE_TTL_MS) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60')
      res.end(JSON.stringify(cache.data))
      return
    }

    const token = process.env.NOTION_TOKEN
    let data = token ? await viaToken(token) : null
    if (!data || !data.order?.length) data = await viaPublic()
    if (!data || !data.order?.length) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Schéma Notion indisponible.' }))
      return
    }

    cache = { at: now, data }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60')
    res.end(JSON.stringify(data))
  } catch (err: any) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: String(err?.message ?? err) }))
  }
}
