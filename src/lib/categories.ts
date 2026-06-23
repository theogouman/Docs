import { createContext, useContext } from 'react'
import type { NotionColor } from './types'

/**
 * Fournit la couleur Notion d'un tag « Type » à n'importe quel composant
 * (les badges notamment), sans prop drilling. Mis à jour en live depuis
 * le schéma Notion par l'App.
 */
export const TypeColorContext = createContext<(type: string) => NotionColor>(() => 'gray')

export const useTypeColor = () => useContext(TypeColorContext)
