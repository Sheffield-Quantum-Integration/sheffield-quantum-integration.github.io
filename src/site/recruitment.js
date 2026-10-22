// One open/closed calculation for every current-recruitment surface. Deadlines come
// from the machine-readable `deadlineAt` (ISO 8601 with offset), never from the
// human-readable `deadline` text.

const deadlineMs = (item) => {
  if (!item?.deadlineAt) return null
  const ms = Date.parse(item.deadlineAt)
  return Number.isNaN(ms) ? null : ms
}

/** Open until the deadline instant; closed at and after it. Items without a deadline stay open. */
export const isOpportunityOpen = (item, now = Date.now()) => {
  if (!item || item.status === 'closed') return false
  if (!item.deadlineAt) return true
  const ms = deadlineMs(item)
  return ms !== null && now < ms
}

export const getRecruitmentState = (opportunitiesPage, now = Date.now()) => {
  const items = Array.isArray(opportunitiesPage?.items) ? opportunitiesPage.items : []
  const openItems = items.filter((item) => isOpportunityOpen(item, now))
  const closedItems = items.filter((item) => !isOpportunityOpen(item, now))
  return {
    items,
    openItems,
    closedItems,
    isRecruiting: openItems.length > 0,
    isOpen: (id) => openItems.some((item) => item.id === id)
  }
}

/** The next instant at which any item changes state, or null if none is pending. */
export const nextRecruitmentChange = (opportunitiesPage, now = Date.now()) => {
  const items = Array.isArray(opportunitiesPage?.items) ? opportunitiesPage.items : []
  const upcoming = items
    .map(deadlineMs)
    .filter((ms) => ms !== null && ms > now)
    .sort((a, b) => a - b)
  return upcoming[0] ?? null
}
