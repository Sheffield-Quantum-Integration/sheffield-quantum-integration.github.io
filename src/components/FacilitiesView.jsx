import { Container, ExternalLink, PageHeader, buttonStyles } from './ui.jsx'

export default function FacilitiesView({ facilities }) {
  const tour = facilities?.tour
  return (
    <div className="pb-20">
      <PageHeader title="Facilities" intro={facilities?.intro} />
      {tour?.url && (
        <Container as="section" aria-labelledby="facilities-tour" className="space-y-4 pt-12 md:pt-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="facilities-tour" className="text-2xl font-semibold tracking-tight text-white">
              {tour.title || 'Virtual Tour'}
            </h2>
            <ExternalLink href={tour.url} className={`${buttonStyles.text} text-sm`}>
              Open in a new tab
            </ExternalLink>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-navy-900">
            <iframe
              title={tour.title || 'Matterport virtual tour'}
              src={tour.url}
              className="h-full w-full"
              allow="xr-spatial-tracking; fullscreen"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          {tour.caption && <p className="text-sm text-slate-400">{tour.caption}</p>}
        </Container>
      )}
    </div>
  )
}
