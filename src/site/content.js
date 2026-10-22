const HONORIFIC = /^(dr|prof)\.?$/i

/** Initials from the first two name parts, ignoring a leading Dr / Prof. */
export const getInitials = (name = '') => {
  const parts = name
    .replace(/[()]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean)
  while (parts.length > 1 && HONORIFIC.test(parts[0])) parts.shift()
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  return initials || '?'
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

/**
 * Formats `YYYY-MM-DD` as "19 October 2026" and, for `datePrecision: "month"`
 * (or a bare `YYYY-MM`), as "June 2026". Parsed by hand so no time zone can shift the day.
 */
export const formatNewsDate = (item) => {
  const value = item?.date
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  const monthName = MONTHS[Number(month) - 1]
  if (!monthName) return value
  if (item.datePrecision === 'month' || !day) return `${monthName} ${year}`
  return `${Number(day)} ${monthName} ${year}`
}

/** Machine-readable value for <time dateTime>, at the precision the item actually has. */
export const newsDateTime = (item) => {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(item?.date || '')
  if (!match) return undefined
  return item.datePrecision === 'month' || !match[3] ? `${match[1]}-${match[2]}` : match[0]
}

const byKeyDescThenId = (key) => (a, b) => {
  if (a.key !== b.key) return a.key < b.key ? 1 : -1
  return a.tie < b.tie ? -1 : a.tie > b.tie ? 1 : 0
}

/** Newest first by date (month-precision items sort by their month), ties broken by id. */
export const sortNews = (items = []) =>
  items
    .map((item) => ({ item, key: (item.date || '').slice(0, 10), tie: item.id || item.title || '' }))
    .sort(byKeyDescThenId())
    .map(({ item }) => item)

/** Publication year taken from the venue text, e.g. "Nature Communications 17, 6185 (2026)". */
export const publicationYear = (pub) => {
  const years = (pub?.venue || '').match(/\b(19|20)\d{2}\b/g)
  return years ? Math.max(...years.map(Number)) : 0
}

/** Newest year first; within a year the feed's own order is kept. */
export const sortPublications = (items = []) =>
  items
    .map((pub, index) => ({ pub, index, year: publicationYear(pub) }))
    .sort((a, b) => b.year - a.year || a.index - b.index)
    .map(({ pub }) => pub)

export const CORE_GROUPS = ['Postdocs', 'PhD Students']

export const groupCoreMembers = (members = []) => {
  const groups = members.reduce((acc, member) => {
    const group = member.group || member.role || 'Members'
    if (!acc[group]) acc[group] = []
    acc[group].push(member)
    return acc
  }, {})
  const names = Object.keys(groups)
  const ordered = [...CORE_GROUPS.filter((group) => names.includes(group)), ...names.filter((group) => !CORE_GROUPS.includes(group)).sort()]
  return ordered.map((group) => ({ group, members: groups[group] }))
}
