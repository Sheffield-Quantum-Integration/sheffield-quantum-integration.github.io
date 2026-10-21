import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from '../site/routes.js'
import { InternalLink } from '../site/nav.jsx'

export default function SiteHeader({ activePage, menuOpen, setMenuOpen }) {
  const [logoError, setLogoError] = useState(false)
  const toggleRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, setMenuOpen])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <InternalLink pageId="home" className="flex items-center gap-3 rounded" aria-label="SQIL home">
          {!logoError && (
            <img
              src="/assets/sqi-logo-96.png"
              alt=""
              width="40"
              height="40"
              className="h-10 w-10"
              onError={() => setLogoError(true)}
            />
          )}
          <span className="text-lg font-bold tracking-tight text-white">SQIL</span>
        </InternalLink>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = activePage === link.id
              return (
                <li key={link.id}>
                  <InternalLink
                    pageId={link.id}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active ? 'text-amber-300' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </InternalLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="-mr-2 rounded-md p-2 text-slate-200 hover:text-white lg:hidden"
        >
          {menuOpen ? <X className="h-7 w-7" aria-hidden="true" /> : <Menu className="h-7 w-7" aria-hidden="true" />}
        </button>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Main"
        hidden={!menuOpen}
        className="border-t border-white/10 bg-navy-950 px-6 pb-4 lg:hidden"
      >
        <ul>
          {NAV_LINKS.map((link) => {
            const active = activePage === link.id
            return (
              <li key={link.id} className="border-b border-white/5 last:border-0">
                <InternalLink
                  pageId={link.id}
                  aria-current={active ? 'page' : undefined}
                  className={`block py-3 text-base font-medium ${active ? 'text-amber-300' : 'text-slate-200'}`}
                >
                  {link.label}
                </InternalLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
