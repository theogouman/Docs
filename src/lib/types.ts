export interface DocItem {
  id: string
  name: string
  /** Nom du tag « Type » dans Notion (dynamique, peut changer en live). */
  type: string
  date: string
  /** Nom de fichier (utilisé pour nommer les téléchargements / le ZIP). */
  file: string
  /** ID de la page Notion qui héberge le PDF (résolu via /api/pdf/[id]). */
  notionId: string
  summary: string
}

export type DocType = string
export type ViewMode = 'cards' | 'table'

/** Couleurs possibles d'un tag « select » Notion. */
export type NotionColor =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'

/** Une catégorie = un tag « Type » Notion (nom + couleur). */
export interface Category {
  name: string
  color: NotionColor
}

/**
 * Styles de badge/pastille par couleur Notion (clair + sombre).
 * Classes écrites en toutes lettres pour que Tailwind les conserve au build.
 */
export const NOTION_COLOR_STYLES: Record<NotionColor, { badge: string; dot: string }> = {
  default: {
    badge: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:ring-gray-400/30',
    dot: 'bg-gray-400',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-500/20 dark:text-gray-300 dark:ring-gray-400/30',
    dot: 'bg-gray-400',
  },
  brown: {
    badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30',
    dot: 'bg-amber-600',
  },
  orange: {
    badge: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/30',
    dot: 'bg-orange-500',
  },
  yellow: {
    badge: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-400/30',
    dot: 'bg-yellow-500',
  },
  green: {
    badge: 'bg-green-100 text-green-800 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-400/30',
    dot: 'bg-green-500',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30',
    dot: 'bg-blue-500',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:ring-purple-400/30',
    dot: 'bg-purple-500',
  },
  pink: {
    badge: 'bg-pink-100 text-pink-800 ring-1 ring-pink-200 dark:bg-pink-500/15 dark:text-pink-300 dark:ring-pink-400/30',
    dot: 'bg-pink-500',
  },
  red: {
    badge: 'bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30',
    dot: 'bg-red-500',
  },
}

/** Styles d'une couleur Notion, avec repli gris si inconnue. */
export function colorStyle(color: NotionColor | string | undefined) {
  return NOTION_COLOR_STYLES[(color as NotionColor) ?? 'gray'] ?? NOTION_COLOR_STYLES.gray
}
