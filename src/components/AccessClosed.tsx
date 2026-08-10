import Logo from './Logo'

/**
 * Page affichée lorsque l'accès à la dataroom est fermé : message d'accès
 * restreint, avec l'emoji animé « cadenas + clé » au-dessus du titre.
 */
export default function AccessClosed() {
  const base = import.meta.env.BASE_URL
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 bg-gray-50 px-4 py-10 text-center dark:bg-gray-950">
      <Logo className="h-7" />

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <img
          src={`${base}anim/locked.webp`}
          alt=""
          aria-hidden="true"
          width={84}
          height={84}
          className="mx-auto mb-3 h-20 w-20 select-none"
          draggable={false}
        />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Accès restreint</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          Les accès à cette dataroom ont été restreints. Vous n'avez plus accès aux documents de la
          vente.
        </p>
        <p className="mt-5 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
          Pour toute demande, contactez Théo Gouman · theo@gouman.fr
        </p>
      </div>
    </div>
  )
}
