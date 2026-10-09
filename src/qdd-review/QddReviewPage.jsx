import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, GripVertical } from 'lucide-react'
import reviewData from '../data/qdd-abstracts-review.json'
import { scriptUrl, themeFor } from './config.js'
import {
  buildMailto,
  buildRankingPayload,
  formatSubmissionDocument,
  missingRejectReasons
} from './formatRanking.js'
import {
  decideProposal,
  loadState,
  moveRankedCard,
  proposedMoveFor,
  saveState,
  sessionOf
} from './storage.js'

const BADGE_CLASS = {
  TALK: 'bg-white text-[#0B1629]',
  EITHER: 'bg-amber-300 text-[#0B1629]',
  POSTER: 'border border-dashed border-white/70 bg-transparent text-white'
}

function countsLabel(data) {
  const tally = { TALK: 0, EITHER: 0, POSTER: 0 }
  for (const abs of data.abstracts) tally[abs.badge] = (tally[abs.badge] || 0) + 1
  return `${data.abstracts.length}: ${tally.TALK} Talk / ${tally.EITHER} Either / ${tally.POSTER} Poster`
}

function guideLabel(data) {
  return `About ${data.talkSlotsTotal} contributed talk slots (roughly 3 Epitaxy, 2 to 3 Colour centres, 3 Colloidal, 4 Optics).`
}

function isContainerId(id) {
  return String(id).startsWith('drop:')
}

function collisionDetection(args) {
  const pointerHits = pointerWithin(args)
  const cardsUnderPointer = pointerHits.filter((hit) => !isContainerId(hit.id))
  if (cardsUnderPointer.length > 0) return cardsUnderPointer
  if (pointerHits.length > 0) return pointerHits
  const centerHits = closestCenter(args)
  const cardsByCenter = centerHits.filter((hit) => !isContainerId(hit.id))
  if (cardsByCenter.length > 0) return cardsByCenter
  return centerHits
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.top = '0'
      area.style.left = '0'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.focus()
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

function Badge({ badge }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.14em] ${BADGE_CLASS[badge] || BADGE_CLASS.POSTER}`}
    >
      {badge}
    </span>
  )
}

function ThemeDot({ session }) {
  const theme = themeFor(session)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border bg-white/5 px-2 py-0.5 text-[11px] font-medium ${theme.chip}`}
      title={session}
    >
      <span className={`h-2 w-2 rounded-full ${theme.dot}`} aria-hidden="true" />
      {theme.label}
    </span>
  )
}

function CutLine({ target, session }) {
  return (
    <div
      className="flex items-center gap-3 py-1.5"
      role="separator"
      aria-label={`Talk cut after ${target} in ${session}`}
      data-testid={`talk-cut-${session}`}
    >
      <div className="h-px flex-1 bg-white/80" />
      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white">Talk cut · {target}</span>
      <div className="h-px flex-1 bg-white/80" />
    </div>
  )
}

function coauthorLines(value) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function ExpandedBody({ abstract }) {
  const authors = coauthorLines(abstract.coauthors)
  return (
    <div className="border-t border-white/10 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Co-authors</p>
      {authors.length === 0 ? (
        <p className="mt-1 text-sm text-white/55">No co-authors listed.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {authors.map((line) => (
            <li key={line} className="text-sm leading-snug text-white/75">
              {line}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Abstract</p>
      <p className="mt-1 max-h-60 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-white/75">
        {abstract.abstract}
      </p>
    </div>
  )
}

function choiceClass(active) {
  return active
    ? 'border-white bg-white text-[#0B1629]'
    : 'border-white/25 bg-transparent text-white/80 hover:border-white/50'
}

function RankCard({
  abstract,
  currentSession,
  talkRank,
  aboveCut,
  conflict,
  note,
  expanded,
  proposal,
  decision,
  comment,
  onToggle,
  onSessionChange,
  onConflict,
  onNote,
  onDecide,
  onComment
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: abstract.id
  })
  const theme = themeFor(currentSession)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      id={`card-${abstract.id}`}
      data-testid={`card-${abstract.id}`}
      data-above-cut={aboveCut ? 'true' : 'false'}
      data-decision={proposal ? decision || 'unanswered' : undefined}
      className={`scroll-mb-56 border border-white/10 border-l-4 sm:scroll-mb-40 ${theme.border} ${
        aboveCut ? 'bg-white/[0.06]' : 'bg-white/[0.03]'
      } ${conflict ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2 p-2.5 sm:p-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="mt-0.5 flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-sm border border-white/10 text-white/50 touch-none active:cursor-grabbing"
          aria-label={`Drag to rank ${abstract.id}. On a touch screen, press and hold.`}
          data-testid={`handle-${abstract.id}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="w-7 shrink-0 pt-2 text-center text-sm font-bold tabular-nums text-white">
          {conflict ? '–' : talkRank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-white/45">{abstract.id}</span>
            <Badge badge={abstract.badge} />
            {conflict && (
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Skipped</span>
            )}
          </div>
          <button
            type="button"
            className={`mt-1 text-left text-sm font-semibold text-white ${expanded ? '' : 'line-clamp-2'}`}
            aria-expanded={expanded}
            onClick={onToggle}
          >
            {abstract.title}
          </button>
          <p className="mt-0.5 text-xs text-white/50">
            {abstract.presenter}
            <span className="text-white/30"> · </span>
            {abstract.institution}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-2.5 pb-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:px-3">
        <label className="sr-only" htmlFor={`session-${abstract.id}`}>
          Session for {abstract.id}
        </label>
        <select
          id={`session-${abstract.id}`}
          value={currentSession}
          onChange={(event) => onSessionChange(abstract.id, event.target.value)}
          className="min-h-11 w-full rounded-sm border border-white/20 bg-[#0B1629] px-2 text-xs text-white sm:w-auto sm:max-w-xs"
        >
          {reviewData.sessions.map((session) => (
            <option key={session} value={session}>
              {session}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={conflict}
          onClick={() => onConflict(abstract.id)}
          className={`min-h-11 rounded-sm border px-3 text-xs font-semibold ${
            conflict ? 'border-white bg-white/15 text-white' : 'border-white/20 text-white/70'
          }`}
        >
          Conflict
        </button>
        <input
          type="text"
          value={note}
          maxLength={240}
          placeholder="Note"
          aria-label={`Note for ${abstract.id}`}
          onChange={(event) => onNote(abstract.id, event.target.value)}
          className="min-h-11 w-full flex-1 rounded-sm border border-white/20 bg-[#0B1629] px-2 text-sm text-white placeholder:text-white/30 sm:min-w-[12rem]"
        />
      </div>

      {proposal && (
        <div className="mx-2.5 mb-2.5 border-t border-white/10 px-0.5 pt-2 sm:mx-3">
          <p className="inline-flex rounded-sm border border-white/25 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80">
            Proposed move — submitted to {abstract.session}
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <button
              type="button"
              aria-pressed={decision === 'confirm'}
              onClick={() => onDecide(abstract.id, 'confirm')}
              className={`min-h-11 rounded-sm border px-3 text-left text-xs font-semibold ${choiceClass(decision === 'confirm')}`}
            >
              Confirm this session
            </button>
            <button
              type="button"
              aria-pressed={decision === 'original'}
              onClick={() => onDecide(abstract.id, 'original')}
              className={`min-h-11 rounded-sm border px-3 text-left text-xs font-semibold ${choiceClass(decision === 'original')}`}
            >
              Keep in original session
            </button>
          </div>
          <label className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40" htmlFor={`comment-${abstract.id}`}>
            Comment
          </label>
          <input
            id={`comment-${abstract.id}`}
            type="text"
            value={comment}
            maxLength={200}
            placeholder="Short comment on this move"
            onChange={(event) => onComment(abstract.id, event.target.value)}
            className="mt-1 min-h-11 w-full rounded-sm border border-white/20 bg-[#0B1629] px-2 text-sm text-white placeholder:text-white/30"
          />
        </div>
      )}

      {expanded && <ExpandedBody abstract={abstract} />}
    </article>
  )
}

function PosterCard({ abstract, accept, reason, conflict, note, expanded, showReasonError, onToggle, onConflict, onNote, onAccept, onReason }) {
  const reasonMissing = accept === false && !reason.trim()
  return (
    <article
      id={`card-${abstract.id}`}
      data-testid={`card-${abstract.id}`}
      className={`scroll-mb-56 border border-white/10 bg-white/[0.03] sm:scroll-mb-40 ${conflict ? 'opacity-60' : ''}`}
    >
      <div className="p-2.5 sm:p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-white/45">{abstract.id}</span>
          <Badge badge="POSTER" />
          <ThemeDot session={abstract.session} />
          {conflict && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">Skipped</span>}
        </div>
        <button
          type="button"
          className={`mt-1 text-left text-sm font-semibold text-white ${expanded ? '' : 'line-clamp-2'}`}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {abstract.title}
        </button>
        <p className="mt-0.5 text-xs text-white/50">
          {abstract.presenter}
          <span className="text-white/30"> · </span>
          {abstract.institution}
        </p>
      </div>
      <div className="flex flex-col gap-2 px-2.5 pb-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:px-3">
        <div className="inline-flex min-h-11 overflow-hidden rounded-sm border border-white/20" role="group" aria-label={`Accept or reject ${abstract.id}`}>
          <button
            type="button"
            aria-pressed={accept !== false}
            onClick={() => onAccept(abstract.id, true)}
            className={`px-3 text-xs font-bold ${accept !== false ? 'bg-white text-[#0B1629]' : 'text-white/60'}`}
          >
            Accept
          </button>
          <button
            type="button"
            aria-pressed={accept === false}
            onClick={() => onAccept(abstract.id, false)}
            className={`border-l border-white/20 px-3 text-xs font-bold ${accept === false ? 'bg-white text-[#0B1629]' : 'text-white/60'}`}
          >
            Reject
          </button>
        </div>
        <button
          type="button"
          aria-pressed={conflict}
          onClick={() => onConflict(abstract.id)}
          className={`min-h-11 rounded-sm border px-3 text-xs font-semibold ${
            conflict ? 'border-white bg-white/15 text-white' : 'border-white/20 text-white/70'
          }`}
        >
          Conflict
        </button>
        <input
          type="text"
          value={note}
          maxLength={240}
          placeholder="Note"
          aria-label={`Note for ${abstract.id}`}
          onChange={(event) => onNote(abstract.id, event.target.value)}
          className="min-h-11 w-full flex-1 rounded-sm border border-white/20 bg-[#0B1629] px-2 text-sm text-white placeholder:text-white/30 sm:min-w-[12rem]"
        />
      </div>
      {accept === false && (
        <div className="px-2.5 pb-2.5 sm:px-3">
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40" htmlFor={`poster-reason-${abstract.id}`}>
            Reason
          </label>
          <input
            id={`poster-reason-${abstract.id}`}
            type="text"
            value={reason}
            maxLength={200}
            placeholder="Short reason for rejecting"
            aria-invalid={showReasonError && reasonMissing}
            onChange={(event) => onReason(abstract.id, event.target.value)}
            className={`mt-1 min-h-11 w-full rounded-sm border bg-[#0B1629] px-2 text-sm text-white placeholder:text-white/30 ${
              showReasonError && reasonMissing ? 'border-white' : 'border-white/20'
            }`}
          />
          {showReasonError && reasonMissing && (
            <p className="mt-1 text-xs text-white/70">Add a short reason for this rejection.</p>
          )}
        </div>
      )}
      {expanded && <ExpandedBody abstract={abstract} />}
    </article>
  )
}

function RankedList({ session, ids, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `drop:${session}` })
  return (
    <SortableContext id={session} items={ids} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 ${isOver ? 'outline outline-1 outline-white/40' : ''} ${
          ids.length === 0 ? 'min-h-16' : ''
        }`}
      >
        {ids.length === 0 && (
          <p className="px-1 py-3 text-xs text-white/40">No talk or either abstracts in this session. Drag one here.</p>
        )}
        {children}
      </div>
    </SortableContext>
  )
}

function OverlayCard({ abstract, session }) {
  if (!abstract) return null
  const theme = themeFor(session)
  return (
    <div className={`border border-white/30 border-l-4 bg-[#0B1629] px-3 py-2 shadow-2xl ${theme.border}`}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-white/50">{abstract.id}</span>
        <Badge badge={abstract.badge} />
      </div>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{abstract.title}</p>
    </div>
  )
}

export default function QddReviewPage() {
  const [state, setState] = useState(() => loadState(reviewData))
  const [entered, setEntered] = useState(() => Boolean(state.reviewerName.trim()))
  const [saveError, setSaveError] = useState(false)
  const [openPanels, setOpenPanels] = useState(() =>
    Object.fromEntries(reviewData.sessions.map((session) => [session, true]))
  )
  const [postersOpen, setPostersOpen] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [showReasonErrors, setShowReasonErrors] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [submitStatus, setSubmitStatus] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    setSaveError(!saveState(state))
  }, [state])

  const byId = useMemo(() => Object.fromEntries(reviewData.abstracts.map((abs) => [abs.id, abs])), [])
  const posters = useMemo(() => reviewData.abstracts.filter((abs) => abs.badge === 'POSTER'), [])
  const payload = useMemo(() => buildRankingPayload(reviewData, state), [state])
  const mailto = useMemo(() => buildMailto({ payload }), [payload])
  const uploadUrl = scriptUrl()
  const headerCounts = countsLabel(reviewData)
  const guide = guideLabel(reviewData)

  const update = (recipe) => {
    setSubmitStatus('')
    setSubmitMessage('')
    setCopyStatus('')
    setState(recipe)
  }

  const revealSession = (session) => {
    setOpenPanels((prev) => ({ ...prev, [session]: true }))
  }

  const scrollCard = (id) => {
    window.setTimeout(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      document.getElementById(`card-${id}`)?.scrollIntoView({
        block: 'nearest',
        behavior: reduce ? 'auto' : 'smooth'
      })
    }, 40)
  }

  const ensureReasons = () => {
    const missing = missingRejectReasons(payload)
    if (missing.length === 0) return true
    setShowReasonErrors(true)
    setPostersOpen(true)
    document.getElementById(`poster-reason-${missing[0]}`)?.focus()
    return false
  }

  const onDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const activeKey = String(active.id)
    const overKey = String(over.id)
    const from = sessionOf(state.ranked, activeKey)
    const to = overKey.startsWith('drop:') ? overKey.slice(5) : sessionOf(state.ranked, overKey)
    if (from && to && from !== to) revealSession(to)
    update((prev) => {
      const fromNow = sessionOf(prev.ranked, activeKey)
      const toNow = overKey.startsWith('drop:') ? overKey.slice(5) : sessionOf(prev.ranked, overKey)
      if (!fromNow || !toNow) return prev
      if (fromNow === toNow) {
        if (overKey.startsWith('drop:')) return prev
        const items = prev.ranked[fromNow]
        const oldIndex = items.indexOf(activeKey)
        const newIndex = items.indexOf(overKey)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev
        return { ...prev, ranked: { ...prev.ranked, [fromNow]: arrayMove(items, oldIndex, newIndex) } }
      }
      return moveRankedCard(
        prev,
        activeKey,
        toNow,
        reviewData.sessions,
        reviewData,
        overKey.startsWith('drop:') ? null : overKey
      )
    })
  }

  const sendRanking = async () => {
    if (!uploadUrl || !state.reviewerName.trim()) return
    if (!ensureReasons()) return
    setSubmitStatus('sending')
    setSubmitMessage('')
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
      if (response.type === 'opaque') {
        setSubmitStatus('sent')
        return
      }
      const text = await response.text()
      let body = null
      try {
        body = JSON.parse(text)
      } catch {
        body = null
      }
      if (!response.ok || (body && body.ok === false)) {
        throw new Error((body && body.error) || 'The sheet did not accept the ranking')
      }
      setSubmitStatus('sent')
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage(error instanceof Error ? error.message : 'Could not send. Use Copy ranking instead.')
    }
  }

  const onCopy = async () => {
    if (!state.reviewerName.trim()) return
    if (!ensureReasons()) return
    const ok = await copyText(formatSubmissionDocument(payload))
    setCopyStatus(ok ? 'copied' : 'failed')
  }

  const activeAbstract = activeId ? byId[activeId] : null
  const activeSession = activeId ? sessionOf(state.ranked, activeId) : null

  return (
    <div className="min-h-screen bg-[#0B1629] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B1629]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <a href="/" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40 hover:text-cyan-300">
                SQIL
              </a>
              <h1 className="text-lg font-bold tracking-tight text-white">QDD 2026 committee ranking</h1>
            </div>
            {entered && (
              <label className="text-xs text-white/50">
                Reviewing as
                <input
                  value={state.reviewerName}
                  maxLength={80}
                  aria-label="Your name"
                  onChange={(event) => update((prev) => ({ ...prev, reviewerName: event.target.value }))}
                  className="ml-2 min-h-11 rounded-sm border border-white/20 bg-[#0B1629] px-2 text-sm text-white"
                />
              </label>
            )}
          </div>
          <p className="text-sm font-semibold text-white" data-testid="header-counts">
            {headerCounts}
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
        <p className="text-xs leading-relaxed text-white/60">{guide}</p>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
          <span className="font-semibold uppercase tracking-[0.14em]">Preference</span>
          <Badge badge="TALK" />
          <Badge badge="EITHER" />
          <Badge badge="POSTER" />
          <span className="ml-1 font-semibold uppercase tracking-[0.14em]">Theme</span>
          {reviewData.sessions.map((session) => (
            <ThemeDot key={session} session={session} />
          ))}
        </div>
        <p className="text-[11px] text-white/40">
          {saveError ? 'Could not save on this device.' : 'Saved on this device. Only your ranking is stored here.'}
          <span className="mx-1 text-white/20">·</span>
          Drag the handle to rank. On a phone, press and hold the handle.
        </p>
      </div>

      {!entered ? (
        <div className="mx-auto max-w-md px-4 py-16">
          <form
            className="border border-white/10 bg-white/[0.03] p-6"
            onSubmit={(event) => {
              event.preventDefault()
              const name = state.reviewerName.trim()
              if (!name) return
              update((prev) => ({ ...prev, reviewerName: name }))
              setEntered(true)
            }}
          >
            <h2 className="text-xl font-bold">Your name</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Rankings save on this device under your name. Enter it to begin.
            </p>
            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40" htmlFor="reviewer-name">
              Name
            </label>
            <input
              id="reviewer-name"
              autoFocus
              autoComplete="name"
              maxLength={80}
              value={state.reviewerName}
              onChange={(event) => setState((prev) => ({ ...prev, reviewerName: event.target.value }))}
              className="mt-1 min-h-11 w-full rounded-sm border border-white/20 bg-[#0B1629] px-3 text-base text-white"
            />
            <button
              type="submit"
              className="mt-4 min-h-11 rounded-sm bg-cyan-400 px-4 text-sm font-bold text-[#0B1629] hover:bg-cyan-300"
            >
              Continue
            </button>
          </form>
        </div>
      ) : (
        <>
          <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 pb-64 sm:pb-40">
            <DndContext
              sensors={sensors}
              collisionDetection={collisionDetection}
              onDragStart={(event) => setActiveId(String(event.active.id))}
              onDragCancel={() => setActiveId(null)}
              onDragEnd={onDragEnd}
            >
              {reviewData.sessions.map((session) => {
                const theme = themeFor(session)
                const ids = state.ranked[session] || []
                const target = reviewData.talkTargets[session] ?? 0
                const open = openPanels[session] !== false
                let eligible = 0
                let cutPlaced = false
                const cards = []
                const placeCut = () => {
                  if (cutPlaced) return
                  cards.push(<CutLine key={`${session}-cut`} target={target} session={session} />)
                  cutPlaced = true
                }
                for (const id of ids) {
                  const conflict = Boolean(state.meta[id]?.conflict)
                  if (!conflict && eligible === target) placeCut()
                  const talkRank = conflict ? null : eligible + 1
                  if (!conflict) eligible += 1
                  const abstract = byId[id]
                  const proposal = proposedMoveFor(id)
                  cards.push(
                    <RankCard
                      key={id}
                      abstract={abstract}
                      currentSession={session}
                      talkRank={talkRank}
                      aboveCut={talkRank !== null && talkRank <= target}
                      conflict={conflict}
                      note={state.meta[id]?.note || ''}
                      expanded={Boolean(expanded[id])}
                      proposal={proposal}
                      decision={state.proposals[id]?.decision || null}
                      comment={state.proposals[id]?.comment || ''}
                      onToggle={() => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                      onSessionChange={(cardId, next) => {
                        revealSession(next)
                        update((prev) => moveRankedCard(prev, cardId, next, reviewData.sessions, reviewData))
                        scrollCard(cardId)
                      }}
                      onConflict={(cardId) =>
                        update((prev) => ({
                          ...prev,
                          meta: { ...prev.meta, [cardId]: { ...prev.meta[cardId], conflict: !prev.meta[cardId].conflict } }
                        }))
                      }
                      onNote={(cardId, value) =>
                        update((prev) => ({
                          ...prev,
                          meta: { ...prev.meta, [cardId]: { ...prev.meta[cardId], note: value.slice(0, 240) } }
                        }))
                      }
                      onDecide={(cardId, decision) => {
                        const move = proposedMoveFor(cardId)
                        const targetSession = decision === 'confirm' ? move.proposedSession : byId[cardId].session
                        revealSession(targetSession)
                        update((prev) => decideProposal(prev, cardId, decision, reviewData.sessions, reviewData))
                        scrollCard(cardId)
                      }}
                      onComment={(cardId, value) =>
                        update((prev) => ({
                          ...prev,
                          proposals: {
                            ...prev.proposals,
                            [cardId]: { ...prev.proposals[cardId], comment: value.slice(0, 200) }
                          }
                        }))
                      }
                    />
                  )
                }
                placeCut()
                const above = Math.min(
                  ids.filter((id) => !state.meta[id]?.conflict).length,
                  target
                )
                const guideNote = session === 'Colour centres / defects' ? ' · guide 2–3' : ''

                return (
                  <section key={session} className="border border-white/10" data-testid={`session-${theme.label}`}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 border-l-4 px-3 py-3 text-left ${theme.border} ${theme.headerBg}`}
                      aria-expanded={open}
                      onClick={() => setOpenPanels((prev) => ({ ...prev, [session]: !open }))}
                    >
                      <span>
                        <span className="block text-sm font-bold text-white">{session}</span>
                        <span className="mt-0.5 block text-[11px] text-white/55">
                          {ids.length} to rank · target {target}
                          {guideNote} · {above} above cut
                        </span>
                      </span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <div className="p-2 sm:p-3">
                        <RankedList session={session} ids={ids}>
                          {cards}
                        </RankedList>
                      </div>
                    )}
                  </section>
                )
              })}
              <DragOverlay>
                {activeAbstract ? <OverlayCard abstract={activeAbstract} session={activeSession} /> : null}
              </DragOverlay>
            </DndContext>

            <section id="poster-session" className="border border-white/10" data-testid="poster-session">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 border-l-4 border-l-white/40 bg-white/5 px-3 py-3 text-left"
                aria-expanded={postersOpen}
                onClick={() => setPostersOpen((prev) => !prev)}
              >
                <span>
                  <span className="block text-sm font-bold text-white">Poster session</span>
                  <span className="mt-0.5 block text-[11px] text-white/55">
                    {posters.length} posters · accept or reject · theme tag is informational
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-white/50 transition-transform ${postersOpen ? 'rotate-180' : ''}`} />
              </button>
              {postersOpen && (
                <div className="flex flex-col gap-2 p-2 sm:p-3">
                  {posters.map((abstract) => {
                    const entry = state.posters[abstract.id] || { accept: true, reason: '' }
                    return (
                      <PosterCard
                        key={abstract.id}
                        abstract={abstract}
                        accept={entry.accept !== false}
                        reason={entry.reason || ''}
                        conflict={Boolean(state.meta[abstract.id]?.conflict)}
                        note={state.meta[abstract.id]?.note || ''}
                        expanded={Boolean(expanded[abstract.id])}
                        showReasonError={showReasonErrors}
                        onToggle={() => setExpanded((prev) => ({ ...prev, [abstract.id]: !prev[abstract.id] }))}
                        onConflict={(cardId) =>
                          update((prev) => ({
                            ...prev,
                            meta: { ...prev.meta, [cardId]: { ...prev.meta[cardId], conflict: !prev.meta[cardId].conflict } }
                          }))
                        }
                        onNote={(cardId, value) =>
                          update((prev) => ({
                            ...prev,
                            meta: { ...prev.meta, [cardId]: { ...prev.meta[cardId], note: value.slice(0, 240) } }
                          }))
                        }
                        onAccept={(cardId, next) =>
                          update((prev) => ({
                            ...prev,
                            posters: {
                              ...prev.posters,
                              [cardId]: { ...prev.posters[cardId], accept: next }
                            }
                          }))
                        }
                        onReason={(cardId, value) =>
                          update((prev) => ({
                            ...prev,
                            posters: {
                              ...prev.posters,
                              [cardId]: { ...prev.posters[cardId], reason: value.slice(0, 200) }
                            }
                          }))
                        }
                      />
                    )
                  })}
                </div>
              )}
            </section>
          </main>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0B1629]/95 backdrop-blur">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
              {showReasonErrors && missingRejectReasons(payload).length > 0 && (
                <p className="text-xs text-white" role="alert">
                  Add a short reason for each rejected poster before sending.
                </p>
              )}
              {mailto.truncated && (
                <p className="text-xs text-white/60">
                  Email is shortened to fit. Use Copy ranking for the full text and JSON.
                </p>
              )}
              {submitStatus === 'sent' && <p className="text-xs text-cyan-200">Ranking sent.</p>}
              {submitStatus === 'error' && (
                <p className="text-xs text-white" role="alert">
                  {submitMessage} Use Copy ranking if it did not arrive.
                </p>
              )}
              {copyStatus === 'copied' && <p className="text-xs text-cyan-200">Copied.</p>}
              {copyStatus === 'failed' && <p className="text-xs text-white">Could not copy. Select the email instead.</p>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <a
                  href={state.reviewerName.trim() ? mailto.href : undefined}
                  className={`inline-flex min-h-11 items-center justify-center rounded-sm bg-cyan-400 px-4 text-center text-sm font-bold text-[#0B1629] ${
                    state.reviewerName.trim() ? 'hover:bg-cyan-300' : 'pointer-events-none opacity-40'
                  }`}
                  onClick={(event) => {
                    if (!state.reviewerName.trim() || !ensureReasons()) event.preventDefault()
                  }}
                >
                  Email my ranking
                </a>
                <button
                  type="button"
                  onClick={onCopy}
                  disabled={!state.reviewerName.trim()}
                  className="min-h-11 rounded-sm border border-white/30 px-4 text-sm font-bold text-white disabled:opacity-40"
                >
                  Copy ranking
                </button>
                {uploadUrl ? (
                  <button
                    type="button"
                    onClick={sendRanking}
                    disabled={!state.reviewerName.trim() || submitStatus === 'sending'}
                    className="min-h-11 rounded-sm border border-white/30 px-4 text-sm font-bold text-white disabled:opacity-40"
                  >
                    {submitStatus === 'sending' ? 'Sending…' : 'Submit ranking'}
                  </button>
                ) : (
                  <p className="flex min-h-11 items-center text-xs text-white/55">
                    Sheet upload is not configured yet. Email or copy your ranking.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
