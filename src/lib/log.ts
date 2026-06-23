type Action = 'Ouverture' | 'Téléchargement'

/**
 * Enregistre une action dans la base Logs Notion (via /api/log).
 * Fire-and-forget : n'impacte jamais l'UX, et no-op si l'auth n'est pas active.
 */
export function logAction(action: Action, label: string): void {
  try {
    fetch(`${import.meta.env.BASE_URL}api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({ action, label }),
    }).catch(() => {})
  } catch {
    /* ignore */
  }
}
