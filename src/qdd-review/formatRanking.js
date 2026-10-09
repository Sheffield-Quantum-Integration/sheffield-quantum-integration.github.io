import { PROPOSED_MOVES, QDD_REVIEW_EMAIL, TALK_TARGET, themeFor } from './config.js'
import { proposedMoveFor } from './storage.js'

const MAILTO_LIMIT = 1900

export function decisionLabel(decision) {
  if (decision === 'confirm') return 'confirm this session'
  if (decision === 'original') return 'keep in original session'
  return 'unanswered'
}

export function buildRankingPayload(data, state, submittedAt = new Date().toISOString()) {
  const byId = Object.fromEntries(data.abstracts.map((abs) => [abs.id, abs]))
  const talkSlotsTotal = data.sessions.length * TALK_TARGET

  const sessions = data.sessions.map((session) => {
    const ranked = (state.ranked[session] || []).map((id, index) => {
      const abs = byId[id]
      const note = state.meta[id]?.note || ''
      const position = index + 1
      const proposalMeta = proposedMoveFor(id)
      const savedProposal = state.proposals?.[id]
      const proposal = proposalMeta
        ? {
            submittedSession: abs.session,
            proposedSession: proposalMeta.proposedSession,
            decision: savedProposal?.decision ?? null,
            comment: savedProposal?.comment || ''
          }
        : null
      return {
        position,
        id,
        aboveCut: position <= TALK_TARGET,
        badge: abs.badge,
        preference: abs.preference,
        title: abs.title,
        presenter: abs.presenter,
        institution: abs.institution,
        originalSession: abs.session,
        session,
        moved: abs.session !== session,
        note,
        proposal
      }
    })
    return { session, talkTarget: TALK_TARGET, ranked }
  })

  const posters = data.abstracts
    .filter((abs) => abs.badge === 'POSTER')
    .map((abs) => {
      const entry = state.posters?.[abs.id] || { accept: true, reason: '' }
      const accept = entry.accept !== false
      return {
        id: abs.id,
        badge: abs.badge,
        preference: abs.preference,
        title: abs.title,
        presenter: abs.presenter,
        institution: abs.institution,
        theme: abs.session,
        note: state.meta[abs.id]?.note || '',
        accept,
        decision: accept ? 'accept' : 'reject',
        reason: accept ? '' : entry.reason || ''
      }
    })

  const moves = []
  const notes = []
  for (const block of sessions) {
    for (const row of block.ranked) {
      if (row.moved) moves.push({ id: row.id, from: row.originalSession, to: row.session })
      if (row.note) notes.push({ id: row.id, note: row.note })
    }
  }
  for (const row of posters) {
    if (row.note) notes.push({ id: row.id, note: row.note })
  }

  const proposals = PROPOSED_MOVES.map((proposal) => {
    const abs = byId[proposal.id]
    const saved = state.proposals?.[proposal.id] || { decision: null, comment: '' }
    const currentSession =
      sessions.find((block) => block.ranked.some((row) => row.id === proposal.id))?.session || abs.session
    return {
      id: proposal.id,
      presenter: abs.presenter,
      title: abs.title,
      submittedSession: abs.session,
      proposedSession: proposal.proposedSession,
      decision: saved.decision ?? null,
      comment: saved.comment || '',
      currentSession
    }
  })

  return {
    event: data.event,
    reviewerInitials: (state.reviewerInitials || '').trim(),
    submittedAt,
    talkSlotsTotal,
    sessions,
    posters,
    moves,
    proposals,
    notes
  }
}

export function missingRejectReasons(payload) {
  return payload.posters.filter((row) => row.decision === 'reject' && !String(row.reason || '').trim()).map((row) => row.id)
}

function lineForRanked(row) {
  const mark = String(row.position).padStart(2, ' ')
  const moved = row.moved ? ` [moved from ${row.originalSession}]` : ''
  const proposed = row.proposal ? ' [proposed move]' : ''
  const note = row.note ? ` — note: ${row.note}` : ''
  return `${mark}  ${row.id} ${row.badge}  ${row.presenter} — ${row.title}${moved}${proposed}${note}`
}

export function formatRankingText(payload) {
  const lines = [
    `${payload.event} — committee ranking`,
    `Reviewer initials: ${payload.reviewerInitials || '(not given)'}`,
    `Submitted: ${payload.submittedAt}`,
    ''
  ]

  for (const block of payload.sessions) {
    lines.push(`${block.session} (talk target ${block.talkTarget})`)
    let cutShown = false
    const showCut = () => {
      if (cutShown) return
      lines.push(`—— talk cut (${block.talkTarget}) ——`)
      cutShown = true
    }
    if (block.ranked.length === 0) {
      lines.push('(no talk or either abstracts)')
      showCut()
    }
    for (const row of block.ranked) {
      if (row.position === block.talkTarget + 1) showCut()
      lines.push(lineForRanked(row))
    }
    if (!cutShown) showCut()
    lines.push('')
  }

  lines.push('Proposed moves')
  if (!payload.proposals.length) {
    lines.push('none')
  }
  for (const proposal of payload.proposals) {
    lines.push(`${proposal.id}  ${proposal.presenter} — ${proposal.title}`)
    lines.push(`  Submitted to: ${proposal.submittedSession}`)
    lines.push(`  Proposed session: ${proposal.proposedSession}`)
    lines.push(`  Decision: ${decisionLabel(proposal.decision)}`)
    lines.push(`  Comment: ${proposal.comment || '(none)'}`)
    lines.push(`  Current session: ${proposal.currentSession}`)
  }
  lines.push('')

  lines.push('Poster session')
  for (const row of payload.posters) {
    const verdict = row.decision === 'reject' ? 'REJECT' : 'ACCEPT'
    const note = row.note ? ` (note: ${row.note})` : ''
    lines.push(
      `${verdict}  ${row.id}  ${row.presenter} — ${row.title} · ${themeFor(row.theme).label}${note}`
    )
    if (row.decision === 'reject') lines.push(`  reason: ${row.reason || '(missing)'}`)
  }
  lines.push('')

  lines.push('Session moves')
  if (!payload.moves.length) lines.push('none')
  for (const move of payload.moves) lines.push(`${move.id}: ${move.from} → ${move.to}`)
  lines.push('')

  lines.push('Notes')
  if (!payload.notes.length) lines.push('none')
  for (const note of payload.notes) lines.push(`${note.id}: ${note.note}`)
  lines.push('')

  return lines.join('\n')
}

export function formatSubmissionDocument(payload) {
  return `${formatRankingText(payload)}\n--- JSON ---\n${JSON.stringify(payload, null, 2)}\n`
}

function fitsMailto(prefix, text) {
  return prefix.length + encodeURIComponent(text).length <= MAILTO_LIMIT
}

export function buildMailto({ email = QDD_REVIEW_EMAIL, payload }) {
  const initials = (payload.reviewerInitials || '').trim()
  const subject = initials ? `QDD 2026 ranking — ${initials}` : 'QDD 2026 ranking'
  const prefix = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=`
  const readable = formatRankingText(payload)
  const json = JSON.stringify(payload, null, 2)
  const notice = '\n\n[Email shortened to fit. Use Copy ranking for the full text and JSON.]\n'
  const full = `${readable}\n--- JSON ---\n${json}\n`

  const finish = (text, truncated) => ({
    href: prefix + encodeURIComponent(text),
    truncated,
    text
  })

  if (fitsMailto(prefix, full)) return finish(full, false)

  const head = `${readable}\n--- JSON ---\n`
  if (fitsMailto(prefix, `${head}${notice}`)) {
    let lo = 0
    let hi = json.length
    let best = 0
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (fitsMailto(prefix, head + json.slice(0, mid) + notice)) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    let cut = best
    const slice = json.slice(0, cut)
    const lastBreak = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(','))
    if (lastBreak > 40) cut = lastBreak
    let text = head + json.slice(0, cut) + notice
    while (text.length > notice.length && !fitsMailto(prefix, text)) {
      cut = Math.floor(cut * 0.8)
      text = head + json.slice(0, cut) + notice
    }
    return finish(text, true)
  }

  const lines = readable.split('\n')
  const kept = []
  for (const line of lines) {
    const candidate = `${kept.concat(line).join('\n')}${notice}`
    if (!fitsMailto(prefix, candidate)) break
    kept.push(line)
  }
  let text = `${kept.join('\n')}${notice}`
  if (!fitsMailto(prefix, text)) text = notice.trim() + '\n'
  return finish(text, true)
}
