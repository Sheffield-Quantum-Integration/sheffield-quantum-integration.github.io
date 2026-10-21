import { useEffect, useState } from 'react'

const cache = new Map()

/** Fetches a JSON feed once per page load and shares the result between components. */
export const loadFeed = (url) => {
  if (!cache.has(url)) {
    const request = fetch(url, { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${url} (${response.status})`)
        return response.json()
      })
      .catch((error) => {
        cache.delete(url)
        throw error
      })
    cache.set(url, request)
  }
  return cache.get(url)
}

export const useFeed = (url) => {
  const [state, setState] = useState({ status: 'loading', data: null })

  useEffect(() => {
    let cancelled = false
    loadFeed(url)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) setState({ status: 'error', data: null })
      })
    return () => {
      cancelled = true
    }
  }, [url])

  return state
}
