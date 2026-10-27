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
import { ArrowUpRight, Mail, MapPin, Trophy } from 'lucide-react'
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
  'Colloidal / soft-matter',
  'Colour centres / defects',
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

// ---- Quantum Dot Day 2026 programme (paste below QDD_COMMITTEE in src/App.jsx) ----
// All times UK (GMT). Invited 30 min, contributed 15 min.
const QDD_PROGRAMME = [
  { type: 'break', time: '09:00', end: '09:30', title: 'Registration and coffee' },
  { type: 'break', time: '09:30', end: '09:35', title: 'Welcome' },
  {
    type: 'session',
    numeral: 'I',
    time: '09:35',
    end: '11:05',
    title: 'Epitaxy / III–V emitters',
    chair: 'Edmund Harbord (University of Bristol)',
    talks: [
      { time: '09:35', speaker: 'Fei Ding', institution: 'Leibniz University Hannover', title: 'Connecting the Dots: From Semiconductor Quantum Emitters to Quantum Networks', invited: true },
      { time: '10:05', speaker: 'Chunyu Zhao', institution: 'University of Cambridge', title: 'Polarised Cathodoluminescence Properties of InGaN Quantum Dots Grown by Modified Droplet Epitaxy', invited: false },
      { time: '10:20', speaker: 'Guoliang Zhou', institution: 'University of Sheffield', title: 'Site-control of InAs quantum dots on InP by droplet epitaxy in MOVPE', invited: false },
      { time: '10:35', speaker: 'Valdemar Bille-Lauridsen', institution: 'Technical University of Denmark (DTU)', title: 'Lithographically defined quantum-dot-scale active regions in InP nanocavities', invited: false },
      { time: '10:50', speaker: 'Christopher Broderick', institution: 'Tyndall National Institute, University College Cork', title: 'The QUantum Dot Open-source Simulator (QUDOS)', invited: false },
    ]
  },
  { type: 'break', time: '11:05', end: '11:30', title: 'Coffee and posters' },
  {
    type: 'session',
    numeral: 'II',
    time: '11:30',
    end: '13:00',
    title: 'Colloidal / soft-matter',
    chair: 'Bo Hou (Cardiff University)',
    talks: [
      { time: '11:30', speaker: 'Sandrine Ithurria', institution: 'ESPCI Paris', title: 'Title to be confirmed', invited: true },
      { time: '12:00', speaker: 'Sruthi Raj Sreeraj', institution: 'University of Manchester', title: 'Nanocrystals Doped by Single Rare Earth Ions for Quantum Memories and Repeaters', invited: false },
      { time: '12:15', speaker: 'Peter Matthews', institution: 'Keele University', title: 'InProving QDs: Controlling the size and emission quality of InP', invited: false },
      { time: '12:30', speaker: 'Nicolas Laurand', institution: 'University of Strathclyde', title: 'Beyond Individual Quantum Dots: Self-Assembled Supraparticles for Lasing, Sensing, and Integrated Photonics', invited: false },
      { time: '12:45', speaker: 'Sri Datta Aneesh Chodavarapu', institution: 'Cardiff University', title: 'Inkjet Printed Colloidal Quantum Dot Opto-electronics for Visible Light Communication and Optical Interconnects applications', invited: false },
    ]
  },
  { type: 'break', time: '13:00', end: '13:50', title: 'Lunch and posters' },
  {
    type: 'session',
    numeral: 'III',
    time: '13:50',
    end: '15:05',
    title: 'Colour centres / defects',
    chair: 'To be confirmed',
    talks: [
      { time: '13:50', speaker: 'Helena Knowles', institution: 'University of Cambridge', title: 'Title to be confirmed', invited: true },
      { time: '14:20', speaker: 'Anne-Sophie Korotov', institution: 'University of Oxford', title: 'Scalable fabrication of microlenses in diamond membranes for efficient photonic interfaces in quantum networks', invited: false },
      { time: '14:35', speaker: 'Kieran Ramaswami', institution: 'University of Manchester', title: 'Generation and high-throughput down-selection of lead-vacancy centres in nanodiamonds for non-classical emitters', invited: false },
      { time: '14:50', speaker: 'Maxim Makhonin', institution: 'University of Sheffield', title: 'NV Centres Photoluminescence Enhancement in diamond by confined excitation in a Heterogeneously Integrated Planar DBR Cavity', invited: false },
    ]
  },
  { type: 'break', time: '15:05', end: '15:30', title: 'Coffee and posters' },
  {
    type: 'session',
    numeral: 'IV',
    time: '15:30',
    end: '16:30',
    title: 'Optics / integration / devices',
    chair: 'Joe A. Smith (University of Sheffield)',
    talks: [
      { time: '15:30', speaker: 'Tim Schröder', institution: 'Humboldt-Universität zu Berlin', title: 'Title to be confirmed', invited: true },
      { time: '16:00', speaker: 'Savvas Germanis', institution: 'University of Sheffield', title: 'Electrical Control of Chiral Emission from a Single InAs Quantum Dot in a Glide-Plane Photonic Crystal Waveguide', invited: false },
      { time: '16:15', speaker: 'Alfie Broughton', institution: 'Cardiff University', title: 'Single-photon frequency combs for quantum networking using a single mode photonic crystal fibre', invited: false },
    ]
  },
  { type: 'break', time: '16:30', end: '16:40', title: 'Closing remarks and poster prizes' },
  { type: 'break', time: '16:40', end: '17:00', title: 'Close (venue clear by 17:00)' }
]

const QDD_POSTERS = [
  { theme: 'Epitaxy / III–V emitters', speaker: 'Benyam Dejen', institution: 'University of Cambridge', title: 'Towards single-shot readout of a cavity-coupled quantum dot qubit' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'William Marsden', institution: 'University of Sheffield', title: 'Spatial and spectral characterisation of low density GaAs/AlGaAs multi-quantum dot sites grown by local-droplet epitaxy' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Sion Meredith', institution: 'University of Manchester', title: 'Efficient optimisation of multi-parameter quantum control protocols for strongly-coupled systems' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Toby Rawlings', institution: 'University of Sheffield', title: 'Resonant Photon Correlation Noise Spectroscopy of Single Quantum Emitters' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Elisa M Sala', institution: 'University of Sheffield', title: 'Exploring the MOVPE growth of Droplet Epitaxy InAs/InP Quantum Dots for Quantum Photonic Applications' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Mateusz Salamon', institution: 'University of Manchester', title: 'Influence of Phonon Interactions on Frequency-Filtered Multi-Photon Correlations from Quantum Dots' },
  { theme: 'Epitaxy / III–V emitters', speaker: 'Alex Thomas', institution: 'University of Bristol', title: 'Partially Etched Pillars' },
  { theme: 'Colloidal / soft-matter', speaker: 'Renesa Dasgupta', institution: 'King\'s College London', title: 'Engineering gold-based quantum dots for image guided surgery in glioblastoma' },
  { theme: 'Colloidal / soft-matter', speaker: 'Robert Dimitrov', institution: 'Cardiff University', title: 'Elemental Doping of InP Colloidal Quantum Dots: A Step Towards Room-Temperature Ferromagnetism in Quantum Dots' },
  { theme: 'Colloidal / soft-matter', speaker: 'Charlotte Eling', institution: 'University of Strathclyde', title: 'A Quantum Dot-Based Platform for Optical Detection and Photocatalytic Elimination of Wound Pathogens' },
  { theme: 'Colloidal / soft-matter', speaker: 'Christian Maddox', institution: 'University of Manchester', title: 'Silver Source Injection Approach to Synthesis of Five-Metal (AgInGaMnZn)S Quantum Dots' },
  { theme: 'Colloidal / soft-matter', speaker: 'Angelos Seizas', institution: 'Cardiff University', title: 'Symmetry-resolved phonon-mediated dark-to-bright exciton transitions in wurtzite CdSe quantum dots' },
  { theme: 'Colour centres / defects', speaker: 'Teymour Talha-Dean', institution: 'University of Sheffield', title: 'NV centers for the dynamic tracking of magnetically labelled bacteria' },
  { theme: 'Colour centres / defects', speaker: 'Jack Wall', institution: 'University of Sheffield', title: 'The Transition into Industrial-Standard NV Centre Thermometers' },
  { theme: 'Optics / integration / devices', speaker: 'Anatoliy Antill', institution: 'University of Sheffield', title: 'NV Center Enhancement Using a Heterogeneously Integrated Planar-Planar DBR Cavity' },
  { theme: 'Optics / integration / devices', speaker: 'Rohin Bardhan', institution: 'University of Manchester', title: 'A Photonic Structure for a Colloidal Quantum Dot based Quantum Information Device' }
]

const QDD_SECTION_NAV = [
  { href: '#programme', label: 'Programme' },
  { href: '#posters', label: 'Posters' },
  { href: '#about', label: 'About' },
  { href: '#abstracts', label: 'Abstracts' },
  { href: '#register', label: 'Register' },
  { href: '#committee', label: 'Committee' },
  { href: '#sponsors', label: 'Sponsors' }
]

const QDD_INVITED_URLS = Object.fromEntries(QDD_CONFIRMED_INVITEDS.map((speaker) => [speaker.name, speaker.url]))

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

// ---- Quantum Dot Day 2026: styled programme + posters (styled variant) ----
const QDD_EVENT_START_MS = Date.UTC(2026, 10, 26, 9, 0, 0) // 26 Nov 2026 09:00 UK (GMT)
const QDD_EVENT_END_MS = Date.UTC(2026, 10, 26, 17, 0, 0)
const QDD_LAST_BOOKING_LABEL = 'Friday 13 November'

// Full class strings so Tailwind keeps them. One accent per session theme.
const QDD_THEME_STYLE = {
  'Epitaxy / III–V emitters': {
    text: 'text-cyan-300', border: 'border-cyan-400/40', bar: 'bg-cyan-400', soft: 'bg-cyan-400/10',
    ring: 'hover:border-cyan-300/70', glow: 'rgba(34,211,238,0.30)', badge: 'bg-cyan-400 text-[#0B1629]'
  },
  'Colloidal / soft-matter': {
    text: 'text-fuchsia-300', border: 'border-fuchsia-400/40', bar: 'bg-fuchsia-400', soft: 'bg-fuchsia-400/10',
    ring: 'hover:border-fuchsia-300/70', glow: 'rgba(232,121,249,0.28)', badge: 'bg-fuchsia-400 text-[#0B1629]'
  },
  'Colour centres / defects': {
    text: 'text-emerald-300', border: 'border-emerald-400/40', bar: 'bg-emerald-400', soft: 'bg-emerald-400/10',
    ring: 'hover:border-emerald-300/70', glow: 'rgba(52,211,153,0.28)', badge: 'bg-emerald-400 text-[#0B1629]'
  },
  'Optics / integration / devices': {
    text: 'text-amber-300', border: 'border-amber-400/40', bar: 'bg-amber-400', soft: 'bg-amber-400/10',
    ring: 'hover:border-amber-300/70', glow: 'rgba(251,191,36,0.26)', badge: 'bg-amber-400 text-[#0B1629]'
  }
}
const qddThemeStyle = (theme) => QDD_THEME_STYLE[theme] || QDD_THEME_STYLE['Epitaxy / III–V emitters']

const QDD_PROGRAMME_SESSIONS = QDD_PROGRAMME.filter((item) => item.type === 'session')
const QDD_SPEAKER_COUNT = QDD_PROGRAMME_SESSIONS.reduce((n, s) => n + s.talks.length, 0)
const QDD_INVITED_COUNT = QDD_PROGRAMME_SESSIONS.reduce(
  (n, s) => n + s.talks.filter((t) => t.invited).length,
  0
)
const QDD_INSTITUTION_COUNT = new Set([
  ...QDD_PROGRAMME_SESSIONS.flatMap((s) => s.talks.map((t) => t.institution)),
  ...QDD_POSTERS.map((p) => p.institution)
]).size
const qddSessionId = (numeral) => `session-${numeral.toLowerCase()}`

// Soft glowing points of light behind a section. Static when the user prefers reduced motion.
const QDD_GLOW_POINTS = [
  { x: '8%', y: '6%', s: 220, d: '7s' }, { x: '78%', y: '14%', s: 260, d: '9s' },
  { x: '30%', y: '38%', s: 180, d: '8s' }, { x: '88%', y: '52%', s: 240, d: '10s' },
  { x: '4%', y: '70%', s: 260, d: '9s' }, { x: '60%', y: '84%', s: 200, d: '7.5s' }
]
const QddGlowField = ({ themes }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    {QDD_GLOW_POINTS.map((point, index) => (
      <span
        key={index}
        className="absolute rounded-full blur-2xl motion-safe:animate-pulse"
        style={{
          left: point.x,
          top: point.y,
          width: point.s,
          height: point.s,
          background: `radial-gradient(circle, ${qddThemeStyle(themes[index % themes.length]).glow} 0%, transparent 70%)`,
          animationDuration: point.d,
          animationDelay: `${index * 0.7}s`
        }}
      />
    ))}
  </div>
)

const qddCountdownParts = (now) => {
  const ms = Math.max(QDD_EVENT_START_MS - now, 0)
  const minutes = Math.floor(ms / 60_000)
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60, done: ms === 0 }
}

const QddCountdown = () => {
  const now = useNow(QDD_EVENT_START_MS, 30_000)
  const { days, hours, minutes, done } = qddCountdownParts(now)
  if (done) {
    if (now > QDD_EVENT_END_MS) return null
    return <p className="text-sm font-semibold text-cyan-200">Quantum Dot Day is under way. Welcome!</p>
  }
  const cells = [
    { value: days, label: days === 1 ? 'day' : 'days' },
    { value: hours, label: hours === 1 ? 'hour' : 'hours' },
    { value: minutes, label: minutes === 1 ? 'min' : 'mins' }
  ]
  return (
    <div aria-label={`${days} days, ${hours} hours and ${minutes} minutes until Quantum Dot Day`} role="timer">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Starts in</p>
      <div className="flex gap-2" aria-hidden="true">
        {cells.map((cell) => (
          <div key={cell.label} className="min-w-[4.25rem] rounded-sm border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
            <span className="block text-2xl font-extrabold tabular-nums text-white md:text-3xl">{cell.value}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{cell.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const QddJumpLinks = ({ compact = false }) => (
  <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
    {QDD_PROGRAMME_SESSIONS.map((session) => {
      const style = qddThemeStyle(session.title)
      return (
        <li key={session.numeral} className="shrink-0">
          <a
            href={`#${qddSessionId(session.numeral)}`}
            className={`inline-flex items-center gap-2 rounded-full border ${style.border} ${style.soft} px-3 py-1.5 text-xs font-semibold text-white/85 transition-colors hover:text-white`}
          >
            <span className={`h-2 w-2 rounded-full ${style.bar}`} aria-hidden="true" />
            <span className="tabular-nums text-white/55">{session.time}</span>
            <span>{compact ? `Session ${session.numeral}` : `${session.numeral} · ${session.title}`}</span>
          </a>
        </li>
      )
    })}
    <li className="shrink-0">
      <a
        href="#posters"
        className="inline-flex items-center rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:text-white"
      >
        Posters
      </a>
    </li>
  </ul>
)

const QddProgrammeStyled = () => {
  const inlineBarRef = useRef(null)
  const sectionRef = useRef(null)
  const [showFixedBar, setShowFixedBar] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    let barAbove = false
    let sectionVisible = false
    const update = () => setShowFixedBar(barAbove && sectionVisible)
    const barObserver = new IntersectionObserver(([entry]) => {
      barAbove = !entry.isIntersecting && entry.boundingClientRect.top < 0
      update()
    })
    const sectionObserver = new IntersectionObserver(([entry]) => {
      sectionVisible = entry.isIntersecting
      update()
    }, { rootMargin: '-64px 0px -40% 0px' })
    if (inlineBarRef.current) barObserver.observe(inlineBarRef.current)
    if (sectionRef.current) sectionObserver.observe(sectionRef.current)
    return () => {
      barObserver.disconnect()
      sectionObserver.disconnect()
    }
  }, [])

  return (
    <section id="programme" ref={sectionRef} className="relative scroll-mt-6 overflow-hidden border-t border-white/10">
      <QddGlowField themes={QDD_SESSIONS} />

      {/* Top band */}
      <div className="relative border-b border-white/10 bg-gradient-to-br from-cyan-400/[0.08] via-transparent to-fuchsia-400/[0.06] px-6 py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">Programme</p>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              One day. Four sessions. <span className="text-cyan-300">Quantum dots and beyond.</span>
            </h2>
            <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
              Invited talks 30 minutes, contributed talks 15 minutes. Posters are up all day.
            </p>
            <dl className="grid max-w-lg grid-cols-3 gap-3">
              {[
                { value: QDD_SPEAKER_COUNT, label: 'Speakers', note: `${QDD_INVITED_COUNT} invited` },
                { value: QDD_POSTERS.length, label: 'Posters', note: 'all day' },
                { value: QDD_INSTITUTION_COUNT, label: 'Institutions', note: 'UK and Europe' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-sm border border-white/10 bg-[#0B1629]/70 px-3 py-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">{stat.label}</dt>
                  <dd className="text-3xl font-extrabold tabular-nums text-white md:text-4xl">{stat.value}</dd>
                  <dd className="text-[11px] text-white/45">{stat.note}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-6 rounded-sm border border-cyan-400/30 bg-[#0B1629]/80 p-6 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
            <QddCountdown />
            <div>
              <a
                href={QDD_DELEGATE_SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-cyan-500 px-7 py-4 text-sm font-bold uppercase tracking-wider text-[#0B1629] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.45)]"
              >
                Book your ticket
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <p className="mt-3 text-sm text-white/70">
                <strong className="font-semibold text-white">£60</strong> student ·{' '}
                <strong className="font-semibold text-white">£80</strong> standard
              </p>
              <p className="text-xs text-white/50">
                Last booking {QDD_LAST_BOOKING_LABEL}.
              </p>
              <a
                href={QDD_EXHIBITOR_SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-white/25 px-7 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:border-cyan-300 hover:text-cyan-200"
              >
                Exhibitors and sponsors
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <p className="mt-3 text-sm text-white/70">
                Table-top stand <strong className="font-semibold text-white">£300</strong>
                {' · '}
                logo only <strong className="font-semibold text-white">£240</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Jump bar: inline, plus a fixed copy while the programme is on screen */}
      <nav aria-label="Jump to session" ref={inlineBarRef} className="relative border-b border-white/10 bg-[#0B1629]/85 px-6 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:inline">Jump to session</span>
          <QddJumpLinks />
        </div>
      </nav>
      {showFixedBar ? (
        <nav aria-label="Jump to session (pinned)" className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0B1629]/90 px-6 py-2.5 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:inline">Jump to</span>
            <QddJumpLinks compact />
          </div>
        </nav>
      ) : null}

      {/* Timeline */}
      <div className="relative px-6 py-12 md:py-16">
        <ol className="relative mx-auto max-w-5xl space-y-5 md:pl-28">
          <span className="absolute bottom-2 left-[5.25rem] top-2 hidden w-px bg-gradient-to-b from-cyan-400/50 via-fuchsia-400/40 to-amber-400/50 md:block" aria-hidden="true" />
          {QDD_PROGRAMME.map((item) => {
            if (item.type === 'break') {
              return (
                <li key={item.time} className="relative flex items-center gap-4 py-1 text-sm text-white/55">
                  <span className="w-24 shrink-0 tabular-nums text-white/45 md:absolute md:-left-28 md:w-20 md:text-right">
                    {item.time}
                  </span>
                  <span className="absolute -left-[1.6rem] hidden h-2 w-2 rounded-full bg-white/30 md:block" aria-hidden="true" />
                  <span className="flex-1 border-t border-dashed border-white/15 pt-1 md:border-0 md:pt-0">
                    {item.title} <span className="text-white/35">· until {item.end}</span>
                  </span>
                </li>
              )
            }
            const style = qddThemeStyle(item.title)
            const [invited, ...contributed] = item.talks
            return (
              <li key={item.time} id={qddSessionId(item.numeral)} className="relative scroll-mt-20">
                <span className="hidden tabular-nums md:absolute md:-left-28 md:top-6 md:block md:w-20 md:text-right md:text-sm md:font-semibold md:text-white/70">
                  {item.time}
                </span>
                <span className={`absolute -left-[1.9rem] top-7 hidden h-3.5 w-3.5 rounded-full ring-4 ring-[#0B1629] md:block ${style.bar}`} aria-hidden="true" />
                <article className={`relative overflow-hidden rounded-sm border ${style.border} bg-[#0E1B32]/90 transition-colors ${style.ring}`}>
                  <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} aria-hidden="true" />
                  <header className={`flex items-start gap-4 border-b border-white/10 ${style.soft} px-5 py-5 md:px-7`}>
                    <span className={`text-6xl font-extrabold leading-none tracking-tight md:text-7xl ${style.text}`} aria-hidden="true">
                      {item.numeral}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${style.text}`}>
                        Session {item.numeral} · {item.time}–{item.end}
                      </p>
                      <h3 className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/55">Chair: {item.chair}</p>
                    </div>
                  </header>
                  <div className="px-5 py-5 md:px-7">
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-5">
                      <span className="w-14 shrink-0 pt-1 text-sm font-semibold tabular-nums text-white/70">{invited.time}</span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {QDD_INVITED_URLS[invited.speaker] ? (
                            <a
                              href={QDD_INVITED_URLS[invited.speaker]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-bold text-white underline-offset-4 transition-colors hover:text-cyan-300 hover:underline md:text-xl"
                            >
                              {invited.speaker}
                            </a>
                          ) : (
                            <span className="text-lg font-bold text-white md:text-xl">{invited.speaker}</span>
                          )}
                          {invited.invited ? (
                            <span className={`rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${style.badge}`}>
                              Invited
                            </span>
                          ) : null}
                        </p>
                        <p className="text-sm text-white/55">{invited.institution}</p>
                        <p className={`mt-1 text-base md:text-lg ${invited.title === 'Title to be confirmed' ? 'italic text-white/45' : 'text-white/85'}`}>
                          {invited.title}
                        </p>
                      </div>
                    </div>
                    {contributed.length ? (
                      <ul className="mt-5 space-y-3 border-t border-white/10 pt-4">
                        {contributed.map((talk) => (
                          <li key={talk.time} className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-5">
                            <span className="w-14 shrink-0 tabular-nums text-white/45">{talk.time}</span>
                            <span className="min-w-0">
                              <span className="font-semibold text-white/90">{talk.speaker}</span>
                              <span className="text-white/45"> — {talk.institution}</span>
                              <span className="block text-white/65">{talk.title}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

const QddPostersStyled = () => (
  <section id="posters" className="relative scroll-mt-6 overflow-hidden border-t border-white/10 px-6 py-14 md:py-16">
    <QddGlowField themes={[...QDD_SESSIONS].reverse()} />
    <div className="relative mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Posters <span className="text-white/40">({QDD_POSTERS.length})</span>
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            On display all day in the conference room.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-sm border border-amber-400/40 bg-amber-400/10 px-4 py-3">
          <Trophy className="h-6 w-6 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-sm text-white/80">
            <strong className="block font-bold text-amber-200">Poster prizes at 16:30</strong>
            Announced in the closing remarks.
          </p>
        </div>
      </div>
      {QDD_SESSIONS.map((theme) => {
        const items = QDD_POSTERS.filter((poster) => poster.theme === theme)
        if (items.length === 0) return null
        const style = qddThemeStyle(theme)
        return (
          <div key={theme} className="mb-10 last:mb-0">
            <h3 className={`mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.text}`}>
              <span className={`h-2 w-2 rounded-full ${style.bar}`} aria-hidden="true" />
              {theme}
              <span className="text-white/35">· {items.length}</span>
            </h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((poster) => (
                <li
                  key={poster.speaker}
                  className={`relative flex flex-col overflow-hidden rounded-sm border border-white/10 bg-[#0E1B32]/90 p-4 transition-colors ${style.ring}`}
                >
                  <span className={`absolute inset-x-0 top-0 h-0.5 ${style.bar}`} aria-hidden="true" />
                  <p className="text-sm leading-snug text-white/85">{poster.title}</p>
                  <p className="mt-auto pt-3 text-xs">
                    <span className="font-semibold text-white">{poster.speaker}</span>
                    <span className="text-white/45"> — {poster.institution}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  </section>
)

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
      <div className="relative mx-auto grid max-w-6xl items-stretch lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-10 qdd-hero-copy sm:px-10 lg:py-14 lg:pr-8 lg:pl-12">
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
            One-day UK meeting on quantum dots and solid-state emitters. Sheffield Town Hall.
          </p>
          <div className="mb-6">
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
          <div className="flex items-start gap-3 text-white/80">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
            <p className="text-base">Sheffield Town Hall, Sheffield</p>
          </div>
        </div>

        <div className="relative h-36 overflow-hidden sm:h-52 lg:h-auto lg:min-h-full">
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

    <QddProgrammeStyled />

    <QddPostersStyled />

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

    <section id="sponsors" aria-labelledby="qdd-sponsors" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 id="qdd-sponsors" className="mb-3 text-xl font-bold tracking-tight text-white md:text-2xl">
          Sponsors
        </h2>
        <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
          Sponsorship packages are open.
        </p>
        <a
          href={QDD_EXHIBITOR_SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 inline-flex items-center justify-center gap-2 rounded-sm border border-cyan-400/70 px-6 py-3 text-sm font-bold uppercase tracking-wider text-cyan-200 transition-all duration-300 hover:border-cyan-300 hover:text-white"
        >
          Exhibitors and sponsors
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
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
