// Public routes and their metadata. Imported by the app and by
// scripts/emit-route-html.mjs, so keep this module free of browser and JSX code.

export const SITE_URL = 'https://sqil.shef.ac.uk'
export const SITE_NAME = 'Sheffield Quantum Integration Lab (SQIL)'

export const DEFAULT_SOCIAL_IMAGE = {
  path: '/assets/social-card.png',
  width: 1200,
  height: 630,
  alt: 'Sheffield Quantum Integration Lab, University of Sheffield'
}

export const NAV_LINKS = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'research', label: 'Research', path: '/research' },
  { id: 'people', label: 'People', path: '/people' },
  { id: 'publications', label: 'Publications', path: '/publications' },
  { id: 'facilities', label: 'Facilities', path: '/facilities' },
  { id: 'news', label: 'News & Events', path: '/news' },
  { id: 'opportunities', label: 'Opportunities', path: '/opportunities' },
  { id: 'contact', label: 'Contact', path: '/contact' }
]

/** Routes kept out of the main nav (e.g. event microsites). */
export const EXTRA_ROUTES = [{ id: 'quantum-dot-day', label: 'Quantum Dot Day', path: '/qdd' }]

/** Old paths that resolve to an existing page id (the canonical path comes from the route list). */
export const PATH_ALIASES = {
  '/quantum-dot-day': 'quantum-dot-day'
}

/** Every route that gets its own emitted HTML file. */
export const PUBLIC_ROUTES = [...NAV_LINKS, ...EXTRA_ROUTES]

export const NOT_FOUND_PAGE_ID = 'not-found'

export const PAGE_META = {
  home: {
    title: 'Sheffield Quantum Integration Lab (SQIL)',
    description:
      'SQIL at the University of Sheffield takes diamond quantum sensors from the physics lab to the chip, using photonic circuits, cavities, microwave electronics and robotics.',
    preloadImage: {
      srcSet: '/assets/hero-imec-chip-5x-800.jpg 800w, /assets/hero-imec-chip-5x-1400.jpg 1400w',
      sizes: '(min-width: 1024px) 560px, calc(100vw - 48px)'
    }
  },
  research: {
    title: 'Research | SQIL',
    description:
      'SQIL research on photonic-integrated NV diamond sensor arrays, silicon photonics, cavity-enhanced sensors, scalable control electronics and quantum sensing.'
  },
  people: {
    title: 'People | SQIL',
    description:
      'Meet the SQIL team at the University of Sheffield: principal investigator, postdoctoral researchers, PhD students, visitors, collaborators and alumni.'
  },
  publications: {
    title: 'Publications | SQIL',
    description:
      'Selected publications and preprints from SQIL on integrated quantum photonics, NV diamond sensors, spin control electronics and robotic quantum sensing.'
  },
  facilities: {
    title: 'Facilities | SQIL',
    description:
      'Explore facilities used by SQIL, including fabrication and characterisation infrastructure.'
  },
  news: {
    title: 'News & Events | SQIL',
    description: 'Latest news, events and announcements from SQIL.'
  },
  opportunities: {
    title: 'Opportunities | SQIL',
    description:
      'PhD studentships and postdoctoral roles at SQIL, the Sheffield Quantum Integration Lab, University of Sheffield.'
  },
  contact: {
    title: 'Contact | SQIL',
    description:
      'Contact SQIL at the University of Sheffield about collaborations and PhD opportunities.'
  },
  'quantum-dot-day': {
    title: 'Quantum Dot Day | 26 November 2026',
    description:
      'Thursday 26 November 2026 at Sheffield Town Hall. Abstracts are closed. Registration open. Invited speakers: Fei Ding, Helena Knowles, Sandrine Ithurria and Tim Schröder.',
    image: {
      path: '/assets/quantum-dot-day.jpg',
      width: 2050,
      height: 890,
      alt: 'Quantum Dot Day — Sheffield Town Hall with a quantum network overlay'
    }
  },
  [NOT_FOUND_PAGE_ID]: {
    title: 'Page not found | SQIL',
    description: 'This page could not be found on the Sheffield Quantum Integration Lab website.',
    robots: 'noindex'
  }
}

/** Trailing-slash policy: no trailing slash except the root. */
export const normalizePathname = (pathname = '/') => pathname.replace(/\/+$/, '') || '/'

export const canonicalUrl = (path) => `${SITE_URL}${path === '/' ? '/' : normalizePathname(path)}`

/** GitHub Pages serves `/research` from `research.html` with a 200. */
export const routeHtmlFile = (path) => (path === '/' ? 'index.html' : `${normalizePathname(path).slice(1)}.html`)

export const pathForRouteId = (pageId) => PUBLIC_ROUTES.find((route) => route.id === pageId)?.path

export const pageIdForPublicPath = (pathname) => {
  const normalized = normalizePathname(pathname)
  return PATH_ALIASES[normalized] || PUBLIC_ROUTES.find((route) => route.path === normalized)?.id || null
}

/** Resolved head metadata for a page id. `url` is null for pages that must not be canonical. */
export const resolvePageMeta = (pageId, pageMeta = PAGE_META) => {
  const meta = pageMeta[pageId] || pageMeta[NOT_FOUND_PAGE_ID]
  const path = pathForRouteId(pageId)
  const image = meta.image || DEFAULT_SOCIAL_IMAGE
  return {
    title: meta.title,
    description: meta.description,
    robots: meta.robots || 'index,follow',
    url: path && !meta.robots ? canonicalUrl(path) : null,
    image: { ...image, url: `${SITE_URL}${image.path}` },
    preloadImage: meta.preloadImage || null
  }
}
