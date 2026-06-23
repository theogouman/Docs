export const TYPE_ORDER = [
  'Notaire',
  'Diagnostic',
  'Travaux',
  'Sinistre',
  'Administratif',
] as const

export type DocType = (typeof TYPE_ORDER)[number]

export interface DocItem {
  id: string
  name: string
  type: DocType
  date: string
  /** Nom de fichier (utilisé pour nommer les téléchargements / le ZIP). */
  file: string
  /** ID de la page Notion qui héberge le PDF (résolu via /api/pdf/[id]). */
  notionId: string
  summary: string
}

export type ViewMode = 'cards' | 'table'

/**
 * Couleurs des badges par Type (reprises de Notion) :
 * Notaire = bleu · Diagnostic = vert · Travaux = orange
 * Sinistre = rouge · Administratif = gris.
 * Les classes sont écrites en toutes lettres pour que Tailwind les conserve
 * au build (pas de concaténation dynamique).
 */
export const TYPE_STYLES: Record<
  DocType,
  { badge: string; dot: string }
> = {
  Notaire: {
    badge:
      'bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30',
    dot: 'bg-blue-500',
  },
  Diagnostic: {
    badge:
      'bg-green-100 text-green-800 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-400/30',
    dot: 'bg-green-500',
  },
  Travaux: {
    badge:
      'bg-orange-100 text-orange-800 ring-1 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/30',
    dot: 'bg-orange-500',
  },
  Sinistre: {
    badge:
      'bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30',
    dot: 'bg-red-500',
  },
  Administratif: {
    badge:
      'bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:ring-gray-400/30',
    dot: 'bg-gray-400',
  },
}
