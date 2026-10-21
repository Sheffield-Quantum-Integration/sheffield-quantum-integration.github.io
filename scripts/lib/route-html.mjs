import { NAV_LINKS, SITE_NAME, resolvePageMeta } from '../../src/site/routes.js'

export const META_START = '<!-- route-meta:start -->'
export const META_END = '<!-- route-meta:end -->'
export const NOSCRIPT_START = '<!-- route-noscript:start -->'
export const NOSCRIPT_END = '<!-- route-noscript:end -->'

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const renderHeadMeta = (pageId) => {
  const meta = resolvePageMeta(pageId)
  const e = escapeHtml
  const lines = [
    `<title>${e(meta.title)}</title>`,
    `<meta name="description" content="${e(meta.description)}" />`,
    meta.url ? `<link rel="canonical" href="${e(meta.url)}" />` : null,
    `<meta name="robots" content="${e(meta.robots)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${e(SITE_NAME)}" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    meta.url ? `<meta property="og:url" content="${e(meta.url)}" />` : null,
    `<meta property="og:image" content="${e(meta.image.url)}" />`,
    `<meta property="og:image:width" content="${meta.image.width}" />`,
    `<meta property="og:image:height" content="${meta.image.height}" />`,
    `<meta property="og:image:alt" content="${e(meta.image.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(meta.image.url)}" />`,
    meta.preloadImage
      ? `<link rel="preload" as="image" imagesrcset="${e(meta.preloadImage.srcSet)}" imagesizes="${e(meta.preloadImage.sizes)}" fetchpriority="high" />`
      : null
  ]
  return lines.filter(Boolean).join('\n    ')
}

export const renderNoscript = (pageId) => {
  const meta = resolvePageMeta(pageId)
  const links = NAV_LINKS.map((link) => `<a href="${link.path}">${escapeHtml(link.label)}</a>`).join(' | ')
  return [
    `<h1>${escapeHtml(meta.title)}</h1>`,
    `<p>${escapeHtml(meta.description)}</p>`,
    `<p>Browse: ${links} | <a href="/qdd">Quantum Dot Day</a></p>`
  ].join('\n        ')
}

const replaceBetween = (html, start, end, replacement) => {
  const first = html.indexOf(start)
  const last = html.indexOf(end)
  if (first === -1 || last === -1 || last < first || html.indexOf(start, first + 1) !== -1) {
    throw new Error(`Expected exactly one ${start} … ${end} block in the HTML shell`)
  }
  const indent = html.slice(html.lastIndexOf('\n', first) + 1, first)
  const body = replacement.replace(/\n\s*/g, `\n${indent}`)
  return `${html.slice(0, first + start.length)}\n${indent}${body}\n${indent}${html.slice(last)}`
}

export const renderRouteHtml = (shell, pageId) => {
  const withMeta = replaceBetween(shell, META_START, META_END, renderHeadMeta(pageId))
  return replaceBetween(withMeta, NOSCRIPT_START, NOSCRIPT_END, renderNoscript(pageId))
}
