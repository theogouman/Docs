export const TYPE_ORDER = [
  'Acte',
  'Promesse',
  'Diagnostic',
  'Devis',
  'Facture',
  'Sinistre',
  'Administratif',
] as const

export type DocType = (typeof TYPE_ORDER)[number]

export interface DocItem {
  id: string
  name: string
  type: DocType
  date: string
  sourceFile: string
  file: string
  summary: string
  attention: string
}

export type SortMode = 'type' | 'name'
export type ViewMode = 'cards' | 'table'

/**
 * Couleurs des badges par Type (reprises de Notion) :
 * Acte = bleu · Promesse = violet · Diagnostic = vert · Devis = orange
 * Facture = jaune · Sinistre = rouge · Administratif = gris.
 * Les classes sont écrites en toutes lettres pour que Tailwind les conserve
 * au build (pas de concaténation dynamique).
 */
export const TYPE_STYLES: Record<
  DocType,
  { badge: string; dot: string }
> = {
  Acte: { badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200', dot: 'bg-blue-500' },
  Promesse: { badge: 'bg-violet-100 text-violet-800 ring-1 ring-violet-200', dot: 'bg-violet-500' },
  Diagnostic: { badge: 'bg-green-100 text-green-800 ring-1 ring-green-200', dot: 'bg-green-500' },
  Devis: { badge: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200', dot: 'bg-orange-500' },
  Facture: { badge: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200', dot: 'bg-yellow-500' },
  Sinistre: { badge: 'bg-red-100 text-red-800 ring-1 ring-red-200', dot: 'bg-red-500' },
  Administratif: { badge: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200', dot: 'bg-gray-400' },
}
