import { useEffect, useState } from 'react'
import fallbackContent from './data/content-fallback.json'
import {
  Menu,
  X,
  Atom,
  Cpu,
  Zap,
  Construction,
  ChevronRight,
  ArrowUpRight,
  Mail,
  MapPin,
  Twitter,
  Linkedin,
  Bot
} from 'lucide-react'

const iconMap = {
  zap: Zap,
  cpu: Cpu,
  atom: Atom,
  bot: Bot
}

const SITE_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : 'https://sqil.shef.ac.uk'

const NAV_LINKS = [
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
const EXTRA_ROUTES = [
  { id: 'quantum-dot-day', label: 'Quantum Dot Day', path: '/qdd' }
]

/** Old paths that should resolve to an existing page id (canonical path comes from EXTRA_ROUTES / NAV_LINKS). */
const PATH_ALIASES = {
  '/quantum-dot-day': 'quantum-dot-day'
}

const ALL_ROUTES = [...NAV_LINKS, ...EXTRA_ROUTES]

const QDD_REGISTER_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdTm2wRqOoPqcdbOg5bcXDN9eU3bgNP61kCot0ukSE5FBayog/viewform'

const QDD_SESSIONS = [
  'Epitaxy / III–V emitters',
  'Colour centres / defects',
  'Colloidal / soft-matter',
  'Optics / integration / devices'
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
  { href: '#about', label: 'About' },
  { href: '#sessions', label: 'Sessions' },
  { href: '#committee', label: 'Committee' }
]

const PAGE_META = {
  home: {
    title: 'Sheffield Quantum Integration Lab (SQIL)',
    description:
      'SQIL at the University of Sheffield: scalable quantum technologies using silicon photonics, microwave electronics, spin physics, and robotics.'
  },
  research: {
    title: 'Research | SQIL',
    description:
      'Research at SQIL spans silicon photonics, scalable microwave electronics, spin-photon interfaces, and robotics for quantum sensing.'
  },
  people: {
    title: 'People | SQIL',
    description:
      'Meet the SQIL team: principal investigator, researchers, students, visitors, and alumni.'
  },
  publications: {
    title: 'Publications | SQIL',
    description:
      'Publications and preprints from SQIL, including work on quantum photonics, electronics, and sensing.'
  },
  facilities: {
    title: 'Facilities | SQIL',
    description:
      'Explore facilities used by SQIL, including fabrication and characterisation infrastructure.'
  },
  news: {
    title: 'News & Events | SQIL',
    description:
      'Latest news, events, and announcements from SQIL.'
  },
  opportunities: {
    title: 'Opportunities | SQIL',
    description:
      'Current PhD studentship and postdoctoral opportunities at SQIL.'
  },
  contact: {
    title: 'Contact | SQIL',
    description:
      'Contact SQIL at the University of Sheffield for collaborations and student opportunities.'
  },
  'quantum-dot-day': {
    title: 'Quantum Dot Day | 26 November 2026',
    description:
      'Thursday 26 November 2026 at Sheffield Town Hall. Quantum Dot Day brings together researchers working on quantum optics, spectroscopy, spin physics, transport, devices and applications, synthesis and growth of semiconductor quantum dots, and defect-centre quantum emitters in diamond, silicon carbide, III-nitrides and other materials.',
    image: '/assets/quantum-dot-day.jpg'
  }
}

const normalizePathname = (pathname = '/') => {
  const withoutTrailingSlash = pathname.replace(/\/+$/, '')
  return withoutTrailingSlash || '/'
}

const pageIdForPathname = (pathname = '/') => {
  const normalized = normalizePathname(pathname)
  if (PATH_ALIASES[normalized]) return PATH_ALIASES[normalized]
  return ALL_ROUTES.find((link) => link.path === normalized)?.id || 'home'
}

const pathForPageId = (pageId = 'home') => ALL_ROUTES.find((link) => link.id === pageId)?.path || '/'

const upsertMetaByName = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const upsertMetaByProperty = (property, content) => {
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const upsertCanonical = (href) => {
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', href)
}

const isPlainLeftClick = (event) =>
  event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey

const PillarIcon = ({ type, className }) => {
  const Icon = iconMap[type?.toLowerCase()] || Atom
  return <Icon className={className} />
}

const HeroBackground = ({ image }) => (
  <div className="absolute inset-0 overflow-hidden">
    <img
      src={
        image ||
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop'
      }
      alt="Quantum Chip Background"
      className="h-full w-full object-cover opacity-50 mix-blend-screen"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[#050a14] via-[#0a0e17]/90 to-[#050a14] mix-blend-multiply" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
  </div>
)

const HomeView = ({ hero, home, pillars, joinTeamTarget, getPathForPage, onInternalLinkClick }) => (
  <div className="animate-fadeIn">
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-[#050a14] pb-20">
      <HeroBackground image={hero?.backgroundImage} />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <div className="order-2 md:order-1 md:flex-1">
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_0_25px_rgba(251,191,36,0.5)] md:text-7xl">
            {hero?.title} <br />
            <span className="bg-gradient-to-r from-amber-400 to-purple-600 bg-clip-text text-transparent">
              {hero?.highlight}
            </span>
          </h1>
          <p className="mb-8 max-w-2xl text-xl font-light text-amber-100 drop-shadow-md md:text-2xl">
            {hero?.subtitle}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            {hero?.primaryCta && (
              <a
                href={getPathForPage(hero.primaryCta.target || 'research')}
                onClick={(event) => onInternalLinkClick(event, hero.primaryCta.target || 'research')}
                className="flex items-center justify-center rounded-full bg-amber-500 px-8 py-4 font-bold text-black shadow-[0_0_25px_rgba(251,191,36,0.4)] transition-all duration-300 hover:bg-amber-400 hover:shadow-[0_0_35px_rgba(251,191,36,0.6)]"
              >
                {hero.primaryCta.label}
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            )}
            {hero?.secondaryCta && (
              <a
                href={getPathForPage(joinTeamTarget || hero.secondaryCta.target || 'opportunities')}
                onClick={(event) =>
                  onInternalLinkClick(event, joinTeamTarget || hero.secondaryCta.target || 'opportunities')
                }
                className="rounded-full border-2 border-purple-500 bg-slate-900/50 px-8 py-4 text-center font-bold text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-sm transition-all duration-300 hover:bg-purple-500/20 hover:text-purple-200 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
              >
                {hero.secondaryCta.label}
              </a>
            )}
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2 md:flex-none md:justify-end">
          <div className="relative w-full max-w-[22rem] md:max-w-[18rem] lg:max-w-[26rem]">
            <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-amber-500/25 via-purple-600/15 to-transparent blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0e17]/35 p-6 shadow-[0_0_40px_rgba(0,0,0,0.55)] backdrop-blur-sm">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.12),_transparent_60%)]" />
              <img
                src="/assets/sqi-logo.png"
                alt="SQIL logo"
                className="relative mx-auto h-auto w-full object-contain drop-shadow-[0_0_35px_rgba(168,85,247,0.25)]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-[#0a0e17] py-20">
      <div className="mx-auto max-w-4xl px-6 text-center md:text-left">
        <h2 className="mb-8 text-3xl font-bold text-white md:text-4xl">{home?.introHeading}</h2>
        {home?.introParagraphs?.map((paragraph) => (
          <p key={paragraph} className="mb-6 text-lg leading-relaxed text-slate-300">
            {paragraph}
          </p>
        ))}
      </div>
    </section>

    <section className="bg-[#050a14] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-16 text-center text-3xl font-bold text-white">{home?.pillarsTitle}</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {pillars?.map((pillar) => (
            <a
              key={pillar.id}
              href={getPathForPage('research')}
              onClick={(event) => onInternalLinkClick(event, 'research')}
              className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-[#0a0e17] p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(251,191,36,0.3)]"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="h-full w-full bg-gradient-to-br from-amber-500/10 to-purple-600/10" />
              </div>
              <div className="relative z-10">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 shadow-inner transition-colors group-hover:border-amber-500/50 group-hover:bg-amber-900/30">
                  <PillarIcon
                    type={pillar.icon}
                    className="h-8 w-8 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:text-amber-300"
                  />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{pillar.title}</h3>
                <p className="text-slate-400">{pillar.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  </div>
)

const ResearchSlice = ({ section }) => {
  const reversed = section.direction === 'reverse'
  const Icon = iconMap[section.icon?.toLowerCase()] || Atom
  return (
    <div className={`flex flex-col items-center gap-8 ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
      <div className="md:w-1/2">
        <img
          src={section.image}
          alt={section.title}
          className="w-full rounded-xl border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
        />
      </div>
      <div className="md:w-1/2">
        <h3 className="mb-4 flex items-center text-2xl font-bold text-white">
          <Icon className="mr-3 h-6 w-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          {section.title}
        </h3>
        <p className="text-slate-300 leading-relaxed">{section.body}</p>
      </div>
    </div>
  )
}

const ResearchView = ({ research }) => (
  <div className="animate-fadeIn bg-[#0a0e17] pt-24 text-slate-200">
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl">Our Research</h1>
      <p className="mb-16 text-xl leading-relaxed text-slate-300">{research?.intro}</p>
      <div className="space-y-16">
        {research?.sections?.map((section) => (
          <ResearchSlice key={section.title} section={section} />
        ))}
      </div>
    </div>
  </div>
)

const PublicationsView = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const loadPublications = async () => {
      try {
        const response = await fetch(`/data/publications.json?ts=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load publications JSON')
        const json = await response.json()
        if (!cancelled) {
          setData(json)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load publications. Please try again later.')
        }
        console.error(err)
      }
    }

    loadPublications()
    return () => {
      cancelled = true
    }
  }, [])

  const items = data?.items || []

  return (
    <div className="animate-fadeIn bg-[#0a0e17] pt-24 text-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-6 text-4xl font-bold text-white">Publications</h1>
        <p className="mb-10 max-w-3xl text-lg leading-relaxed text-slate-300">
          Selected publications, preprints, and thesis work from the group.
        </p>

        {error && (
          <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-900/10 p-5 text-amber-200">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {items.map((pub) => (
            <article
              key={pub.id || pub.title}
              className="rounded-3xl border border-slate-800 bg-[#050a14] p-7 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  {pub.primaryLink ? (
                    <a
                      href={pub.primaryLink}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-start gap-2 text-xl font-bold text-white hover:text-amber-300"
                    >
                      <span className="min-w-0">{pub.title}</span>
                      <ArrowUpRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-500 transition-colors group-hover:text-amber-300" />
                    </a>
                  ) : (
                    <h2 className="text-xl font-bold text-white">{pub.title}</h2>
                  )}

                  {pub.authors && <p className="mt-2 text-sm text-slate-300">{pub.authors}</p>}
                  {pub.venue && <p className="mt-2 text-sm font-medium text-amber-400">{pub.venue}</p>}
                </div>

                {pub.links?.length > 0 && (
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {pub.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-500/40 hover:text-amber-300"
                      >
                        {link.label}
                        <ArrowUpRight className="ml-2 h-4 w-4 text-slate-500" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {pub.abstract && (
                <details className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/20 p-5">
                  <summary className="cursor-pointer select-none text-sm font-semibold text-amber-300">
                    Abstract
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">{pub.abstract}</p>
                </details>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

const PeopleView = ({ people }) => {
  const pi = people?.pi
  const members = people?.members || []
  const alumni = people?.alumni || []
  const placeholders = people?.placeholders || []

  const getInitials = (name = '') => {
    const parts = name
      .replace(/[()]/g, '')
      .split(/[\s-]+/)
      .filter(Boolean)
    const initials = parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    return initials || '?'
  }

  const membersByGroup = members.reduce((acc, member) => {
    const group = member.group || member.role || 'Members'
    if (!acc[group]) acc[group] = []
    acc[group].push(member)
    return acc
  }, {})

  const orderedGroups = ['Research Fellow', 'Postdoctoral Researchers', 'Graduate Students', 'Visitors']
  const groupNames = Object.keys(membersByGroup)
  const sortedGroupNames = [
    ...orderedGroups.filter((group) => groupNames.includes(group)),
    ...groupNames.filter((group) => !orderedGroups.includes(group)).sort()
  ]

  const MemberCard = ({ member }) => (
    <div className="rounded-2xl border border-slate-800 bg-[#050a14] p-6 shadow-[0_0_15px_rgba(0,0,0,0.35)] transition-all hover:border-amber-500/30">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800 shadow-inner sm:h-24 sm:w-24">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="h-full w-full object-cover"
              style={{ objectPosition: member.photoPosition || 'center' }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-700 text-base font-bold text-amber-300">
              {getInitials(member.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-white break-words">{member.name}</p>
          {member.role && <p className="text-sm font-medium text-amber-400">{member.role}</p>}
          {member.note && <p className="mt-2 text-sm text-slate-400 break-words">{member.note}</p>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fadeIn bg-[#0a0e17] pt-24 text-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-12 text-4xl font-bold text-white">The Team</h1>
        {pi && (
          <div className="flex flex-col gap-8 rounded-3xl border border-slate-800 bg-[#050a14] p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)] md:flex-row md:p-12">
            <div className="flex flex-col items-center text-center md:w-1/3">
              <div
                className="mb-6 w-56 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-[0_0_25px_rgba(0,0,0,0.45)]"
                style={{ aspectRatio: '2 / 3' }}
              >
                <img
                  src={pi.photo}
                  alt={pi.name}
                  className="h-full w-full object-cover object-center"
                  loading="eager"
                  decoding="sync"
                  width="224"
                  height="336"
                />
              </div>
              <h2 className="text-2xl font-bold text-white">{pi.name}</h2>
              <p className="mb-4 font-medium text-amber-400">{pi.role}</p>
              <div className="flex gap-3">
                {pi.socials?.twitter && (
                  <a
                    href={pi.socials.twitter}
                    className="group rounded-full border border-slate-700 bg-slate-800 p-2 transition-colors hover:border-amber-500/50 hover:bg-amber-900/50"
                  >
                    <Twitter className="h-5 w-5 text-slate-400 transition-colors group-hover:text-amber-400" />
                  </a>
                )}
                {pi.socials?.linkedin && (
                  <a
                    href={pi.socials.linkedin}
                    className="group rounded-full border border-slate-700 bg-slate-800 p-2 transition-colors hover:border-amber-500/50 hover:bg-amber-900/50"
                  >
                    <Linkedin className="h-5 w-5 text-slate-400 transition-colors group-hover:text-amber-400" />
                  </a>
                )}
                {pi.socials?.email && (
                  <a
                    href={pi.socials.email}
                    className="group rounded-full border border-slate-700 bg-slate-800 p-2 transition-colors hover:border-amber-500/50 hover:bg-amber-900/50"
                  >
                    <Mail className="h-5 w-5 text-slate-400 transition-colors group-hover:text-amber-400" />
                  </a>
                )}
              </div>
            </div>
            <div className="md:w-2/3">
              <h3 className="mb-4 text-xl font-semibold text-white">Biography</h3>
              <p className="mb-6 leading-relaxed text-slate-300">{pi.bio}</p>
              <div className="space-y-3 text-sm text-slate-400">
                {pi.timeline?.map((entry) => (
                  <p key={entry}>
                    <span className="font-semibold text-white">{entry.split(':')[0]}:</span>
                    <span className="ml-2">{entry.split(':').slice(1).join(':').trim()}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {members.length > 0 ? (
          <div className="mt-16 space-y-12">
            {sortedGroupNames.map((groupName) => (
              <div key={groupName}>
                <h3 className="mb-6 text-2xl font-bold text-white">{groupName}</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {membersByGroup[groupName].map((member) => (
                    <MemberCard key={member.name} member={member} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          placeholders.length > 0 && (
            <div className="mt-16">
              <h3 className="mb-8 text-2xl font-bold text-white">Research Staff & Students</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {placeholders.map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 p-6 text-slate-500 transition-all hover:border-amber-500/50 hover:text-amber-400"
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {alumni.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-6 text-2xl font-bold text-white">Previous Team Members</h3>
            <div className="rounded-3xl border border-slate-800 bg-[#050a14] p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <ul className="space-y-4">
                {alumni.map((person) => (
                  <li key={person.name} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="font-semibold text-white">{person.name}</span>
                    {person.destination && <span className="text-sm text-slate-400">{person.destination}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const ContactView = ({ contact }) => (
  <div className="animate-fadeIn bg-[#0a0e17] pt-24 text-slate-100">
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-12 text-4xl font-bold text-white">Get in Touch</h1>
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <p className="mb-6 text-xl text-slate-300">{contact?.intro}</p>
          <div className="space-y-6">
            <div className="flex items-start">
              <MapPin className="mr-4 mt-1 h-6 w-6 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]" />
              <div>
                <h3 className="font-bold text-white">Address</h3>
                <p className="whitespace-pre-line text-slate-400">{contact?.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#050a14] p-8 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 shadow-inner">
              <Linkedin className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Message on LinkedIn</h3>
              <p className="text-sm text-slate-400">We don’t publish email addresses to reduce spam.</p>
            </div>
          </div>

          <a
            href={contact?.linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-lg bg-amber-500 py-3 font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-300 hover:bg-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
          >
            Message on LinkedIn
          </a>
        </div>
      </div>
    </div>
  </div>
)

const OpportunitiesView = ({ opportunities, contact, getPathForPage, onInternalLinkClick }) => {
  const items = Array.isArray(opportunities?.items) ? opportunities.items : []
  const intro =
    opportunities?.intro ||
    'We post PhD studentships and postdoctoral roles here when available. If nothing is listed, please get in touch.'

  return (
    <div className="animate-fadeIn bg-[#0a0e17] pt-24 text-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl">Opportunities</h1>
        {intro && <p className="mb-10 max-w-3xl text-lg leading-relaxed text-slate-300">{intro}</p>}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-[#050a14] p-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <h2 className="mb-2 text-xl font-bold text-white">No openings posted right now</h2>
            <p className="text-slate-400">
              If you’re interested in joining the group, we’d still love to hear from you.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={getPathForPage('contact')}
                onClick={(event) => onInternalLinkClick(event, 'contact')}
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-5 py-3 font-bold text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-300 hover:bg-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]"
              >
                Contact the lab
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>

              {contact?.linkedin && (
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/40 px-5 py-3 font-bold text-slate-200 transition-colors hover:border-amber-500/40 hover:text-amber-300"
                >
                  Message on LinkedIn
                  <ArrowUpRight className="ml-2 h-5 w-5 text-slate-500" />
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => {
              const title = item.title || item.role || item.label || 'Opportunity'
              const description = item.description || item.body || item.summary || item.blurb || ''
              const meta = [
                item.type || item.level,
                item.location,
                item.deadline ? `Deadline: ${item.deadline}` : null
              ].filter(Boolean)
              const url = item.applyUrl || item.url || item.link

              return (
                <article
                  key={item.id || title}
                  className="rounded-3xl border border-slate-800 bg-[#050a14] p-7 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:border-amber-500/30"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-white">{title}</h2>
                      {meta.length > 0 && <p className="mt-2 text-sm text-amber-400">{meta.join(' • ')}</p>}
                    </div>

                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-amber-500/40 hover:text-amber-300"
                      >
                        Apply / Details
                        <ArrowUpRight className="ml-2 h-4 w-4 text-slate-500" />
                      </a>
                    )}
                  </div>

                  {description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-300">{description}</p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const FacilitiesView = ({ facilities }) => (
  <div className="animate-fadeIn bg-[#0a0e17] pt-24 text-slate-200">
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl">Facilities</h1>
      {facilities?.intro && <p className="mb-10 text-xl leading-relaxed text-slate-300">{facilities.intro}</p>}

      {facilities?.tour?.url && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-bold text-white">{facilities.tour.title || 'Virtual Tour'}</h2>
            <a
              href={facilities.tour.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              Open in a new tab
            </a>
          </div>

          <div
            className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#050a14] shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            style={{ aspectRatio: '16 / 9' }}
          >
            <iframe
              title={facilities.tour.title || 'Matterport virtual tour'}
              src={facilities.tour.url}
              className="h-full w-full"
              allow="xr-spatial-tracking; fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {facilities?.tour?.caption && <p className="text-sm text-slate-400">{facilities.tour.caption}</p>}
        </div>
      )}
    </div>
  </div>
)

const NewsView = ({ onInternalLinkClick }) => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const loadNews = async () => {
      try {
        const response = await fetch(`/data/news.json?ts=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load news JSON')
        const json = await response.json()
        if (!cancelled) {
          setData(json)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load news. Please try again later.')
        }
        console.error(err)
      }
    }

    loadNews()
    return () => {
      cancelled = true
    }
  }, [])

  const items = data?.items || []

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateString
    }
  }

  return (
    <div className="animate-fadeIn bg-[#0a0e17] pt-24 text-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-6 text-4xl font-bold text-white">News & Events</h1>
        <p className="mb-10 max-w-3xl text-lg leading-relaxed text-slate-300">
          Latest updates, announcements, and events from SQIL.
        </p>

        {error && (
          <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-900/10 p-5 text-amber-200">
            {error}
          </div>
        )}

        {items.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-800 bg-[#050a14] p-12 text-center">
            <p className="text-slate-400">No news items yet. Check back soon for updates!</p>
          </div>
        )}

        <div className="space-y-6">
          {items.map((item) => {
            const internalPageId = item.pageId
            const href = item.url || item.linkedinUrl
            const isExternal = Boolean(item.linkedinUrl) || (item.url && /^https?:\/\//i.test(item.url))

            return (
            <article
              key={item.id || item.title}
              className="rounded-3xl border border-slate-800 bg-[#050a14] p-7 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:border-amber-500/30"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <a
                        href={href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noreferrer' : undefined}
                        onClick={
                          internalPageId
                            ? (event) => onInternalLinkClick?.(event, internalPageId)
                            : undefined
                        }
                        className="group inline-flex items-start gap-2 text-xl font-bold text-white hover:text-amber-300"
                      >
                        <span className="min-w-0">{item.title}</span>
                        <ArrowUpRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-500 transition-colors group-hover:text-amber-300" />
                      </a>
                    ) : (
                      <h2 className="text-xl font-bold text-white">{item.title}</h2>
                    )}
                    {item.date && (
                      <p className="mt-2 text-sm font-medium text-amber-400">{formatDate(item.date)}</p>
                    )}
                  </div>
                  {item.linkedinUrl && (
                    <a
                      href={item.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 rounded-full border border-slate-700 bg-slate-900/40 p-2 transition-colors hover:border-amber-500/40 hover:bg-amber-900/20"
                      title="View on LinkedIn"
                    >
                      <Linkedin className="h-5 w-5 text-slate-400 transition-colors hover:text-amber-400" />
                    </a>
                  )}
                </div>

                {item.content && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">{item.content}</p>
                  </div>
                )}

                {item.image && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                    {href ? (
                      <a
                        href={href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noreferrer' : undefined}
                        onClick={
                          internalPageId
                            ? (event) => onInternalLinkClick?.(event, internalPageId)
                            : undefined
                        }
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-auto object-cover transition-opacity hover:opacity-90"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                )}

                {href && (
                  <div>
                    <a
                      href={href}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noreferrer' : undefined}
                      onClick={
                        internalPageId
                          ? (event) => onInternalLinkClick?.(event, internalPageId)
                          : undefined
                      }
                      className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 transition-colors hover:text-amber-300"
                    >
                      {item.linkLabel || (internalPageId ? 'View event' : 'Read more')}
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs font-medium text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const PlaceholderView = ({ title }) => (
  <div className="animate-fadeIn flex min-h-screen flex-col items-center bg-[#0a0e17] px-6 pt-32 text-slate-100">
    <Construction className="mb-6 h-24 w-24 text-amber-500 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
    <h1 className="mb-4 text-4xl font-bold text-white">{title}</h1>
    <p className="max-w-md text-center text-xl text-slate-400">This section is currently under construction. Check back soon for updates from SQIL.</p>
  </div>
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
          <p className="mb-8 max-w-md text-base font-light leading-relaxed text-white/70 md:text-lg">
            Connect, collaborate, and discover the latest breakthroughs in the semiconductor and
            quantum dot landscape.
          </p>
          <div className="mb-10 flex items-start gap-3 text-white/80">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
            <p className="text-base">Sheffield Town Hall, Sheffield</p>
          </div>
          <div>
            <a
              href={QDD_REGISTER_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-sm bg-cyan-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-[#0B1629] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.35)]"
            >
              Register interest
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
            Supported by the IOP Optical Group and the IOP Quantum Electronics &amp; Photonics
            Group.
          </p>
        </div>
      </div>
    </section>

    <section id="sessions" className="scroll-mt-6 border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-white md:text-2xl">Sessions</h2>
        <ol className="mb-6 grid gap-3 sm:grid-cols-2">
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
        <p className="text-sm leading-relaxed text-white/50 md:text-base">
          Invited speakers will be announced once confirmed.
        </p>
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

    <section className="border-t border-white/10 px-6 py-14 md:py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            Sheffield Town Hall reception suite, city centre, next to Sheffield station.
          </p>
        </div>
        <a
          href={QDD_REGISTER_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-sm bg-cyan-500 px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#0B1629] transition-all duration-300 hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.35)]"
        >
          Register interest
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
  const [activePage, setActivePage] = useState(() =>
    typeof window === 'undefined' ? 'home' : pageIdForPathname(window.location.pathname)
  )
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [content, setContent] = useState(fallbackContent)

  const navigateTo = (pageId) => {
    const nextPageId = ALL_ROUTES.some((link) => link.id === pageId) ? pageId : 'home'
    const nextPath = pathForPageId(nextPageId)

    if (typeof window !== 'undefined') {
      const currentPath = normalizePathname(window.location.pathname)
      if (currentPath !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }
    }

    setActivePage(nextPageId)
    setMobileMenuOpen(false)
  }

  const onInternalLinkClick = (event, pageId) => {
    if (!isPlainLeftClick(event)) return
    event.preventDefault()
    navigateTo(pageId)
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const syncRouteFromLocation = () => {
      const nextPageId = pageIdForPathname(window.location.pathname)
      const normalizedPath = pathForPageId(nextPageId)

      if (window.location.pathname !== normalizedPath) {
        window.history.replaceState({}, '', normalizedPath)
      }

      setActivePage(nextPageId)
      setMobileMenuOpen(false)
    }

    syncRouteFromLocation()
    window.addEventListener('popstate', syncRouteFromLocation)
    return () => window.removeEventListener('popstate', syncRouteFromLocation)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [activePage])

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

  const hero = content.hero
  const home = content.home
  const pillars = content.pillars
  const research = content.researchPage
  const people = content.peoplePage
  const facilities = content.facilitiesPage
  const opportunities = content.opportunitiesPage
  const contact = content.contactPage
  const footer = content.footer

  const opportunitiesItems = Array.isArray(opportunities?.items) ? opportunities.items : []
  const hasOpportunities = opportunitiesItems.length > 0

  const rawJoinTeamTarget = hero?.secondaryCta?.target || 'opportunities'
  const joinTeamTarget = rawJoinTeamTarget === 'opportunities' && !hasOpportunities ? 'contact' : rawJoinTeamTarget
  const getPathForPage = (pageId) => pathForPageId(pageId)

  useEffect(() => {
    const currentMeta = PAGE_META[activePage] || PAGE_META.home
    const pagePath = pathForPageId(activePage)
    const absoluteUrl = `${SITE_ORIGIN}${pagePath}`
    const ogImage = currentMeta.image
      ? `${SITE_ORIGIN}${currentMeta.image}`
      : `${SITE_ORIGIN}/assets/sqi-logo.png`

    document.title = currentMeta.title
    upsertMetaByName('description', currentMeta.description)
    upsertMetaByName('twitter:title', currentMeta.title)
    upsertMetaByName('twitter:description', currentMeta.description)
    upsertMetaByProperty('og:title', currentMeta.title)
    upsertMetaByProperty('og:description', currentMeta.description)
    upsertMetaByProperty('og:url', absoluteUrl)
    upsertMetaByProperty('og:image', ogImage)
    upsertCanonical(absoluteUrl)
  }, [activePage])

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <HomeView
            hero={hero}
            home={home}
            pillars={pillars}
            joinTeamTarget={joinTeamTarget}
            getPathForPage={getPathForPage}
            onInternalLinkClick={onInternalLinkClick}
          />
        )
      case 'research':
        return <ResearchView research={research} />
      case 'people':
        return <PeopleView people={people} />
      case 'publications':
        return <PublicationsView />
      case 'facilities':
        return <FacilitiesView facilities={facilities} />
      case 'news':
        return <NewsView onInternalLinkClick={onInternalLinkClick} />
      case 'opportunities':
        return (
          <OpportunitiesView
            opportunities={opportunities}
            contact={contact}
            getPathForPage={getPathForPage}
            onInternalLinkClick={onInternalLinkClick}
          />
        )
      case 'contact':
        return <ContactView contact={contact} />
      case 'quantum-dot-day':
        return (
          <QuantumDotDayView
            getPathForPage={getPathForPage}
            onInternalLinkClick={onInternalLinkClick}
          />
        )
      default:
        return <PlaceholderView title={NAV_LINKS.find((link) => link.id === activePage)?.label || 'Coming Soon'} />
    }
  }

  const isEventMicrosite = activePage === 'quantum-dot-day'

  return (
    <div
      className={`min-h-screen overflow-x-hidden font-sans ${
        isEventMicrosite
          ? 'bg-[#0B1629] text-white'
          : 'bg-[#050a14] text-slate-100 selection:bg-amber-500/30 selection:text-white'
      }`}
    >
      {!isEventMicrosite && (
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled || activePage !== 'home' ? 'border-b border-white/5 bg-[#050a14]/90 py-3 shadow-lg backdrop-blur-md' : 'bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <a href={pathForPageId('home')} onClick={(event) => onInternalLinkClick(event, 'home')} className="flex items-center">
            <div className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-[#0a0e17] shadow-[0_0_10px_rgba(0,0,0,0.35)] md:h-14 md:w-14">
              {!logoError ? (
                <img
                  src="/assets/sqi-logo.png"
                  alt="SQIL logo"
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Atom className="h-6 w-6 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
              )}
            </div>
            <span className="bg-gradient-to-r from-amber-400 to-purple-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_6px_rgba(0,0,0,0.4)]">
              SQIL
            </span>
          </a>

          <div className="hidden items-center space-x-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.path}
                onClick={(event) => onInternalLinkClick(event, link.id)}
                aria-current={activePage === link.id ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  activePage === link.id
                    ? 'bg-white/5 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="lg:hidden">
            <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="p-2 text-slate-200 hover:text-white">
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-white/10 bg-[#0a0e17] px-6 py-4 shadow-2xl animate-fadeIn lg:hidden">
            <div className="flex flex-col space-y-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.path}
                  onClick={(event) => onInternalLinkClick(event, link.id)}
                  aria-current={activePage === link.id ? 'page' : undefined}
                  className={`border-b border-white/5 py-3 text-left text-base font-medium last:border-0 ${
                    activePage === link.id ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
      )}

      <main>{renderPage()}</main>

      {!isEventMicrosite && (
      <footer className="border-t border-slate-800 bg-[#050a14] py-12 text-slate-400">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
          <div>
            <span className="block bg-gradient-to-r from-amber-400 to-purple-500 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]">
              SQIL
            </span>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{footer?.blurb}</p>
            {footer?.logo && (
              <img
                src={footer.logo}
                alt="University of Sheffield"
                className="mt-6 h-auto w-full max-w-[20rem] object-contain object-left opacity-95 drop-shadow-[0_0_10px_rgba(0,0,0,0.6)] sm:max-w-[22rem]"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <div>
            <h4 className="mb-4 font-bold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {footer?.links?.map((link) => (
                <li key={link.label}>
                  <a
                    href={pathForPageId(link.target === 'opportunities' && !hasOpportunities ? 'contact' : link.target)}
                    onClick={(event) =>
                      onInternalLinkClick(event, link.target === 'opportunities' && !hasOpportunities ? 'contact' : link.target)
                    }
                    className="transition-colors hover:text-amber-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-bold text-white">Connect</h4>
            <div className="mb-4 flex space-x-4">
              {footer?.socials?.twitter && (
                <a href={footer.socials.twitter} className="group text-slate-400 transition-colors hover:text-amber-400">
                  <Twitter className="h-5 w-5 group-hover:drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                </a>
              )}
              {footer?.socials?.linkedin && (
                <a href={footer.socials.linkedin} className="group text-slate-400 transition-colors hover:text-amber-400">
                  <Linkedin className="h-5 w-5 group-hover:drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]" />
                </a>
              )}
            </div>
            <p className="text-sm">&copy; {new Date().getFullYear()} SQIL. All rights reserved.</p>
          </div>
        </div>
      </footer>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
