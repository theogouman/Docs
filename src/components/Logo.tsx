interface Props {
  className?: string
  title?: string
}

/**
 * Logo officiel « LA RELÈVE ». Deux fichiers fournis par le groupe :
 *   - public/brand/logo-light.png : logo noir, affiché en mode clair
 *   - public/brand/logo-dark.png  : logo blanc, affiché en mode sombre
 * La bascule se fait via les classes `dark:` (l'image inutile est masquée).
 */
export default function Logo({ className = '', title = 'La Relève' }: Props) {
  const base = import.meta.env.BASE_URL
  return (
    <span className="inline-flex">
      <img
        src={`${base}brand/logo-light.png`}
        alt={title}
        draggable={false}
        className={`block w-auto select-none dark:hidden ${className}`}
      />
      <img
        src={`${base}brand/logo-dark.png`}
        alt={title}
        draggable={false}
        aria-hidden="true"
        className={`hidden w-auto select-none dark:block ${className}`}
      />
    </span>
  )
}
