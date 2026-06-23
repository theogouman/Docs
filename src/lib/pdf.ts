/**
 * URL statique d'un PDF servi depuis public/documents/.
 * Respecte le base path de Vite (déploiement racine ou sous-dossier).
 * Aucun PDF n'est chargé tant qu'un lien n'est pas cliqué.
 */
export function pdfUrl(file: string): string {
  return `${import.meta.env.BASE_URL}documents/${encodeURIComponent(file)}`
}
