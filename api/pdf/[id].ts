// api/pdf/[id].ts — Résout et sert un PDF hébergé sur Notion, à la volée.
//
// Deux modes, dans cet ordre :
//   1. NOTION_TOKEN défini  -> API officielle Notion (le plus fiable).
//   2. sinon                -> endpoints publics de Notion (la page est
//                              publique : « même sans API »).
//
// La réponse est streamée depuis la même origine (/api/...), ce qui permet
// l'aperçu en iframe, l'ouverture, le téléchargement et le ZIP côté client
// sans aucun souci de CORS, et sans la limite de taille des réponses
// bufferisées (le gros acte de ~19 Mo passe sans problème).

export const config = { maxDuration: 60 }

const SPACE_ID = '044d7f69-a713-4bfa-a4e4-53a306821dcf'
const NOTION_VERSION = '2022-06-28'

type Json = any

/** Remet les tirets d'un UUID Notion (8-4-4-4-12). */
function dashify(id: string): string {
  const s = id.replace(/-/g, '')
  if (s.length !== 32) return id
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
}

/** API officielle : lit la 1re propriété de type « files » de la page. */
async function resolveViaToken(pageId: string, token: string): Promise<string | null> {
  const res = await fetch(`https://api.notion.com/v1/pages/${dashify(pageId)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Notion-Version': NOTION_VERSION },
  })
  if (!res.ok) return null
  const data: Json = await res.json()
  const props = data.properties ?? {}
  for (const key of Object.keys(props)) {
    const p = props[key]
    if (p?.type === 'files' && Array.isArray(p.files) && p.files.length) {
      const url = p.files[0]?.file?.url ?? p.files[0]?.external?.url
      if (url) return url
    }
  }
  return null
}

/** Cherche une URL de fichier dans le format public v3 des propriétés. */
function findFileUrlInProperties(props: Json): string | null {
  if (!props || typeof props !== 'object') return null
  for (const key of Object.keys(props)) {
    const val = props[key]
    if (!Array.isArray(val)) continue
    for (const segment of val) {
      if (!Array.isArray(segment)) continue
      const decorations = segment[1]
      if (!Array.isArray(decorations)) continue
      for (const deco of decorations) {
        if (Array.isArray(deco) && deco[0] === 'a' && typeof deco[1] === 'string') return deco[1]
      }
    }
  }
  return null
}

/** Page publique : lit l'enregistrement puis demande une URL signée (~1h). */
async function resolveViaPublic(pageId: string): Promise<string | null> {
  const id = dashify(pageId)
  const recRes = await fetch('https://www.notion.so/api/v3/syncRecordValues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ pointer: { table: 'block', id, spaceId: SPACE_ID }, version: -1 }],
    }),
  })
  if (!recRes.ok) return null
  const rec: Json = await recRes.json()
  const map = rec.recordMapWithRoles?.block ?? rec.recordMap?.block ?? {}
  const entry = map[id]
  const value = entry?.value?.value ?? entry?.value
  const rawUrl = findFileUrlInProperties(value?.properties)
  if (!rawUrl) return null

  const signRes = await fetch('https://www.notion.so/api/v3/getSignedFileUrls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: [{ url: rawUrl, permissionRecord: { table: 'block', id } }] }),
  })
  if (!signRes.ok) return rawUrl
  const signed: Json = await signRes.json()
  return signed.signedUrls?.[0] ?? signed.signedGetUrls?.[0] ?? rawUrl
}

function sendError(res: Json, code: number, message: string) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({ error: message }))
}

export default async function handler(req: Json, res: Json) {
  try {
    const q = req.query ?? {}
    const rawId = Array.isArray(q.id) ? q.id[0] : q.id
    if (!rawId) return sendError(res, 400, 'Identifiant de document manquant.')

    const token = process.env.NOTION_TOKEN
    let url: string | null = null
    if (token) url = await resolveViaToken(rawId, token)
    if (!url) url = await resolveViaPublic(rawId)
    if (!url) return sendError(res, 502, 'PDF introuvable sur Notion (page publique ?).')

    const fileRes = await fetch(url)
    if (!fileRes.ok || !fileRes.body) {
      return sendError(res, 502, `Notion a renvoyé le statut ${fileRes.status}.`)
    }

    const download = q.download === '1' || q.download === 'true'
    const filename = (Array.isArray(q.name) ? q.name[0] : q.name) || 'document.pdf'

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(filename)}"`,
    )
    const len = fileRes.headers.get('content-length')
    if (len) res.setHeader('Content-Length', len)

    const reader = (fileRes.body as any).getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
    res.end()
  } catch (err: any) {
    sendError(res, 500, `Erreur serveur : ${String(err?.message ?? err)}`)
  }
}
