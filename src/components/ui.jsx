import { ArrowRight, ArrowUpRight, Atom, Bot, Cpu, Zap } from 'lucide-react'
import { getInitials } from '../site/content.js'
import { InternalLink } from '../site/nav.jsx'

export const iconMap = {
  zap: Zap,
  cpu: Cpu,
  atom: Atom,
  bot: Bot
}

export const ThemeIcon = ({ type, className = 'h-5 w-5' }) => {
  const Icon = iconMap[type?.toLowerCase()] || Atom
  return <Icon className={`${className} text-amber-400`} aria-hidden="true" />
}

export const Container = ({ as: Tag = 'div', className = '', children, ...rest }) => (
  <Tag className={`mx-auto w-full max-w-6xl px-6 ${className}`} {...rest}>
    {children}
  </Tag>
)

export const buttonStyles = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-amber-300',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-md border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-amber-400 hover:text-amber-200',
  pill: 'inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-amber-400 hover:text-amber-200',
  text: 'inline-flex items-center gap-1.5 font-semibold text-amber-300 underline-offset-4 hover:text-amber-200 hover:underline',
  // For labels that may wrap: keeps the trailing icon next to the last word.
  inlineText:
    'inline font-semibold text-amber-300 underline-offset-4 hover:text-amber-200 hover:underline [&>svg]:ml-1.5 [&>svg]:inline-block [&>svg]:align-[-0.15em]'
}

export const Eyebrow = ({ as: Tag = 'p', className = '', children, ...rest }) => (
  <Tag className={`text-xs font-semibold uppercase tracking-[0.16em] text-amber-400 ${className}`} {...rest}>
    {children}
  </Tag>
)

export const NewTabNote = () => <span className="sr-only"> (opens in a new tab)</span>

export const ExternalLink = ({ href, className = buttonStyles.text, icon = true, children, ...rest }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
    {children}
    {icon && <ArrowUpRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />}
    <NewTabNote />
  </a>
)

/** An item from a `links` array: `{ label, url }` (external) or `{ label, target, hash }` (internal). */
export const ContentLink = ({ link, className = buttonStyles.pill }) =>
  link.target ? (
    <InternalLink pageId={link.target} hash={link.hash} className={className}>
      {link.label}
      <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
    </InternalLink>
  ) : (
    <ExternalLink href={link.url} className={className}>
      {link.label}
    </ExternalLink>
  )

export const SectionHeader = ({ id, title, link }) => (
  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
    <h2 id={id} className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
      {title}
    </h2>
    {link}
  </div>
)

export const PageHeader = ({ title, intro, children }) => (
  <div className="border-b border-white/5">
    <Container className="pb-10 pt-12 md:pb-12 md:pt-16">
      <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">{title}</h1>
      {intro && <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-300">{intro}</p>}
      {children}
    </Container>
  </div>
)

/** Image with intrinsic size, optional srcset and a caption. `priority` marks the LCP image. */
export const Figure = ({ image, priority = false, className = '' }) => {
  if (!image?.src) return null
  return (
    <figure className={className}>
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={image.srcSet ? image.sizes : undefined}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchpriority={priority ? 'high' : undefined}
        className="block h-auto w-full rounded-lg border border-white/10 bg-navy-900"
      />
      {image.caption && <figcaption className="mt-3 text-sm leading-relaxed text-slate-400">{image.caption}</figcaption>}
    </figure>
  )
}

const AVATAR_SIZES = {
  sm: 'h-16 w-16 text-base',
  md: 'h-20 w-20 text-lg',
  lg: 'h-24 w-24 text-xl'
}

/** Round portrait, or a flat initials placeholder of the same size when there is no photo. */
export const Avatar = ({ name, photo, size = 'md' }) => {
  const sizeClass = AVATAR_SIZES[size] || AVATAR_SIZES.md
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        width="256"
        height="256"
        loading="lazy"
        decoding="async"
        className={`${sizeClass} shrink-0 rounded-full border border-white/10 bg-navy-800 object-cover`}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} flex shrink-0 select-none items-center justify-center rounded-full border border-white/10 bg-slate-700 font-semibold text-slate-100`}
    >
      {getInitials(name)}
    </span>
  )
}

/** Splits text on blank lines into paragraphs; single newlines become line breaks. */
export const Paragraphs = ({ text, className = '' }) =>
  (text || '')
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => (
      <p key={paragraph.slice(0, 40)} className={`whitespace-pre-line ${className}`}>
        {paragraph}
      </p>
    ))
