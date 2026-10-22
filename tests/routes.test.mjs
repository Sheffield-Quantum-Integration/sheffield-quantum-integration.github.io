import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  NOT_FOUND_PAGE_ID,
  PAGE_META,
  PUBLIC_ROUTES,
  canonicalUrl,
  pageIdForPublicPath,
  resolvePageMeta,
  routeHtmlFile
} from '../src/site/routes.js'
import { escapeHtml, renderHeadMeta, renderRouteHtml } from '../scripts/lib/route-html.mjs'
import { QDD_REVIEW_PATH } from '../src/qdd-review/config.js'

const EXPECTED_PATHS = ['/', '/research', '/people', '/publications', '/facilities', '/news', '/opportunities', '/contact', '/qdd']
const shell = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('public route inventory matches the agreed list', () => {
  assert.deepEqual(PUBLIC_ROUTES.map((route) => route.path), EXPECTED_PATHS)
})

test('route files use name.html and canonicals have no trailing slash', () => {
  assert.equal(routeHtmlFile('/'), 'index.html')
  assert.equal(routeHtmlFile('/research'), 'research.html')
  assert.equal(canonicalUrl('/'), 'https://sqil.shef.ac.uk/')
  assert.equal(canonicalUrl('/research/'), 'https://sqil.shef.ac.uk/research')
})

test('every public route has unique, non-empty title and description', () => {
  const titles = new Set()
  const descriptions = new Set()
  for (const route of PUBLIC_ROUTES) {
    const meta = resolvePageMeta(route.id)
    assert.ok(meta.title && meta.description, route.id)
    assert.equal(meta.robots, 'index,follow', route.id)
    assert.equal(meta.url, canonicalUrl(route.path), route.id)
    assert.match(meta.image.url, /^https:\/\/sqil\.shef\.ac\.uk\/assets\//)
    titles.add(meta.title)
    descriptions.add(meta.description)
  }
  assert.equal(titles.size, PUBLIC_ROUTES.length)
  assert.equal(descriptions.size, PUBLIC_ROUTES.length)
})

test('QDD keeps its own title, description and image', () => {
  const meta = resolvePageMeta('quantum-dot-day')
  assert.equal(meta.title, 'Quantum Dot Day | 26 November 2026')
  assert.equal(meta.image.url, 'https://sqil.shef.ac.uk/assets/quantum-dot-day.jpg')
})

test('not-found metadata is noindex with no canonical', () => {
  const meta = resolvePageMeta(NOT_FOUND_PAGE_ID)
  assert.equal(meta.robots, 'noindex')
  assert.equal(meta.url, null)
  assert.ok(!renderHeadMeta(NOT_FOUND_PAGE_ID).includes('rel="canonical"'))
})

test('unknown and review paths are not public routes', () => {
  assert.equal(pageIdForPublicPath('/does-not-exist'), null)
  assert.equal(pageIdForPublicPath(QDD_REVIEW_PATH), null)
  assert.equal(pageIdForPublicPath('/research/'), 'research')
  assert.equal(pageIdForPublicPath('/quantum-dot-day'), 'quantum-dot-day')
})

test('metadata values are escaped', () => {
  assert.equal(escapeHtml(`a & "b" <c> 'd'`), 'a &amp; &quot;b&quot; &lt;c&gt; &#39;d&#39;')
  const original = PAGE_META.news.title
  PAGE_META.news.title = 'News "&" <Events>'
  try {
    const head = renderHeadMeta('news')
    assert.ok(head.includes('<title>News &quot;&amp;&quot; &lt;Events&gt;</title>'))
    assert.ok(!head.includes('<Events>'))
  } finally {
    PAGE_META.news.title = original
  }
})

test('rendered route HTML has exactly one of each head tag', () => {
  for (const route of PUBLIC_ROUTES) {
    const html = renderRouteHtml(shell, route.id)
    const meta = resolvePageMeta(route.id)
    for (const pattern of [/<title>/g, /<meta name="description"/g, /<link rel="canonical"/g, /<meta property="og:title"/g, /<meta property="og:url"/g, /<meta name="twitter:card"/g, /<meta name="robots"/g]) {
      assert.equal(html.match(pattern)?.length, 1, `${route.id} ${pattern}`)
    }
    assert.ok(html.includes(`<link rel="canonical" href="${meta.url}" />`), route.id)
    assert.ok(!html.includes(QDD_REVIEW_PATH), route.id)
  }
})

test('the source index.html head matches the generated home metadata', () => {
  assert.equal(renderRouteHtml(shell, 'home'), shell)
})

const dist = new URL('../dist/', import.meta.url).pathname
test('built output contains one HTML file per public route and no review page', { skip: !existsSync(join(dist, 'research.html')) && 'run npm run build first' }, () => {
  for (const route of PUBLIC_ROUTES) {
    const html = readFileSync(join(dist, routeHtmlFile(route.path)), 'utf8')
    assert.ok(html.includes(`<link rel="canonical" href="${canonicalUrl(route.path)}" />`), route.path)
    assert.ok(html.includes('<script type="module"'), route.path)
  }
  assert.ok(!existsSync(join(dist, `${QDD_REVIEW_PATH.slice(1)}.html`)))
  assert.ok(existsSync(join(dist, '404.html')))
})
