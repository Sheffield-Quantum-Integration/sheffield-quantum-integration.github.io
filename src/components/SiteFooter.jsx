import { Linkedin } from 'lucide-react'
import { InternalLink } from '../site/nav.jsx'
import { NewTabNote } from './ui.jsx'

export default function SiteFooter({ footer, recruitment }) {
  return (
    <footer className="border-t border-white/10 bg-navy-950 py-12 text-slate-400">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold tracking-tight text-white">SQIL</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{footer?.blurb}</p>
            {footer?.logo && (
              <a
                href={footer.logoUrl || 'https://www.sheffield.ac.uk/'}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block w-full max-w-[16rem] rounded"
              >
                <img
                  src={footer.logo}
                  alt="University of Sheffield"
                  width="800"
                  height="252"
                  loading="lazy"
                  decoding="async"
                  className="block h-auto w-full"
                />
                <span className="sr-only">: School of Electrical and Electronic Engineering</span>
                <NewTabNote />
              </a>
            )}
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold text-white">Quick Links</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {footer?.links?.map((link) => (
                <li key={link.label}>
                  <InternalLink pageId={link.target} className="transition-colors hover:text-amber-300">
                    {recruitment.isRecruiting && link.openLabel ? link.openLabel : link.label}
                  </InternalLink>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-white">Connect</h2>
            {footer?.socials?.linkedin && (
              <a
                href={footer.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn (opens in a new tab)"
                className="mt-4 inline-flex rounded p-1 text-slate-300 transition-colors hover:text-amber-300"
              >
                <Linkedin className="h-5 w-5" aria-hidden="true" />
              </a>
            )}
            <p className="mt-4 text-sm">&copy; {new Date().getFullYear()} SQIL. All rights reserved.</p>
          </div>
        </div>
        {footer?.imageNotice && (
          <p className="mt-10 border-t border-white/5 pt-6 text-sm leading-relaxed text-slate-400">{footer.imageNotice}</p>
        )}
      </div>
    </footer>
  )
}
