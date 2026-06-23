import type { DocItem } from './types'

/**
 * URL de la route qui résout et sert le PDF depuis Notion.
 * Le PDF n'est chargé qu'au moment où ce lien est ouvert/affiché.
 */
export function pdfUrl(doc: Pick<DocItem, 'notionId'>): string {
  return `${import.meta.env.BASE_URL}api/pdf/${doc.notionId}`
}

/** Même route, mais force le téléchargement avec un nom de fichier lisible. */
export function pdfDownloadUrl(doc: Pick<DocItem, 'notionId' | 'file'>): string {
  return `${pdfUrl(doc)}?download=1&name=${encodeURIComponent(doc.file)}`
}
