import { PROPOSED_MOVES } from './config.js'

export const STORAGE_KEY = 'qdd-committee-ranking-v2'

const NOTE_LIMIT = 240
const COMMENT_LIMIT = 200
const REASON_LIMIT = 200
const INITIALS_LIMIT = 40

export function proposedMoveFor(id) {
  return PROPOSED_MOVES.find((item) => item.id === id) || null
}

function abstractMap(data) {
  return Object.fromEntries(data.abstracts.map((abs) => [abs.id, abs]))
}

export function createInitialState(data) {
  const ranked = {}
  for (const session of data.sessions) ranked[session] = []

  const meta = {}
  const posters = {}
  const proposals = {}
  const proposedLater = []

  for (const proposal of PROPOSED_MOVES) {
    const abs = data.abstracts.find((item) => item.id === proposal.id)
    if (!abs) throw new Error(`Proposed abstract ${proposal.id} is missing`)
    if (abs.badge === 'POSTER') throw new Error(`Proposed abstract ${proposal.id} is a poster`)
    if (!data.sessions.includes(proposal.proposedSession)) {
      throw new Error(`Unknown proposed session for ${proposal.id}`)
    }
    proposals[proposal.id] = { decision: null, comment: '' }
  }

  for (const abs of data.abstracts) {
    meta[abs.id] = { note: '' }
    if (abs.badge === 'POSTER') {
      posters[abs.id] = { accept: true, reason: '' }
      continue
    }
    if (proposedMoveFor(abs.id)) {
      proposedLater.push(abs)
      continue
    }
    ranked[abs.session].push(abs.id)
  }

  for (const abs of proposedLater) {
    ranked[proposedMoveFor(abs.id).proposedSession].push(abs.id)
  }

  return { reviewerInitials: '', ranked, meta, posters, proposals }
}

export function sessionOf(ranked, id) {
  for (const session of Object.keys(ranked)) {
    if ((ranked[session] || []).includes(id)) return session
  }
  return null
}

export function reconcile(saved, data) {
  const initial = createInitialState(data)
  if (!saved || typeof saved !== 'object') return initial

  const byId = abstractMap(data)
  const known = new Set(data.abstracts.map((abs) => abs.id))
  const ranked = {}
  for (const session of data.sessions) ranked[session] = []
  const placed = new Set()

  const place = (id, sessionHint) => {
    if (!known.has(id) || placed.has(id)) return
    const abs = byId[id]
    if (!abs || abs.badge === 'POSTER') return
    const session = data.sessions.includes(sessionHint) ? sessionHint : abs.session
    ranked[session].push(id)
    placed.add(id)
  }

  const savedRanked = saved.ranked && typeof saved.ranked === 'object' ? saved.ranked : null
  if (savedRanked) {
    for (const session of data.sessions) {
      const ids = Array.isArray(savedRanked[session]) ? savedRanked[session] : []
      for (const id of ids) place(id, session)
    }
  }
  for (const session of data.sessions) {
    for (const id of initial.ranked[session]) place(id, session)
  }

  const meta = {}
  for (const abs of data.abstracts) {
    const prev = saved.meta && saved.meta[abs.id] ? saved.meta[abs.id] : {}
    meta[abs.id] = {
      note: typeof prev.note === 'string' ? prev.note.slice(0, NOTE_LIMIT) : ''
    }
  }

  const posters = {}
  for (const abs of data.abstracts) {
    if (abs.badge !== 'POSTER') continue
    const prev = saved.posters && saved.posters[abs.id] ? saved.posters[abs.id] : {}
    posters[abs.id] = {
      accept: prev.accept === false ? false : true,
      reason: typeof prev.reason === 'string' ? prev.reason.slice(0, REASON_LIMIT) : ''
    }
  }

  const proposals = {}
  for (const proposal of PROPOSED_MOVES) {
    const prev = saved.proposals && saved.proposals[proposal.id] ? saved.proposals[proposal.id] : {}
    let decision = prev.decision === 'confirm' || prev.decision === 'original' ? prev.decision : null
    const current = sessionOf(ranked, proposal.id)
    const original = byId[proposal.id].session
    const consistent =
      !decision ||
      (decision === 'confirm' && current === proposal.proposedSession) ||
      (decision === 'original' && current === original)
    if (!consistent) decision = null
    proposals[proposal.id] = {
      decision,
      comment: typeof prev.comment === 'string' ? prev.comment.slice(0, COMMENT_LIMIT) : ''
    }
  }

  return {
    reviewerInitials:
      typeof saved.reviewerInitials === 'string' ? saved.reviewerInitials.slice(0, INITIALS_LIMIT) : '',
    ranked,
    meta,
    posters,
    proposals
  }
}

export function loadState(data) {
  try {
    if (typeof localStorage === 'undefined') return createInitialState(data)
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState(data)
    return reconcile(JSON.parse(raw), data)
  } catch {
    return createInitialState(data)
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function relocateRanked(state, id, toSession, sessions, beforeId = null) {
  if (!sessions.includes(toSession)) return state
  const from = sessionOf(state.ranked, id)
  if (!from) return state
  if (from === toSession && (beforeId == null || beforeId === id)) return state

  const ranked = {}
  for (const session of sessions) {
    ranked[session] = (state.ranked[session] || []).filter((item) => item !== id)
  }
  const destination = ranked[toSession]
  const beforeIndex = beforeId ? destination.indexOf(beforeId) : -1
  if (beforeIndex >= 0) destination.splice(beforeIndex, 0, id)
  else destination.push(id)

  return { ...state, ranked }
}

export function clearInconsistentDecision(state, id, data) {
  const proposal = proposedMoveFor(id)
  if (!proposal || !state.proposals?.[id]?.decision) return state
  const decision = state.proposals[id].decision
  const current = sessionOf(state.ranked, id)
  const original = data.abstracts.find((abs) => abs.id === id)?.session
  const consistent =
    (decision === 'confirm' && current === proposal.proposedSession) ||
    (decision === 'original' && current === original)
  if (consistent) return state
  return {
    ...state,
    proposals: {
      ...state.proposals,
      [id]: { ...state.proposals[id], decision: null }
    }
  }
}

export function moveRankedCard(state, id, toSession, sessions, data, beforeId = null) {
  return clearInconsistentDecision(relocateRanked(state, id, toSession, sessions, beforeId), id, data)
}

export function decideProposal(state, id, decision, sessions, data) {
  const proposal = proposedMoveFor(id)
  if (!proposal || (decision !== 'confirm' && decision !== 'original')) return state
  const abs = data.abstracts.find((item) => item.id === id)
  if (!abs) return state
  const target = decision === 'confirm' ? proposal.proposedSession : abs.session
  const moved = relocateRanked(state, id, target, sessions)
  return {
    ...moved,
    proposals: {
      ...moved.proposals,
      [id]: { ...(moved.proposals[id] || { comment: '' }), decision }
    }
  }
}
