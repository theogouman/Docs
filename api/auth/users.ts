import { authConfigured, json } from '../../server/auth'
import { searchUsers } from '../../server/notion'

export default async function handler(req: any, res: any) {
  if (!authConfigured()) {
    json(res, 200, { configured: false, results: [] })
    return
  }
  const q = (req.query?.q ?? '').toString()
  try {
    json(res, 200, { configured: true, results: await searchUsers(q) })
  } catch {
    json(res, 200, { configured: true, results: [] })
  }
}
