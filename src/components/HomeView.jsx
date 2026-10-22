import { ArrowRight } from 'lucide-react'
import { formatNewsDate, newsDateTime, sortNews, sortPublications } from '../site/content.js'
import { InternalLink } from '../site/nav.jsx'
import { useFeed } from '../site/useFeed.js'
import { Avatar, Container, Eyebrow, ExternalLink, Figure, SectionHeader, ThemeIcon, buttonStyles } from './ui.jsx'

const MoreLink = ({ pageId, children }) => (
  <InternalLink pageId={pageId} className={`${buttonStyles.text} text-sm`}>
    {children}
    <ArrowRight className="h-4 w-4" aria-hidden="true" />
  </InternalLink>
)

const FeedStatus = ({ status, label, pageId }) =>
  status === 'loading' ? (
    <ul className="mt-6 space-y-6" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <li key={key} className="space-y-2">
          <div className="h-4 w-11/12 rounded bg-white/5" />
          <div className="h-4 w-2/3 rounded bg-white/5" />
          <div className="h-3 w-1/3 rounded bg-white/5" />
        </li>
      ))}
    </ul>
  ) : status === 'empty' ? (
    <p className="mt-6 text-slate-400">Nothing posted yet.</p>
  ) : (
    <p className="mt-6 text-slate-400">
      {label} could not be loaded just now.{' '}
      <InternalLink pageId={pageId} className={buttonStyles.text}>
        Try the {label.toLowerCase()} page
      </InternalLink>
      .
    </p>
  )

const RecentPublications = ({ heading, linkLabel }) => {
  const { status, data } = useFeed('/data/publications.json')
  const items = sortPublications(data?.items || []).slice(0, 3)
  return (
    <section aria-labelledby="home-publications" className="min-h-[19rem]">
      <SectionHeader id="home-publications" title={heading} link={<MoreLink pageId="publications">{linkLabel}</MoreLink>} />
      {status === 'ready' && items.length > 0 ? (
        <ul className="mt-6 divide-y divide-white/5">
          {items.map((pub) => (
            <li key={pub.id || pub.title} className="py-4 first:pt-0">
              {pub.primaryLink ? (
                <ExternalLink
                  href={pub.primaryLink}
                  className="font-semibold leading-snug text-slate-100 underline-offset-4 hover:text-amber-200 hover:underline"
                  icon={false}
                >
                  {pub.title}
                </ExternalLink>
              ) : (
                <p className="font-semibold leading-snug text-slate-100">{pub.title}</p>
              )}
              {pub.venue && <p className="mt-1 text-sm text-slate-400">{pub.venue}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <FeedStatus status={status === 'ready' ? 'empty' : status} label="Publications" pageId="publications" />
      )}
    </section>
  )
}

const RecentNews = ({ heading, linkLabel }) => {
  const { status, data } = useFeed('/data/news.json')
  const items = sortNews(data?.items || []).slice(0, 3)
  return (
    <section aria-labelledby="home-news" className="min-h-[19rem]">
      <SectionHeader id="home-news" title={heading} link={<MoreLink pageId="news">{linkLabel}</MoreLink>} />
      {status === 'ready' && items.length > 0 ? (
        <ul className="mt-6 divide-y divide-white/5">
          {items.map((item) => {
            const titleClass = 'font-semibold leading-snug text-slate-100 underline-offset-4 hover:text-amber-200 hover:underline'
            return (
              <li key={item.id || item.title} className="py-4 first:pt-0">
                <time dateTime={newsDateTime(item)} className="text-sm text-slate-400">
                  {formatNewsDate(item)}
                </time>
                <p className="mt-1">
                  {item.pageId ? (
                    <InternalLink pageId={item.pageId} className={titleClass}>
                      {item.title}
                    </InternalLink>
                  ) : item.url ? (
                    <ExternalLink href={item.url} className={titleClass} icon={false}>
                      {item.title}
                    </ExternalLink>
                  ) : (
                    <span className="font-semibold text-slate-100">{item.title}</span>
                  )}
                </p>
              </li>
            )
          })}
        </ul>
      ) : (
        <FeedStatus status={status === 'ready' ? 'empty' : status} label="News" pageId="news" />
      )}
    </section>
  )
}

export default function HomeView({ content, recruitment }) {
  const { hero, home = {}, researchPage, peoplePage, contactPage, opportunitiesPage } = content
  const banner = home.recruitmentBanner
  const bannerItem = opportunitiesPage?.items?.find((item) => item.id === banner?.opportunityId)
  const showBanner = Boolean(banner && bannerItem && recruitment.isOpen(bannerItem.id))
  const primaryLabel = recruitment.isRecruiting ? hero?.primaryCta?.openLabel : hero?.primaryCta?.label
  const team = [
    peoplePage?.pi && { name: peoplePage.pi.name, role: peoplePage.pi.role, photo: peoplePage.pi.thumbnail },
    ...(peoplePage?.members || [])
  ].filter(Boolean)

  return (
    <>
      <section aria-labelledby="home-title">
        <Container className="grid items-center gap-10 pb-12 pt-10 md:pb-16 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-14 lg:pb-20 lg:pt-16">
          <div>
            <Eyebrow>University of Sheffield</Eyebrow>
            <h1
              id="home-title"
              className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]"
            >
              {hero?.title}
            </h1>
            {hero?.strapline && <p className="mt-5 text-xl leading-snug text-slate-100 md:text-2xl">{hero.strapline}</p>}
            {hero?.about && <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">{hero.about}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {hero?.primaryCta && (
                <InternalLink pageId={hero.primaryCta.target} className={buttonStyles.primary}>
                  {primaryLabel || hero.primaryCta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </InternalLink>
              )}
              {hero?.secondaryCta && (
                <InternalLink pageId={hero.secondaryCta.target} className={buttonStyles.secondary}>
                  {hero.secondaryCta.label}
                </InternalLink>
              )}
            </div>
          </div>
          <Figure image={hero?.image} priority />
        </Container>
      </section>

      {showBanner && (
        <section aria-labelledby="home-recruitment" className="border-y border-amber-400/25 bg-amber-400/[0.06]">
          <Container className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="text-sm leading-relaxed text-slate-200">
              <h2 id="home-recruitment" className="inline font-semibold text-amber-300">
                {banner.heading}
              </h2>
              <span className="mx-2 text-slate-500" aria-hidden="true">
                ·
              </span>
              {banner.text} Deadline {bannerItem.deadline}.
            </div>
            <InternalLink pageId="opportunities" className={`${buttonStyles.text} shrink-0 text-sm`}>
              {banner.linkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </InternalLink>
          </Container>
        </section>
      )}

      {home.headlineResult && (
        <section aria-labelledby="home-result" className="py-14 md:py-20">
          <Container className="grid gap-4 lg:grid-cols-12 lg:gap-10">
            <Eyebrow as="h2" id="home-result" className="lg:col-span-3 lg:pt-2">
              {home.headlineResult.heading}
            </Eyebrow>
            <div className="lg:col-span-9">
              <p className="max-w-4xl text-xl leading-relaxed text-slate-100 md:text-2xl md:leading-relaxed">
                {home.headlineResult.text}
              </p>
              {home.headlineResult.url && (
                <p className="mt-5">
                  <ExternalLink href={home.headlineResult.url} className={buttonStyles.inlineText}>
                    {home.headlineResult.linkLabel}
                  </ExternalLink>
                </p>
              )}
            </div>
          </Container>
        </section>
      )}

      {researchPage?.sections?.length > 0 && (
        <section aria-labelledby="home-themes" className="border-t border-white/5 py-14 md:py-20">
          <Container>
            <SectionHeader id="home-themes" title={home.themesHeading} link={<MoreLink pageId="research">All research</MoreLink>} />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {researchPage.sections.map((section) => (
                <li key={section.id}>
                  <InternalLink
                    pageId="research"
                    hash={`#${section.id}`}
                    className="group flex h-full flex-col rounded-lg border border-white/10 bg-navy-900 p-6 transition-colors hover:border-amber-400/60"
                  >
                    <ThemeIcon type={section.icon} />
                    <h3 className="mt-4 text-lg font-semibold leading-snug text-white">{section.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{section.summary}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 group-hover:text-amber-200">
                      Read more<span className="sr-only"> about {section.title}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </InternalLink>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {team.length > 0 && (
        <section aria-labelledby="home-team" className="border-t border-white/5 py-14 md:py-20">
          <Container>
            <SectionHeader id="home-team" title={home.peopleHeading} link={<MoreLink pageId="people">{home.peopleLinkLabel}</MoreLink>} />
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {team.map((person) => (
                <li key={person.name} className="flex flex-col items-start gap-3">
                  <Avatar name={person.name} photo={person.photo} size="lg" />
                  <div>
                    <p className="font-semibold leading-snug text-slate-100">{person.name}</p>
                    <p className="text-sm text-slate-400">{person.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <div className="border-t border-white/5 py-14 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <RecentPublications heading={home.publicationsHeading} linkLabel={home.publicationsLinkLabel} />
          <RecentNews heading={home.newsHeading} linkLabel={home.newsLinkLabel} />
        </Container>
      </div>

      <section aria-labelledby="home-contact" className="border-t border-white/5 py-14 md:py-20">
        <Container>
          <div className="flex flex-col gap-6 rounded-lg border border-white/10 bg-navy-900 p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h2 id="home-contact" className="text-2xl font-semibold tracking-tight text-white">
                {home.contactHeading}
              </h2>
              {contactPage?.intro && <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">{contactPage.intro}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <InternalLink pageId="contact" className={buttonStyles.primary}>
                Contact
              </InternalLink>
              <InternalLink pageId="opportunities" className={buttonStyles.secondary}>
                Opportunities
              </InternalLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
