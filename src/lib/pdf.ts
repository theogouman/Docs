import type { DocItem } from './types'

const BASE = import.meta.env.BASE_URL

/**
 * URL d'ouverture / aperçu : la route redirige (302) vers l'URL signée S3,
 * que le navigateur lit en direct (rapide, pas de re-streaming).
 */
export function pdfUrl(doc: Pick<DocItem, 'notionId'>): string {
  return `${BASE}api/pdf/${doc.notionId}`
}

/** Force le téléchargement d'un fichier unique avec un nom lisible. */
export function pdfDownloadUrl(doc: Pick<DocItem, 'notionId' | 'file'>): string {
  return `${pdfUrl(doc)}?dl=1&name=${encodeURIComponent(doc.file)}`
}

/** Octets servis en même origine (utilisé pour assembler le ZIP côté client). */
export function pdfProxyUrl(doc: Pick<DocItem, 'notionId'>): string {
  return `${pdfUrl(doc)}?proxy=1`
}
