export interface MeResp {
  configured: boolean
  authenticated: boolean
  email?: string
}
export interface UserHit {
  email: string
  name: string
}

const API = `${import.meta.env.BASE_URL}api/auth`

export async function fetchMe(): Promise<MeResp> {
  try {
    const r = await fetch(`${API}?action=me`, { credentials: 'same-origin' })
    if (!r.ok) return { configured: true, authenticated: false }
    return await r.json()
  } catch {
    // Backend injoignable -> repli sur la porte mot de passe historique.
    return { configured: false, authenticated: false }
  }
}

export async function searchUsers(q: string): Promise<UserHit[]> {
  try {
    const r = await fetch(`${API}?action=users&q=${encodeURIComponent(q)}`, { credentials: 'same-origin' })
    if (!r.ok) return []
    const j = await r.json()
    return Array.isArray(j.results) ? j.results : []
  } catch {
    return []
  }
}

export async function requestCode(
  email: string,
): Promise<{ ok: boolean; error?: string; retryIn?: number }> {
  try {
    const r = await fetch(`${API}?action=request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email }),
    })
    return await r.json()
  } catch {
    return { ok: false, error: 'network' }
  }
}

export async function verifyCode(
  code: string,
): Promise<{ ok: boolean; email?: string; error?: string; remaining?: number }> {
  try {
    const r = await fetch(`${API}?action=verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ code }),
    })
    return await r.json()
  } catch {
    return { ok: false, error: 'network' }
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API}?action=logout`, { method: 'POST', credentials: 'same-origin' })
  } catch {
    /* ignore */
  }
}
