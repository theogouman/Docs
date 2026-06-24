import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { DocItem } from '../lib/types'
import { pdfProxyUrl, pdfUrl } from '../lib/pdf'

type Status = 'loading' | 'ready' | 'error'

/**
 * Aperçu PDF rendu avec pdf.js : chaque page est dessinée sur un canvas calé
 * sur la largeur du conteneur (« fit largeur », pas de scroll horizontal sur
 * mobile). pdf.js est chargé à la demande. En cas d'échec, repli sur le
 * lecteur natif (iframe).
 */
export default function PdfView({ doc }: { doc: DocItem }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let cancelled = false
    let destroy: (() => void) | null = null
    setStatus('loading')
    const host = hostRef.current
    if (host) host.innerHTML = ''

    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

        const task = pdfjs.getDocument({
          url: pdfProxyUrl(doc),
          withCredentials: true,
          disableStream: true,
          disableRange: true,
        })
        const pdf = await task.promise
        destroy = () => pdf.destroy()
        if (cancelled) return pdf.destroy()

        const target = hostRef.current
        if (!target) return
        const cssWidth = target.clientWidth || 800
        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n)
          if (cancelled) break
          const unit = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: (cssWidth / unit.width) * dpr })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.style.display = 'block'
          canvas.className = 'mb-2 rounded bg-white shadow-sm'
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          target.appendChild(canvas)
          await page.render({ canvasContext: ctx, viewport }).promise
          if (cancelled) break
        }
        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      if (destroy) destroy()
    }
  }, [doc])

  if (status === 'error') {
    return (
      <iframe
        src={`${pdfUrl(doc)}#toolbar=1&navpanes=0&statusbar=0&view=FitH&pagemode=none`}
        title={`Aperçu : ${doc.name}`}
        className="h-full w-full border-0"
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-gray-100 p-2 dark:bg-gray-950 sm:p-3">
      <div ref={hostRef} className="mx-auto w-full max-w-3xl" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
}
