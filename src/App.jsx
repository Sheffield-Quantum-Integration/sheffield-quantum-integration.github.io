import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import QddReviewPage from './qdd-review/QddReviewPage.jsx'
import { QDD_REVIEW_PAGE_ID, QDD_REVIEW_PATH } from './qdd-review/config.js'
import fallbackContent from './data/content-fallback.json'
import {
  NOT_FOUND_PAGE_ID,
  PAGE_META as PUBLIC_PAGE_META,
  PUBLIC_ROUTES,
  normalizePathname,
  pageIdForPublicPath,
  resolvePageMeta
} from './site/routes.js'
import { ArrowUpRight, Mail, MapPin } from 'lucide-react'
import HomeView from './components/HomeView.jsx'
import ResearchView from './components/ResearchView.jsx'
import PeopleView from './components/PeopleView.jsx'
import PublicationsView from './components/PublicationsView.jsx'
import FacilitiesView from './components/FacilitiesView.jsx'
import NewsView from './components/NewsView.jsx'
import OpportunitiesView from './components/OpportunitiesView.jsx'
import ContactView from './components/ContactView.jsx'
import NotFoundView from './components/NotFoundView.jsx'
import SiteHeader from './components/SiteHeader.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import { NavContext } from './site/nav.jsx'
import { getRecruitmentState, nextRecruitmentChange } from './site/recruitment.js'
import { useNow } from './site/useNow.js'

const ALL_ROUTES = PUBLIC_ROUTES

const QDD_MAILING_LIST_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdTm2wRqOoPqcdbOg5bcXDN9eU3bgNP61kCot0ukSE5FBayog/viewform'

const QDD_DELEGATE_SHOP_URL =
  'https://onlineshop.shef.ac.uk/conferences-and-events/faculty-of-engineering/electronic-electrical-engineering/quantum-dot-day-2026'

const QDD_EXHIBITOR_SHOP_URL =
  'https://onlineshop.shef.ac.uk/conferences-and-events/faculty-of-engineering/electronic-electrical-engineering/quantum-dot-day-26th-november-2026-sponsorship-packages'

const QDD_IOP_OPTICAL_GROUP_URL =
  'https://www.iop.org/physics-community/special-interest-groups/optical-group'

const QDD_IOP_QEP_GROUP_URL =
  'https://www.iop.org/physics-community/special-interest-groups/quantum-electronics-photonics-group'

const QDD_PI_KEM_URL = 'https://www.pi-kem.co.uk'

const QDD_AEGIQ_URL = 'https://www.aegiq.com'

const QDD_QUANTUM_DESIGN_URL = 'https://www.qd-uki.co.uk'

// Official WPM URLs from Sarah (2 Sep) and Joe’s 8 Sep committee mail.
// Joe confirmed both pages were public again on 14 Sep afternoon.
const QDD_SHOP_LIVE = true

const QDD_SESSIONS = [
  'Epitaxy / III–V emitters',
  'Colour centres / defects',
  'Colloidal / soft-matter',
  'Optics / integration / devices'
]

const QDD_CONFIRMED_INVITEDS = [
  {
    name: 'Fei Ding',
    institution: 'Leibniz University Hannover',
    session: 'Epitaxy / III–V emitters',
    url: 'https://www.fkp.uni-hannover.de/en/research-groups/group-ding'
  },
  {
    name: 'Helena Knowles',
    institution: 'University of Cambridge',
    session: 'Colour centres / defects',
    url: 'https://www.phy.cam.ac.uk/profile/dr-helena-knowles/'
  },
  {
    name: 'Sandrine Ithurria',
    institution: 'ESPCI Paris',
    session: 'Colloidal / soft-matter',
    url: 'https://blog.espci.fr/qdots/people/ithurria-2/'
  },
  {
    name: 'Tim Schröder',
    institution: 'Humboldt-Universität zu Berlin',
    session: 'Optics / integration / devices',
    url: 'https://www.physik.hu-berlin.de/en/iqp'
  }
]

const QDD_COMMITTEE = [
  { name: 'Anthony Bennett', institution: 'Cardiff University' },
  { name: 'Alistair J. Brash', institution: 'University of Sheffield' },
  { name: 'Edmund Clarke', institution: 'University of Sheffield' },
  { name: 'Mark Fox', institution: 'University of Sheffield' },
  { name: 'J.P. Hadden', institution: 'Cardiff University' },
  { name: 'Edmund Harbord', institution: 'University of Bristol' },
  { name: 'Bo Hou', institution: 'Cardiff University' },
  { name: 'Jake Iles-Smith', institution: 'University of Sheffield' },
  { name: 'Elyahou Kapon', institution: 'EPFL' },
  { name: 'Rachel A. Oliver', institution: 'University of Cambridge' }
]

const QDD_SECTION_NAV = [
  { href: '#invited', label: 'Invited' },
  { href: '#about', label: 'About' },
  { href: '#sessions', label: 'Sessions' },
  { href: '#abstracts', label: 'Abstracts' },
  { href: '#register', label: 'Register' },
  { href: '#committee', label: 'Committee' }
]

const PAGE_META = {
  ...PUBLIC_PAGE_META,
  [QDD_REVIEW_PAGE_ID]: {
    title: 'Quantum Dot Day 2026 Committee Ranking',
    description: 'Choose contributed talks for Quantum Dot Day 2026.',
    robots: 'noindex,nofollow'
  }
}

const safeSpaUrl = (value) => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return ''
  if (value.includes('://') || value.includes('\\')) return ''
  return value
}

const decodeSpaSearch = (search = '') => {
  if (search[1] !== '/') return ''
  return search
    .slice(1)
    .split('&')
    .map((segment) => segment.replace(/~and~/g, '&'))
    .join('?')
}

/** Path to route, including a GitHub Pages ?/ redirect the history rewrite has not applied yet. */
const resolveSpaPathname = () => {
  if (typeof window === 'undefined') return '/'
  const hinted = safeSpaUrl(window.__sqilSpaPath)
  if (window.__sqilSpaPath) delete window.__sqilSpaPath
  const fromQuery = safeSpaUrl(decodeSpaSearch(window.location.search))
  const nextUrl = hinted || fromQuery
  if (!nextUrl) return window.location.pathname
  const pathname = nextUrl.split(/[?#]/)[0] || '/'
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    window.history.replaceState(null, '', nextUrl)
  }
  return pathname
}

const pageIdForPathname = (pathname = '/') => {
  const normalized = normalizePathname(pathname)
  // Unlisted committee page. Do not add this path to nav, footer, sitemap, or robots.txt.
  if (normalized === QDD_REVIEW_PATH) return QDD_REVIEW_PAGE_ID
  return pageIdForPublicPath(normalized) || NOT_FOUND_PAGE_ID
}

const pathForPageId = (pageId = 'home') => {
  if (pageId === QDD_REVIEW_PAGE_ID) return QDD_REVIEW_PATH
  return ALL_ROUTES.find((link) => link.id === pageId)?.path || '/'
}

const setHeadTag = (selector, create, attribute, value) => {
  let tag = document.head.querySelector(selector)
  if (value == null) {
    tag?.remove()
    return
  }
  if (!tag) {
    tag = create()
    document.head.appendChild(tag)
  }
  tag.setAttribute(attribute, value)
}

const setMetaName = (name, content) =>
  setHeadTag(`meta[name="${name}"]`, () => Object.assign(document.createElement('meta'), { name }), 'content', content)

const setMetaProperty = (property, content) =>
  setHeadTag(
    `meta[property="${property}"]`,
    () => {
      const tag = document.createElement('meta')
      tag.setAttribute('property', property)
      return tag
    },
    'content',
    content
  )

const setCanonical = (href) =>
  setHeadTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', href)

const applyPageMeta = (pageId) => {
  const meta = resolvePageMeta(pageId, PAGE_META)
  document.title = meta.title
  setMetaName('description', meta.description)
  setMetaName('robots', meta.robots)
  setMetaName('twitter:title', meta.title)
  setMetaName('twitter:description', meta.description)
  setMetaName('twitter:image', meta.image.url)
  setMetaProperty('og:title', meta.title)
  setMetaProperty('og:description', meta.description)
  setMetaProperty('og:url', meta.url)
  setMetaProperty('og:image', meta.image.url)
  setMetaProperty('og:image:width', String(meta.image.width))
  setMetaProperty('og:image:height', String(meta.image.height))
  setMetaProperty('og:image:alt', meta.image.alt)
  setCanonical(meta.url)
}

const scrollToHash = (hash) => {
  if (!hash || hash === '#') return false
  let id = hash.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {
    // keep the raw fragment
  }
  const target = document.getElementById(id)
  if (!target) return false
  target.scrollIntoView({ block: 'start' })
  return true
}

const isPlainLeftClick = (event) =>
  event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey

const QuantumDotDayView = ({ getPathForPage, onInternalLinkClick }) => (
  <div className="qdd-page min-h-screen bg-[#0B1629] text-white selection:bg-cyan-400/30 selection:text-white">
    <header className="border-b border-white/5">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a
          href={getPathForPage('home')}
          onClick={(event) => onInternalLinkClick(event, 'home')}
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35 transition-colors hover:text-cyan-300"
        >
          SQIL
        </a>
        <nav aria-label="On this page" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {QDD_SECTION_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-cyan-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>

    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 qdd-atmosphere" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-0 max-w-6xl items-stretch lg:min-h-[calc(100svh-10rem)] lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-14 qdd-hero-copy sm:px-10 lg:py-20 lg:pr-8 lg:pl-12">
          <div className="mb-6 flex flex-wrap items-end gap-x-5 gap-y-2">
            <p className="text-[7.5rem] font-extrabold leading-none tracking-tight text-cyan-400 md:text-[9rem]">
              26
            </p>
            <div className="pb-3">
              <p className="text-2xl font-bold uppercase tracking-[0.18em] text-white md:text-3xl">
                November
              </p>
              <p className="mt-1 text-sm font-medium text-white/50">Thursday · 2026</p>
            </div>
          </div>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            Quantum Dot Day
          </h1>
          <p className="mb-6 max-w-md text-base font-light leading-relaxed text-white/70 md:text-lg">
            One-day UK meeting on quantum dots and solid-state emitters. Invited talks, contributed
            talks and posters. Sheffield Town Hall.
          </p>
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
              Invited speakers
            </p>
            <ul className="space-y-1.5">
              {QDD_CONFIRMED_INVITEDS.map((speaker) => (
                <li key={speaker.name} className="text-base text-white/80 md:text-lg">
                  <a
                    href={speaker.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-white underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
                  >
                    {speaker.name}
                  </a>
                  <span className="text-white/45"> — {speaker.institution}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-10 flex items-start gap-3 text-white/80">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
            <p className="text-base">Sheffield Town Hall, Sheffield</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            {QDD_SHOP_LIVE ? (
              <a
                href={QDD_DELEGATE_SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-sm bg-cyan-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-[#0B1629] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.35)]"
              >
                Register
              </a>
            ) : null}
            <a
              href={QDD_MAILING_LIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/45 underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
            >
              Join the mailing list
            </a>
          </div>
        </div>

        <div className="relative min-h-[42vh] overflow-hidden lg:min-h-full">
          <img
            src="/assets/quantum-dot-day.jpg"
            alt="Quantum Dot Day — Sheffield Town Hall with a quantum network overlay"
            className="absolute inset-0 h-full w-full object-cover object-[center_35%] qdd-hero-image"
            width={2050}
            height={890}
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0B1629] to-transparent lg:w-32" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B1629] to-transparent lg:hidden" />
        </div>
      </div>
    </section>

    <section id="invited" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-3 text-xl font-bold tracking-tight text-white md:text-2xl">
          Invited speakers
        </h2>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-white/55 md:text-base">
          Four committee-invited talks are confirmed.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto] lg:gap-x-4 lg:gap-y-0">
          {QDD_CONFIRMED_INVITEDS.map((speaker) => (
            <li
              key={speaker.name}
              className="flex flex-col border border-white/10 bg-white/[0.03] px-5 py-5 lg:row-span-3 lg:grid lg:grid-rows-subgrid"
            >
              <p className="text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-cyan-400/80">
                {speaker.session}
              </p>
              <a
                href={speaker.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-3 inline-flex items-baseline gap-2 text-xl font-semibold tracking-tight text-white transition-colors hover:text-cyan-300 md:text-2xl"
              >
                <span>{speaker.name}</span>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 self-center text-cyan-400/80 transition-colors group-hover:text-cyan-300"
                  aria-hidden="true"
                />
              </a>
              <p className="mt-2 text-sm text-white/50 md:text-base">{speaker.institution}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section id="about" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          About the series
        </h2>
        <div className="space-y-5 text-sm leading-relaxed text-white/60 md:text-base">
          <p>
            Quantum Dot Day brings together researchers working on quantum optics, spectroscopy,
            spin physics, transport, devices and applications, synthesis and growth of semiconductor
            quantum dots, and defect-centre quantum emitters in diamond, silicon carbide,
            III-nitrides and other materials.
          </p>
          <p>
            The 2026 meeting, hosted by the University of Sheffield, keeps the broader scope of
            Cardiff 2025 — colour centres and related emitters as well as epitaxial dots — with four
            invited talks plus contributed talks and posters.
          </p>
          <p>
            This is the latest in a series of one-day workshops previously held in Bristol,
            Lancaster, Sheffield, Edinburgh, Cambridge, Imperial College, Nottingham, Manchester,
            University College London, and Cardiff.
          </p>
          <p>
            Generously supported by the{' '}
            <a
              href={QDD_IOP_OPTICAL_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              IOP Optical Group
            </a>{' '}
            and the{' '}
            <a
              href={QDD_IOP_QEP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              IOP Quantum, Electronics and Photonics Group
            </a>
            .
          </p>
        </div>
      </div>
    </section>

    <section id="sessions" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">Sessions</h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {QDD_SESSIONS.map((session, index) => (
            <li
              key={session}
              className="flex gap-3 border border-white/10 bg-white/[0.03] px-4 py-3.5"
            >
              <span className="text-xs font-bold tabular-nums text-cyan-400/80">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-white/80 md:text-base">{session}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section id="abstracts" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          Contributed talks and posters
        </h2>
        <p className="text-sm leading-relaxed text-white/60 md:text-base">
          Abstracts for contributed talks and posters closed on{' '}
          <strong className="font-semibold text-white">Thursday 8 October 2026</strong>. Registration
          remains open.
        </p>
      </div>
    </section>

    <section id="register" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          Registration
        </h2>
        {QDD_SHOP_LIVE ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-white/60 md:text-base">
              Delegate tickets (standard £80 / student £60) are on the University shop. Last booking
              Friday 13 November.
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <a
                href={QDD_DELEGATE_SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-sm bg-cyan-500 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#0B1629] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.35)]"
              >
                Delegate tickets
              </a>
              <a
                href={QDD_EXHIBITOR_SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-sm border border-cyan-400/70 px-6 py-3 text-sm font-bold uppercase tracking-wider text-cyan-200 transition-all duration-300 hover:border-cyan-300 hover:text-white"
              >
                Exhibitors and sponsors
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm leading-relaxed text-white/60 md:text-base">
              Delegate tickets (standard £80 / student £60) and exhibitor packages will be on the
              University shop. Last booking Friday 13 November. The shop pages are temporarily
              unavailable — email{' '}
              <a
                href="mailto:joe.a.smith@sheffield.ac.uk"
                className="text-cyan-200 underline-offset-4 hover:underline"
              >
                joe.a.smith@sheffield.ac.uk
              </a>{' '}
              if you need to book, or join the mailing list.
            </p>
            <a
              href={QDD_MAILING_LIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-sm bg-cyan-500 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#0B1629] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.35)]"
            >
              Join the mailing list
            </a>
          </>
        )}
      </div>
    </section>

    <section id="committee" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">
          Organising committee
        </h2>
        <p className="mb-6 border-l-2 border-cyan-400/70 pl-4 text-sm text-white/80 md:text-base">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
            Chair / local host
          </span>
          <span className="mt-1 block font-medium text-white">Joe A. Smith</span>
          <span className="text-white/50">University of Sheffield</span>
        </p>
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {QDD_COMMITTEE.map((member) => (
            <li key={member.name}>
              <p className="text-sm font-medium text-white md:text-base">{member.name}</p>
              <p className="text-sm text-white/45">{member.institution}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section aria-labelledby="qdd-sponsors" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 id="qdd-sponsors" className="mb-8 text-xl font-bold tracking-tight text-white md:text-2xl">
          Sponsors
        </h2>
        <ul className="flex flex-wrap items-center gap-4">
          <li>
            <a
              href={QDD_PI_KEM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PI-KEM"
              className="flex h-28 items-center justify-center bg-white px-6"
            >
              <img src="/assets/pi-kem-logo.jpg" alt="PI-KEM" className="h-20 w-20 object-contain" />
            </a>
          </li>
          <li>
            <a
              href={QDD_AEGIQ_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Aegiq"
              className="flex h-28 items-center justify-center bg-white px-8"
            >
              <img src="/assets/aegiq-logo.svg" alt="Aegiq" className="h-12 w-auto" />
            </a>
          </li>
          <li>
            <a
              href={QDD_QUANTUM_DESIGN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Quantum Design UK and Ireland"
              className="flex h-28 items-center justify-center bg-white px-6"
            >
              <img
                src="/assets/quantum-design-logo.jpg"
                alt="Quantum Design"
                className="h-16 w-auto object-contain"
              />
            </a>
          </li>
        </ul>
      </div>
    </section>

    <section className="border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            Sheffield Town Hall reception suite, city centre, next to Sheffield station.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            Joe A. Smith,{' '}
            <a
              href="mailto:joe.a.smith@sheffield.ac.uk"
              className="text-cyan-200 underline-offset-4 hover:underline"
            >
              joe.a.smith@sheffield.ac.uk
            </a>
          </p>
        </div>
        <a
          href={QDD_MAILING_LIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/45 underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
        >
          Join the mailing list
        </a>
      </div>
    </section>

    <footer className="border-t border-white/10 bg-[#08101f] px-6 py-7">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 text-xs text-white/40 sm:flex-row sm:items-center">
        <p>
          University of Sheffield
          <span className="mx-2 text-white/20">·</span>
          <a
            href={getPathForPage('home')}
            onClick={(event) => onInternalLinkClick(event, 'home')}
            className="text-white/50 transition-colors hover:text-cyan-300"
          >
            SQIL
          </a>
        </p>
        <p className="text-white/30">Quantum Dot Day · 26 November 2026</p>
      </div>
    </footer>

    <style>{`
      html {
        scroll-behavior: smooth;
      }
      .qdd-atmosphere {
        background:
          radial-gradient(ellipse 50% 40% at 15% 30%, rgba(34, 211, 238, 0.08), transparent 60%),
          radial-gradient(ellipse 40% 35% at 85% 70%, rgba(34, 211, 238, 0.05), transparent 55%);
      }
      .qdd-hero-image {
        animation: qddKenBurns 22s ease-out forwards;
      }
      .qdd-hero-copy {
        animation: qddRise 0.85s ease-out both;
      }
      @keyframes qddKenBurns {
        from { transform: scale(1.02); }
        to { transform: scale(1); }
      }
      @keyframes qddRise {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .qdd-hero-image,
        .qdd-hero-copy {
          animation: none;
        }
      }
    `}</style>
  </div>
)

export default function App() {
  const [route, setRoute] = useState(() => ({
    pageId: typeof window === 'undefined' ? 'home' : pageIdForPathname(resolveSpaPathname()),
    hash: typeof window === 'undefined' ? '' : window.location.hash,
    key: 0,
    source: 'load'
  }))
  const activePage = route.pageId
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [content, setContent] = useState(fallbackContent)
  const mainRef = useRef(null)

  const navigateTo = (pageId, hash = '') => {
    const nextPageId = ALL_ROUTES.some((link) => link.id === pageId) ? pageId : 'home'
    const nextUrl = `${pathForPageId(nextPageId)}${hash}`

    if (typeof window !== 'undefined') {
      const currentUrl = `${normalizePathname(window.location.pathname)}${window.location.search}${window.location.hash}`
      if (currentUrl !== nextUrl) {
        window.history.pushState({}, '', nextUrl)
      }
    }

    setRoute((prev) => ({ pageId: nextPageId, hash, key: prev.key + 1, source: 'push' }))
    setMobileMenuOpen(false)
  }

  const onInternalLinkClick = (event, pageId, hash = '') => {
    if (!isPlainLeftClick(event)) return
    event.preventDefault()
    navigateTo(pageId, hash)
  }

  useEffect(() => {
    const syncRouteFromLocation = () => {
      const nextPageId = pageIdForPathname(resolveSpaPathname())

      // Unknown paths keep their URL so the not-found view describes what was requested.
      if (nextPageId !== NOT_FOUND_PAGE_ID) {
        const normalizedPath = pathForPageId(nextPageId)
        if (window.location.pathname !== normalizedPath) {
          window.history.replaceState({}, '', `${normalizedPath}${window.location.search}${window.location.hash}`)
        }
      }

      setRoute((prev) => ({ pageId: nextPageId, hash: window.location.hash, key: prev.key + 1, source: 'pop' }))
      setMobileMenuOpen(false)
    }

    syncRouteFromLocation()
    window.addEventListener('popstate', syncRouteFromLocation)
    return () => window.removeEventListener('popstate', syncRouteFromLocation)
  }, [])

  useEffect(() => {
    if (!scrollToHash(route.hash)) window.scrollTo(0, 0)
    if (route.source === 'push') mainRef.current?.focus({ preventScroll: true })
  }, [route.key])

  useEffect(() => {
    let cancelled = false
    const loadContent = async () => {
      try {
        const response = await fetch(`/data/site-content.json?v=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        if (!response.ok) throw new Error('Failed to load content JSON')
        const data = await response.json()
        if (!cancelled) {
          setContent(data)
        }
      } catch (error) {
        console.error('Falling back to bundled content:', error)
        if (!cancelled) {
          setContent(fallbackContent)
        }
      }
    }

    loadContent()
    return () => {
      cancelled = true
    }
  }, [])

  const opportunities = content.opportunitiesPage
  const now = useNow(nextRecruitmentChange(opportunities, Date.now()))
  const recruitment = getRecruitmentState(opportunities, now)
  const getPathForPage = (pageId) => pathForPageId(pageId)
  const nav = useMemo(() => ({ pathFor: pathForPageId, onLinkClick: onInternalLinkClick }), [])

  useLayoutEffect(() => {
    applyPageMeta(activePage)
  }, [activePage])

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomeView content={content} recruitment={recruitment} />
      case 'research':
        return <ResearchView research={content.researchPage} recruitment={recruitment} />
      case 'people':
        return <PeopleView people={content.peoplePage} />
      case 'publications':
        return <PublicationsView />
      case 'facilities':
        return <FacilitiesView facilities={content.facilitiesPage} />
      case 'news':
        return <NewsView />
      case 'opportunities':
        return <OpportunitiesView opportunities={opportunities} contact={content.contactPage} recruitment={recruitment} />
      case 'contact':
        return <ContactView contact={content.contactPage} />
      case 'quantum-dot-day':
        return (
          <QuantumDotDayView
            getPathForPage={getPathForPage}
            onInternalLinkClick={onInternalLinkClick}
          />
        )
      case QDD_REVIEW_PAGE_ID:
        return <QddReviewPage />
      default:
        return <NotFoundView />
    }
  }

  const isEventMicrosite = activePage === 'quantum-dot-day' || activePage === QDD_REVIEW_PAGE_ID

  if (isEventMicrosite) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#0B1629] font-sans text-white">
        <main id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          {renderPage()}
        </main>
      </div>
    )
  }

  return (
    <NavContext.Provider value={nav}>
      <div className="sqil-site min-h-screen overflow-x-hidden bg-navy-950 font-sans text-slate-300 selection:bg-amber-400/30 selection:text-white">
        <a
          href="#main"
          className="sr-only rounded-md bg-amber-400 px-4 py-2 font-semibold text-navy-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60]"
        >
          Skip to main content
        </a>
        <SiteHeader activePage={activePage} menuOpen={mobileMenuOpen} setMenuOpen={setMobileMenuOpen} />
        <main id="main" ref={mainRef} tabIndex={-1} className="pt-16 outline-none">
          {renderPage()}
        </main>
        <SiteFooter footer={content.footer} recruitment={recruitment} />
      </div>
    </NavContext.Provider>
  )
}
