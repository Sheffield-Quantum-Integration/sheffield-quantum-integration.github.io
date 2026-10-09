const ECHO_HOST = 'script.googleusercontent.com'

/**
 * Apps Script runs doPost to completion, then answers with a 302 to a one-time
 * echo URL. That echo request often returns 404 after the sheet row is already
 * written. A cross-origin redirect is exposed to fetch as an opaque redirect
 * when redirect mode is "manual", so we never need to read the echo body.
 * A readable { ok: false } (no redirect) is still a failed save.
 */
export function rankingWasReceived(response, parsed) {
  if (!response) return false
  if (parsed && parsed.ok === false) return false
  if (response.type === 'opaque' || response.type === 'opaqueredirect') return true
  if (response.ok) return true
  if (parsed && parsed.ok === true) return true
  if (response.status >= 300 && response.status < 400) return true
  let host = ''
  try {
    host = new URL(response.url || '').hostname
  } catch {
    host = ''
  }
  return host === ECHO_HOST && response.status === 404
}

export async function postRanking(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  let parsed = null
  if (response.type !== 'opaque' && response.type !== 'opaqueredirect') {
    const text = await response.text()
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
  }
  return rankingWasReceived(response, parsed)
}
