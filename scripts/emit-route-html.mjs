// Postbuild: write one HTML file per public route from the built shell, each with
// its own title, description, canonical and social metadata. This is metadata
// emission only; page content still renders client-side.
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PUBLIC_ROUTES, routeHtmlFile } from '../src/site/routes.js'
import { renderRouteHtml } from './lib/route-html.mjs'

const dist = join(process.cwd(), 'dist')
const shell = await readFile(join(dist, 'index.html'), 'utf8')

for (const route of PUBLIC_ROUTES) {
  const file = routeHtmlFile(route.path)
  await writeFile(join(dist, file), renderRouteHtml(shell, route.id))
  console.log(`emitted dist/${file} for ${route.path}`)
}
