// api/pdf/[id].ts — Résout l'URL du PDF Notion et la sert le plus vite possible.
//
// Résolution (dans l'ordre) :
//   1. NOTION_TOKEN défini -> API officielle Notion.
//   2. sinon               -> endpoints publics (page publique, « sans API »).
// Les URL signées sont mises en cache mémoire (instance chaude) ~45 min.
//
// Modes de service :
//   - défaut  -> redirection 302 vers l'URL signée S3 (lecture DIRECTE par le
//                navigateur, sans repasser par la fonction : c'est le plus
//                rapide pour « Ouvrir » et l'aperçu). Mis en cache CDN.
//   - ?proxy=1 -> streame les octets en même origine (pour le ZIP côté client).
//   - ?dl=1    -> streame en pièce jointe avec un nom de fichier lisible.

export const config = { maxDuration: 60 }

import crypto from 'crypto'

const SPACE_ID = '044d7f69-a713-4bfa-a4e4-53a306821dcf'
const NOTION_VERSION = '2022-06-28'
const CACHE_TTL_MS = 45 * 60 * 1000

// ---- Auth (inliné : aucun import local pour un bundling ESM fiable) ----
const AUTH_SECRET = process.env.AUTH_SECRET || ''
function authConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN && process.env.AUTH_SECRET)
}
function sessionEmail(req: any): string | null {
  if (!AUTH_SECRET) return null
  const header: string = req?.headers?.cookie || ''
  let token = ''
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx > 0 && part.slice(0, idx).trim() === 'session') token = decodeURIComponent(part.slice(idx + 1).trim())
  }
  if (!token) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const body = token.slice(0, i)
  const mac = token.slice(i + 1)
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url')
  const ab = Buffer.from(mac)
  const bb = Buffer.from(expected)
  if (ab.length !== bb.length || !crypto.timingSafeEqual(ab, bb)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload?.exp && Date.now() > payload.exp) return null
    return payload?.email ?? null
  } catch {
    return null
  }
}

type Json = any

// Cache mémoire des URL signées (persiste tant que l'instance reste chaude).
const urlCache = new Map<string, { url: string; exp: number }>()

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

/** Résout (avec cache) l'URL signée d'un document. */
async function resolveSigned(pageId: string): Promise<string | null> {
  const key = dashify(pageId)
  const now = Date.now()
  const hit = urlCache.get(key)
  if (hit && hit.exp > now) return hit.url

  const token = process.env.NOTION_TOKEN
  let url: string | null = null
  if (token) url = await resolveViaToken(pageId, token)
  if (!url) url = await resolveViaPublic(pageId)
  if (url) urlCache.set(key, { url, exp: now + CACHE_TTL_MS })
  return url
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

    // Accès aux PDF réservé aux utilisateurs connectés (si l'auth est active).
    const locked = authConfigured()
    if (locked && !sessionEmail(req)) return sendError(res, 401, 'Authentification requise.')

    const url = await resolveSigned(rawId)
    if (!url) return sendError(res, 502, 'PDF introuvable sur Notion (page publique ?).')

    const proxy = q.proxy === '1' || q.proxy === 'true'
    const download = q.dl === '1' || q.download === '1' || q.download === 'true'

    // Chemin rapide : on redirige vers S3, le navigateur lit en direct.
    if (!proxy && !download) {
      res.statusCode = 302
      res.setHeader('Location', url)
      // Ressource privée si l'auth est active -> pas de cache CDN partagé.
      res.setHeader('Cache-Control', locked ? 'private, no-store' : 'public, max-age=0, s-maxage=1800')
      res.setHeader('X-Robots-Tag', 'noindex, nofollow')
      res.end()
      return
    }

    // Proxy (ZIP même origine) ou téléchargement avec nom de fichier propre.
    const fileRes = await fetch(url)
    if (!fileRes.ok || !fileRes.body) {
      return sendError(res, 502, `Notion a renvoyé le statut ${fileRes.status}.`)
    }
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
