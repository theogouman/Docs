// api/types.ts — Renvoie EN LIVE les catégories (tags « Type » Notion) :
//   { order: [{ name, color }], map: { <notionId>: <typeName> } }
//
// `order` = options du select « Type » dans l'ordre du schéma Notion (+ couleur).
// `map`   = type courant de chaque document (par id de page).
//
// Deux modes : API officielle si NOTION_TOKEN défini, sinon endpoints publics
// (la base est publiée publiquement). Mise en cache courte (~60 s) pour rester
// « live » sans marteler Notion.

export const config = { maxDuration: 30 }

// IDs des pages Documents (inliné : pas d'import JSON sous ESM sur Vercel).
const DOC_IDS: string[] = [
  '388bad05-6a95-81ca-b2be-cb32ce2ac9a2',
  '387bad05-6a95-81da-9ae3-eaa8b7459abd',
  '388bad05-6a95-81b1-9bd9-f1545566bb50',
  '388bad05-6a95-8122-bdfb-fdc7147414d6',
  '388bad05-6a95-81cb-9b25-c2ea6b0b6a9f',
  '388bad05-6a95-81a7-ba62-f82cd1994fc4',
  '388bad05-6a95-8181-ae40-d300d8089323',
  '388bad05-6a95-8103-be1d-deb06f8a99b9',
  '388bad05-6a95-81df-813d-edf5c35892d2',
  '388bad05-6a95-81d1-b424-c521806f9fbc',
  '388bad05-6a95-8101-a047-e01182b1cc03',
  '388bad05-6a95-81e5-ab63-cbca536eefbf',
  '388bad05-6a95-81eb-84f3-d15906e769c7',
  '388bad05-6a95-81b1-848c-dceba4398478',
  '388bad05-6a95-81e1-bf29-f802f8a1c94f',
  '388bad05-6a95-8150-80fa-fa919333a54c',
  '388bad05-6a95-8124-b940-eb8c3f913469',
  '388bad05-6a95-816f-8b01-cf57383c9b42',
  '388bad05-6a95-81f9-86fb-f9dfefde23ed',
  '388bad05-6a95-81c2-85f3-c544c291f143',
  '388bad05-6a95-81a0-b602-d921884d3788',
]

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

const IDS: string[] = DOC_IDS.map(dashify)

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
