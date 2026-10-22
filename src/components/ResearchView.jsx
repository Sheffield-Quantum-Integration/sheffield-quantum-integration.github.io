import { ArrowRight } from 'lucide-react'
import { InternalLink } from '../site/nav.jsx'
import { Container, ContentLink, Eyebrow, Figure, PageHeader, ThemeIcon, buttonStyles } from './ui.jsx'

const ThemeText = ({ section, index }) => (
  <>
    <Eyebrow>
      Theme {index + 1}
      {section.label ? ` · ${section.label}` : ''}
    </Eyebrow>
    <h2
      id={`${section.id}-title`}
      className="mt-3 flex items-start gap-3 text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl"
    >
      <ThemeIcon type={section.icon} className="mt-1.5 h-5 w-5 shrink-0 md:h-6 md:w-6" />
      <span>{section.title}</span>
    </h2>
    <p className="mt-5 text-base leading-relaxed text-slate-300 md:text-lg md:leading-relaxed">{section.body}</p>
    {section.links?.length > 0 && (
      <ul className="mt-6 flex flex-wrap gap-2">
        {section.links.map((link) => (
          <li key={link.label}>
            <ContentLink link={link} />
          </li>
        ))}
      </ul>
    )}
  </>
)

const IllustratedTheme = ({ section, index }) => (
  <section
    id={section.id}
    aria-labelledby={`${section.id}-title`}
    className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14"
  >
    <div>
      <ThemeText section={section} index={index} />
    </div>
    <Figure image={section.image} className={section.direction === 'reverse' ? '' : 'lg:order-first'} />
  </section>
)

const TextTheme = ({ section, index }) => (
  <section
    id={section.id}
    aria-labelledby={`${section.id}-title`}
    className="rounded-lg border border-white/10 bg-navy-900 p-6 md:p-10"
  >
    <div className="max-w-4xl">
      <ThemeText section={section} index={index} />
    </div>
  </section>
)

export default function ResearchView({ research, recruitment }) {
  const sections = research?.sections || []
  return (
    <div className="pb-20">
      <PageHeader title="Research" intro={research?.intro}>
        {recruitment.isRecruiting && research?.recruitmentNote && (
          <p className="mt-6 flex max-w-3xl flex-col gap-2 border-l-2 border-amber-400 pl-4 text-slate-200 sm:block">
            {research.recruitmentNote}{' '}
            <InternalLink pageId="opportunities" className={`${buttonStyles.text} sm:ml-1`}>
              {research.recruitmentLinkLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </InternalLink>
          </p>
        )}
      </PageHeader>

      <Container className="space-y-16 pt-12 md:space-y-24 md:pt-16">
        {sections.map((section, index) =>
          section.image?.src ? (
            <IllustratedTheme key={section.id} section={section} index={index} />
          ) : (
            <TextTheme key={section.id} section={section} index={index} />
          )
        )}

        {research?.methods?.items?.length > 0 && (
          <section aria-labelledby="research-methods" className="border-t border-white/10 pt-10">
            <Eyebrow as="h2" id="research-methods">
              {research.methods.heading}
            </Eyebrow>
            <ul className="mt-4 flex flex-wrap gap-2">
              {research.methods.items.map((item) => (
                <li key={item} className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </div>
  )
}
