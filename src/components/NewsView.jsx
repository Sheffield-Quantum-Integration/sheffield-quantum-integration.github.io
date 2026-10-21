import { ArrowRight } from 'lucide-react'
import { formatNewsDate, newsDateTime, sortNews } from '../site/content.js'
import { InternalLink } from '../site/nav.jsx'
import { useFeed } from '../site/useFeed.js'
import { Container, ExternalLink, PageHeader, buttonStyles } from './ui.jsx'

const ItemLink = ({ item, className, children }) => {
  if (item.pageId) {
    return (
      <InternalLink pageId={item.pageId} className={className}>
        {children}
      </InternalLink>
    )
  }
  const href = item.url || item.linkedinUrl
  if (!href) return null
  return (
    <ExternalLink href={href} className={className} icon={false}>
      {children}
    </ExternalLink>
  )
}

export default function NewsView() {
  const { status, data } = useFeed('/data/news.json')
  const items = sortNews(data?.items || [])

  return (
    <div className="pb-20">
      <PageHeader title="News & Events" intro="Latest updates, announcements, and events from SQIL." />
      <Container className="min-h-[60vh] pt-12 md:pt-16">
        {status === 'loading' && (
          <ul className="space-y-6" aria-hidden="true">
            {[0, 1, 2].map((key) => (
              <li key={key} className="h-40 rounded-lg border border-white/5 bg-navy-900" />
            ))}
          </ul>
        )}
        {status === 'error' && (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] p-5 text-amber-100">
            Could not load news. Please try again later.
          </p>
        )}
        {status === 'ready' && items.length === 0 && (
          <p className="rounded-lg border border-white/10 bg-navy-900 p-10 text-center text-slate-400">
            No news items yet. Check back soon for updates.
          </p>
        )}
        {status === 'ready' && items.length > 0 && (
          <ol className="space-y-6">
            {items.map((item) => {
              const hasLink = Boolean(item.pageId || item.url || item.linkedinUrl)
              return (
                <li key={item.id || item.title}>
                  <article className="rounded-lg border border-white/10 bg-navy-900 p-6 md:p-7">
                    {item.date && (
                      <time dateTime={newsDateTime(item)} className="text-sm font-medium text-amber-300">
                        {formatNewsDate(item)}
                      </time>
                    )}
                    <h2 className="mt-2 text-xl font-semibold leading-snug text-white">
                      {hasLink ? (
                        <ItemLink item={item} className="underline-offset-4 hover:text-amber-200 hover:underline">
                          {item.title}
                        </ItemLink>
                      ) : (
                        item.title
                      )}
                    </h2>
                    {item.content && <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-300">{item.content}</p>}
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.imageAlt || ''}
                        width={item.imageWidth}
                        height={item.imageHeight}
                        loading="lazy"
                        decoding="async"
                        className="mt-5 block h-auto w-full rounded-md border border-white/10"
                      />
                    )}
                    {hasLink && (
                      <p className="mt-5">
                        <ItemLink item={item} className={`${buttonStyles.text} text-sm`}>
                          {item.linkLabel || (item.pageId ? 'View event' : 'Read more')}
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </ItemLink>
                      </p>
                    )}
                    {item.tags?.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
                        {item.tags.map((tag) => (
                          <li key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-400">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </li>
              )
            })}
          </ol>
        )}
      </Container>
    </div>
  )
}
