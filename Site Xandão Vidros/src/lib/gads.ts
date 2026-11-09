// Google Ads: carregamento do gtag e disparo da conversão de lead.
// IDs vêm do build (.env): VITE_GADS_ID (ex.: AW-XXXXXXXXXX) e VITE_GADS_LABEL_LEAD.
// Sem eles, tudo é no-op silencioso — a LP funciona e grava o lead normalmente.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export const GADS_ID = import.meta.env.VITE_GADS_ID || ''
export const GADS_LABEL_LEAD = import.meta.env.VITE_GADS_LABEL_LEAD || ''

let carregado = false

export function initGads(): void {
  if (carregado || !GADS_ID || typeof document === 'undefined') return
  carregado = true
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GADS_ID}`
  document.head.appendChild(s)
  window.dataLayer = window.dataLayer || []
  const gtag: (...args: unknown[]) => void = function () {
    // gtag.js espera o objeto `arguments`, não um array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GADS_ID)
}

export function dispararConversaoLead(): void {
  if (!GADS_ID || !GADS_LABEL_LEAD || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', 'conversion', { send_to: `${GADS_ID}/${GADS_LABEL_LEAD}` })
}
