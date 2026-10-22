// Static preview that approximates GitHub Pages file lookup, so a missing route
// file shows up as a real 404 instead of being masked by Vite's SPA fallback.
// Lookup order: exact file, `<path>.html`, `<path>/index.html` (301 to add the
// slash), otherwise 404 with the body of 404.html.
// Usage: node scripts/serve-pages.mjs [dir=dist] [port=4173]
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] || 'dist')
const port = Number(process.argv[3] || 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
}

const isFile = async (path) => {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

const send = async (res, status, path, headers = {}) => {
  const body = await readFile(path)
  res.writeHead(status, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', ...headers })
  res.end(body)
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  let pathname
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    pathname = url.pathname
  }
  const target = normalize(join(root, pathname))
  if (!target.startsWith(root)) {
    res.writeHead(400).end()
    return
  }

  if (pathname.endsWith('/')) {
    if (await isFile(join(target, 'index.html'))) return send(res, 200, join(target, 'index.html'))
  } else {
    if (await isFile(target)) return send(res, 200, target)
    if (await isFile(`${target}.html`)) return send(res, 200, `${target}.html`)
    if (await isFile(join(target, 'index.html'))) {
      res.writeHead(301, { location: `${url.pathname}/${url.search}` }).end()
      return
    }
  }

  const notFound = join(root, '404.html')
  if (await isFile(notFound)) return send(res, 404, notFound)
  res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
}).listen(port, () => {
  console.log(`GitHub Pages-style preview of ${root} on http://localhost:${port}`)
})
