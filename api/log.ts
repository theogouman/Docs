import { authConfigured, json, readBody, sessionEmail } from '../server/auth'
import { createLog } from '../server/notion'

export const config = { maxDuration: 30 }

export default async function handler(req: any, res: any) {
  if (!authConfigured()) {
    json(res, 200, { ok: false, configured: false })
    return
  }
  const email = sessionEmail(req)
  if (!email) {
    json(res, 401, { ok: false, error: 'unauthenticated' })
    return
  }
  try {
    const body = await readBody(req)
    const action = body?.action
    if (action !== 'Ouverture' && action !== 'Téléchargement') {
      json(res, 400, { ok: false, error: 'action invalide' })
      return
    }
    await createLog(action, email, String(body?.label ?? ''))
    json(res, 200, { ok: true })
  } catch (e: any) {
    json(res, 200, { ok: false, error: String(e?.message ?? e) })
  }
}
