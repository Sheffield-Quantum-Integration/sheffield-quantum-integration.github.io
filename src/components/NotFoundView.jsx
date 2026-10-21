import { InternalLink } from '../site/nav.jsx'
import { Container, Eyebrow, buttonStyles } from './ui.jsx'

export default function NotFoundView() {
  return (
    <Container className="flex min-h-[60vh] flex-col justify-center py-20">
      <Eyebrow>Error 404</Eyebrow>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">Page not found</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
        We couldn’t find a page at this address. It may have moved, or the link may be mistyped.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <InternalLink pageId="home" className={buttonStyles.primary}>
          Go to the home page
        </InternalLink>
        <InternalLink pageId="research" className={buttonStyles.secondary}>
          Research
        </InternalLink>
      </div>
    </Container>
  )
}
