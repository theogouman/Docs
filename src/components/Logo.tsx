interface Props {
  className?: string
  title?: string
}

/**
 * Logotype « LA RELÈVE » reconstruit en SVG inline (vectoriel, net à toute
 * taille). Il utilise `currentColor` : noir sur fond clair, blanc sur fond
 * sombre — il couvre donc les deux versions du logo avec un seul asset.
 * Pour utiliser les fichiers exacts du groupe, déposer les images dans
 * public/brand/ et remplacer ce composant par une balise <img>.
 */
export default function Logo({ className = '', title = 'La Relève' }: Props) {
  const font = "'SF Pro Display', system-ui, -apple-system, sans-serif"
  return (
    <svg
      viewBox="0 0 250 70"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      {/* « LA » vertical, lecture bas-haut, calé à gauche du R */}
      <text
        transform="translate(19 60) rotate(-90)"
        x="0"
        y="0"
        fontFamily={font}
        fontWeight={700}
        fontSize="16"
        letterSpacing="1.5"
      >
        LA
      </text>
      {/* « RELÈVE » en gras */}
      <text x="33" y="55" fontFamily={font} fontWeight={700} fontSize="52" letterSpacing="-1.5">
        RELÈVE
      </text>
    </svg>
  )
}
