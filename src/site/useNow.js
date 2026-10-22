import { useEffect, useState } from 'react'

// Browsers clamp longer setTimeout delays and fire them immediately.
const MAX_TIMEOUT_MS = 2 ** 31 - 1

/**
 * Current time that refreshes once a minute, when the tab becomes visible or
 * focused again, and exactly at `nextChangeAt`, so a long-open tab does not keep
 * advertising an expired opening.
 */
export const useNow = (nextChangeAt = null, intervalMs = 60_000) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const interval = window.setInterval(refresh, intervalMs)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', refresh)
    }
  }, [intervalMs])

  useEffect(() => {
    if (nextChangeAt == null) return undefined
    const delay = Math.min(Math.max(nextChangeAt - Date.now(), 0) + 50, MAX_TIMEOUT_MS)
    const timeout = window.setTimeout(() => setNow(Date.now()), delay)
    return () => window.clearTimeout(timeout)
  }, [nextChangeAt, now])

  return now
}
