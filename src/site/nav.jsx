import { createContext, useContext } from 'react'

export const NavContext = createContext({
  pathFor: () => '/',
  onLinkClick: () => {}
})

export const useNav = () => useContext(NavContext)

/** Client-side link to a page id, with an optional `#fragment`. */
export const InternalLink = ({ pageId, hash = '', children, ...rest }) => {
  const { pathFor, onLinkClick } = useNav()
  return (
    <a href={`${pathFor(pageId)}${hash}`} onClick={(event) => onLinkClick(event, pageId, hash)} {...rest}>
      {children}
    </a>
  )
}
