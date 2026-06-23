import { authConfigured, json, sessionEmail } from '../../server/auth'

export default function handler(req: any, res: any) {
  if (!authConfigured()) {
    json(res, 200, { configured: false, authenticated: false })
    return
  }
  const email = sessionEmail(req)
  json(res, 200, { configured: true, authenticated: Boolean(email), email: email || undefined })
}
