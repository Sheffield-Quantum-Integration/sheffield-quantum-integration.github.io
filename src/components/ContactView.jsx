import { Mail, MapPin } from 'lucide-react'
import { Container, ExternalLink, PageHeader, buttonStyles } from './ui.jsx'

export default function ContactView({ contact }) {
  const links = [
    contact?.staffProfile && { href: contact.staffProfile, label: 'University staff profile', style: buttonStyles.secondary },
    contact?.orcid && { href: contact.orcid, label: 'ORCID', style: buttonStyles.secondary },
    contact?.linkedin && { href: contact.linkedin, label: 'Message on LinkedIn', style: buttonStyles.primary }
  ].filter(Boolean)

  return (
    <div className="pb-20">
      <PageHeader title="Contact" intro={contact?.intro} />
      <Container className="grid gap-8 pt-12 md:grid-cols-2 md:gap-12 md:pt-16">
        <section aria-labelledby="contact-address">
          <h2 id="contact-address" className="flex items-center gap-3 text-xl font-semibold text-white">
            <MapPin className="h-5 w-5 text-amber-400" aria-hidden="true" />
            Address
          </h2>
          <address className="mt-4 whitespace-pre-line not-italic leading-relaxed text-slate-300">{contact?.address}</address>
        </section>

        <section aria-labelledby="contact-joe" className="rounded-lg border border-white/10 bg-navy-900 p-6 md:p-8">
          <h2 id="contact-joe" className="text-xl font-semibold text-white">
            Contact Joe
          </h2>
          {contact?.note && <p className="mt-2 text-slate-300">{contact.note}</p>}
          <ul className="mt-6 flex flex-col gap-3">
            {contact?.email && (
              <li>
                <a href={`mailto:${contact.email}`} className={`${buttonStyles.primary} w-full`}>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {contact.email}
                </a>
              </li>
            )}
            {links.map((link) => (
              <li key={link.label}>
                <ExternalLink href={link.href} className={`${link.style} w-full`}>
                  {link.label}
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </div>
  )
}
