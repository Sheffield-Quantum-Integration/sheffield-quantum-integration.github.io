import { writeFileSync } from 'fs'
import { resolve } from 'path'

const DEFAULT_SOURCE_URL = 'https://joesmio.github.io/papers.html'
const DEFAULT_OUTPUT_PATH = resolve('public/data/publications.json')

function parseArgs(argv) {
  const out = { url: DEFAULT_SOURCE_URL, output: DEFAULT_OUTPUT_PATH }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--url') {
      out.url = argv[i + 1] ?? out.url
      i += 1
      continue
    }
    if (arg === '--out') {
      out.output = resolve(argv[i + 1] ?? out.output)
      i += 1
      continue
    }
  }
  return out
}

function decodeHtmlEntities(text) {
  const named = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  }

  let decoded = text
  for (const [entity, value] of Object.entries(named)) {
    decoded = decoded.split(entity).join(value)
  }

  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCodePoint(parseInt(hex, 16)))
  decoded = decoded.replace(/&#(\d+);/g, (_match, num) => String.fromCodePoint(parseInt(num, 10)))
  return decoded
}

function stripTags(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p\s*>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function slugify(text) {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function uniqueBy(items, keyFn) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = keyFn(item)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function labelForLink(href, text) {
  const lowerHref = href.toLowerCase()
  const lowerText = text.toLowerCase()

  if (lowerHref.includes('arxiv.org/')) return 'arXiv'
  if (lowerHref.includes('doi.org/')) return 'DOI'
  if (lowerText.includes('press release')) return 'Press release'
  if (lowerText.includes('scilight')) return 'Scilight'

  return text || 'Link'
}

function parsePublicationBlock(blockHtml, baseUrl) {
  const titleMatch = blockHtml.match(/<h4>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h4>/i)
  const rawPrimaryLink = titleMatch?.[1]?.trim() || ''
  const primaryLink = rawPrimaryLink ? new URL(rawPrimaryLink, baseUrl).toString() : ''
  const title = normalizeWhitespace(decodeHtmlEntities(stripTags(titleMatch?.[2] ?? '')))

  const authorsMatch = blockHtml.match(/<\/h4>\s*([\s\S]*?)\s*<br\s*\/?>/i)
  const authors = normalizeWhitespace(decodeHtmlEntities(stripTags(authorsMatch?.[1] ?? '')))

  const venueMatch = blockHtml.match(/<i>\s*([\s\S]*?)\s*<\/i>/i)
  const venue = normalizeWhitespace(decodeHtmlEntities(stripTags(venueMatch?.[1] ?? '')))

  const paragraphs = uniqueBy(
    [...blockHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((match) => normalizeWhitespace(decodeHtmlEntities(stripTags(match[1] ?? ''))))
      .filter(Boolean),
    (p) => p
  )

  const abstract =
    paragraphs
      .filter((p) => p.length > 80)
      .sort((a, b) => b.length - a.length)[0] ?? ''

  const allLinks = [...blockHtml.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => {
      const href = new URL(match[1], baseUrl).toString()
      const text = normalizeWhitespace(decodeHtmlEntities(stripTags(match[2] ?? '')))
      return { href, text }
    })
    .filter((link) => link.href)

  const links = uniqueBy(
    allLinks
      .filter((link) => link.href !== primaryLink)
      .map((link) => ({ label: labelForLink(link.href, link.text), url: link.href })),
    (link) => link.url
  )

  if (!title) return null

  return {
    id: slugify(title) || undefined,
    title,
    authors: authors || undefined,
    venue: venue || undefined,
    abstract: abstract || undefined,
    primaryLink: primaryLink || undefined,
    links: links.length > 0 ? links : undefined
  }
}

async function main() {
  const { url, output } = parseArgs(process.argv.slice(2))

  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Failed to fetch publications from ${url}: ${response.status} ${response.statusText}`)
    process.exit(1)
  }

  const html = await response.text()
  const blocks = [...html.matchAll(/<blockquote>([\s\S]*?)<\/blockquote>/gi)].map((match) => match[1])

  if (blocks.length === 0) {
    console.error(`No <blockquote> publication blocks found at ${url}`)
    process.exit(1)
  }

  const items = blocks
    .map((block) => parsePublicationBlock(block, url))
    .filter(Boolean)

  const payload = {
    source: url,
    scrapedAt: new Date().toISOString(),
    count: items.length,
    items
  }

  writeFileSync(output, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${items.length} publications to ${output}`)
}

main()
