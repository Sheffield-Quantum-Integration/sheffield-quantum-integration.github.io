import { ArrowRight } from 'lucide-react'
import { InternalLink } from '../site/nav.jsx'
import { Container, ExternalLink, Figure, PageHeader, Paragraphs, buttonStyles } from './ui.jsx'

const StatusBadge = ({ open }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
      open ? 'border-emerald-400/40 text-emerald-300' : 'border-slate-600 text-slate-300'
    }`}
  >
    {open ? 'Applications open' : 'Applications closed'}
  </span>
)

const OpportunityCard = ({ item, open }) => {
  const title = item.title || item.role || 'Opportunity'
  const headingId = `opportunity-${item.id || 'item'}`
  const url = item.applyUrl || item.url
  const details = [
    ['Scheme', item.type || item.level],
    ['Location', item.location],
    ['Deadline', item.deadline]
  ].filter(([, value]) => value)

  return (
    <article aria-labelledby={headingId} className="rounded-lg border border-white/10 bg-navy-900">
      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {item.label && <p className="text-sm font-semibold text-amber-300">{item.label}</p>}
            <StatusBadge open={open} />
          </div>
          <h2 id={headingId} className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white">
            {title}
          </h2>
          {details.length > 0 && (
            <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)]">
              {details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="font-semibold text-slate-200">{label}</dt>
                  <dd className="mb-2 text-slate-300 sm:mb-0">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {item.description && (
            <div className="mt-6 space-y-4 leading-relaxed text-slate-300">
              <Paragraphs text={item.description} />
            </div>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            {open ? (
              <>
                {url && (
                  <ExternalLink href={url} className={buttonStyles.primary}>
                    Apply / Details
                  </ExternalLink>
                )}
                {item.secondaryUrl && (
                  <ExternalLink href={item.secondaryUrl} className={buttonStyles.secondary}>
                    {item.secondaryLabel || 'More information'}
                  </ExternalLink>
                )}
              </>
            ) : (
              url && (
                <ExternalLink href={url} className={buttonStyles.secondary}>
                  Archived project details
                </ExternalLink>
              )
            )}
          </div>
        </div>
        {item.image && <Figure image={item.image} className="lg:pt-1" />}
      </div>
    </article>
  )
}

export default function OpportunitiesView({ opportunities, contact, recruitment }) {
  const { openItems, closedItems, isRecruiting } = recruitment
  const intro = isRecruiting ? opportunities?.intro : opportunities?.closedIntro || opportunities?.intro
  const contactCta = opportunities?.contactCta

  return (
    <div className="pb-20">
      <PageHeader title="Opportunities" intro={intro} />
      <Container className="space-y-12 pt-12 md:pt-16">
        {openItems.length > 0 ? (
          <div className="space-y-6">
            {openItems.map((item) => (
              <OpportunityCard key={item.id || item.title} item={item} open />
            ))}
            {contactCta && (
              <div className="flex flex-col gap-4 rounded-lg border border-amber-400/25 bg-amber-400/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-200">{contact?.note}</p>
                <InternalLink pageId={contactCta.target} className={`${buttonStyles.primary} shrink-0`}>
                  {contactCta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </InternalLink>
              </div>
            )}
          </div>
        ) : (
          <section aria-labelledby="no-openings" className="rounded-lg border border-white/10 bg-navy-900 p-8 md:p-10">
            <h2 id="no-openings" className="text-xl font-semibold text-white">
              No openings posted right now
            </h2>
            <p className="mt-2 text-slate-400">If you’re interested in joining the group, we’d still love to hear from you.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <InternalLink pageId="contact" className={buttonStyles.primary}>
                Contact the lab
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </InternalLink>
            </div>
          </section>
        )}

        {closedItems.length > 0 && (
          <section aria-labelledby="closed-opportunities" className="space-y-6">
            <h2 id="closed-opportunities" className="text-2xl font-semibold tracking-tight text-white">
              Closed opportunities
            </h2>
            {closedItems.map((item) => (
              <OpportunityCard key={item.id || item.title} item={item} open={false} />
            ))}
          </section>
        )}
      </Container>
    </div>
  )
}
