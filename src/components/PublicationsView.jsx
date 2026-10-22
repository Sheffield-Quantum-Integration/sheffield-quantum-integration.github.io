import { useFeed } from '../site/useFeed.js'
import { Container, ExternalLink, PageHeader, buttonStyles } from './ui.jsx'

const Skeleton = () => (
  <ul className="space-y-6" aria-hidden="true">
    {[0, 1, 2, 3].map((key) => (
      <li key={key} className="h-44 rounded-lg border border-white/5 bg-navy-900" />
    ))}
  </ul>
)

export default function PublicationsView() {
  const { status, data } = useFeed('/data/publications.json')
  const items = data?.items || []

  return (
    <div className="pb-20">
      <PageHeader title="Publications" intro="Selected publications and preprints from the group." />
      <Container className="min-h-[60vh] pt-12 md:pt-16">
        {status === 'loading' && <Skeleton />}
        {status === 'error' && (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-5 text-amber-100">
            Could not load publications. Please try again later.
          </p>
        )}
        {status === 'ready' && (
          <ol className="space-y-6">
            {items.map((pub) => (
              <li key={pub.id || pub.title}>
                <article className="rounded-lg border border-white/10 bg-navy-900 p-6 md:p-7">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold leading-snug text-white md:text-xl">
                        {pub.primaryLink ? (
                          <ExternalLink
                            href={pub.primaryLink}
                            className="underline-offset-4 hover:text-amber-200 hover:underline"
                            icon={false}
                          >
                            {pub.title}
                          </ExternalLink>
                        ) : (
                          pub.title
                        )}
                      </h2>
                      {pub.authors && <p className="mt-2 text-sm text-slate-300">{pub.authors}</p>}
                      {pub.venue && <p className="mt-2 text-sm font-medium text-amber-300">{pub.venue}</p>}
                    </div>
                    {pub.links?.length > 0 && (
                      <ul className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                        {pub.links.map((link) => (
                          <li key={link.url}>
                            <ExternalLink href={link.url} className={buttonStyles.pill}>
                              {link.label}
                            </ExternalLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {pub.abstract && (
                    <details className="mt-5 rounded-md border border-white/5 bg-navy-950/60 p-4">
                      <summary className="cursor-pointer select-none text-sm font-semibold text-amber-300">Abstract</summary>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{pub.abstract}</p>
                    </details>
                  )}
                </article>
              </li>
            ))}
          </ol>
        )}
      </Container>
    </div>
  )
}
