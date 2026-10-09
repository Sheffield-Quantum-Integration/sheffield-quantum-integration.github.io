/** Unlisted path. Do not add it to the nav, footer, sitemap, or robots.txt. */
export const QDD_REVIEW_PATH = '/qdd-review-881b63cee94cb2ebc9183dee'

export const QDD_REVIEW_PAGE_ID = 'qdd-review'

/**
 * Apps Script web app URL (the /exec URL).
 * Leave empty until the collector is deployed — the submit button stays hidden.
 */
export const QDD_REVIEW_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxskX2JUOu0RDhXac38aUi3T_iDAqITP_qVPZQYzUt8lCEE2evSce7nbcaAiraU30c/exec'

export const QDD_REVIEW_EMAIL = 'joe.a.smith@sheffield.ac.uk'

/** Positional talk cut in every session. The page ignores per-session targets in the JSON. */
export const TALK_TARGET = 3

/** The only pre-placed move. Tag text is shown as written. */
export const PROPOSED_MOVES = [
  {
    id: 'A22',
    proposedSession: 'Colour centres / defects',
    tag: 'Proposed move — submitted to Optics'
  }
]

/**
 * Theme colours are separate from the TALK / EITHER / POSTER badges.
 * Class names are complete strings so Tailwind can see them.
 */
export const SESSION_THEMES = {
  'Epitaxy / III–V emitters': {
    label: 'Epitaxy',
    dot: 'bg-blue-400',
    text: 'text-blue-200',
    border: 'border-l-blue-400',
    headerBg: 'bg-blue-400/10',
    chip: 'border-blue-400/40 text-blue-100'
  },
  'Colour centres / defects': {
    label: 'Colour centres',
    dot: 'bg-emerald-400',
    text: 'text-emerald-200',
    border: 'border-l-emerald-400',
    headerBg: 'bg-emerald-400/10',
    chip: 'border-emerald-400/40 text-emerald-100'
  },
  'Colloidal / soft-matter': {
    label: 'Colloidal',
    dot: 'bg-rose-400',
    text: 'text-rose-200',
    border: 'border-l-rose-400',
    headerBg: 'bg-rose-400/10',
    chip: 'border-rose-400/40 text-rose-100'
  },
  'Optics / integration / devices': {
    label: 'Optics',
    dot: 'bg-violet-400',
    text: 'text-violet-200',
    border: 'border-l-violet-400',
    headerBg: 'bg-violet-400/10',
    chip: 'border-violet-400/40 text-violet-100'
  }
}

export function themeFor(session) {
  return (
    SESSION_THEMES[session] || {
      label: session,
      dot: 'bg-white',
      text: 'text-white/70',
      border: 'border-l-white/40',
      headerBg: 'bg-white/5',
      chip: 'border-white/20 text-white/70'
    }
  )
}

export function scriptUrl() {
  return (QDD_REVIEW_SCRIPT_URL || '').trim()
}
