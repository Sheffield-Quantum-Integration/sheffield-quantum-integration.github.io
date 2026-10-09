import { useEffect, useMemo, useRef, useState } from 'react'
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
import { scriptUrl, themeFor, TALK_TARGET } from './config.js'
import { buildRankingPayload, missingRejectReasons } from './formatRanking.js'
import { postRanking } from './submitRanking.js'
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
  return `${data.abstracts.length} abstracts: ${tally.TALK} talks, ${tally.EITHER} either, ${tally.POSTER} posters`
}

const SUBMIT_ERROR =
  'Could not send your ranking. Please try again, or contact Joe at joe.a.smith@sheffield.ac.uk.'

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
      aria-label={`Your top ${target} above this line`}
      data-testid={`talk-cut-${session}`}
    >
      <div className="h-px flex-1 bg-white/80" />
      <span className="text-[11px] font-semibold text-white">Your top {target} above this line</span>
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
        <p className="mt-1 text-sm text-white/55">None listed.</p>
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
  position,
  aboveCut,
  note,
  expanded,
  proposal,
  decision,
  comment,
  onToggle,
  onSessionChange,
  onNote,
  onDecide,
  onComment
}) {
  const press = useRef(null)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: abstract.id
  })
  const theme = themeFor(currentSession)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined
  }
  const toggleIfClick = () => {
    if (press.current?.moved) {
      press.current = null
      return
    }
    onToggle()
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
      }`}
    >
      <div
        ref={setActivatorNodeRef}
        className="flex cursor-grab items-start gap-2 p-2.5 active:cursor-grabbing sm:p-3"
        {...attributes}
        {...listeners}
        aria-expanded={expanded}
        onPointerDown={(event) => {
          press.current = { x: event.clientX, y: event.clientY, moved: false }
        }}
        onPointerMove={(event) => {
          if (!press.current) return
          const dx = Math.abs(event.clientX - press.current.x)
          const dy = Math.abs(event.clientY - press.current.y)
          if (Math.hypot(dx, dy) > 6) press.current.moved = true
        }}
        onClick={toggleIfClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onToggle()
            return
          }
          listeners.onKeyDown?.(event)
        }}
      >
        <span
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/10 text-white/50 touch-none"
          aria-hidden="true"
          data-testid={`handle-${abstract.id}`}
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="w-7 shrink-0 pt-2 text-center text-sm font-bold tabular-nums text-white">{position}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-white/45">{abstract.id}</span>
            <Badge badge={abstract.badge} />
          </div>
          <p className={`mt-1 text-left text-sm font-semibold text-white ${expanded ? '' : 'line-clamp-2'}`}>
            {abstract.title}
          </p>
          <p className="mt-0.5 text-xs text-white/50">
            {abstract.presenter}
            <span className="text-white/30"> · </span>
            {abstract.institution}
          </p>
        </div>
      </div>

      <div
        className="flex flex-col gap-2 px-2.5 pb-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:px-3"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
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
        <input
          type="text"
          value={note}
          maxLength={240}
          placeholder="Optional note"
          aria-label={`Optional note for ${abstract.id}`}
          onChange={(event) => onNote(abstract.id, event.target.value)}
          className="min-h-11 w-full flex-1 rounded-sm border border-white/20 bg-[#0B1629] px-2 text-sm text-white placeholder:text-white/30 sm:min-w-[12rem]"
        />
      </div>

      {proposal && (
        <div
          className="mx-2.5 mb-2.5 border-t border-white/10 px-0.5 pt-2 sm:mx-3"
          onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        >
          <p className="inline-flex rounded-sm border border-white/25 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80">
            {proposal.tag}
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
            Comment (optional)
          </label>
          <input
            id={`comment-${abstract.id}`}
            type="text"
            value={comment}
            maxLength={200}
            placeholder="Optional comment"
            onChange={(event) => onComment(abstract.id, event.target.value)}
            className="mt-1 min-h-11 w-full rounded-sm border border-white/20 bg-[#0B1629] px-2 text-sm text-white placeholder:text-white/30"
          />
        </div>
      )}

      {expanded && <ExpandedBody abstract={abstract} />}
    </article>
  )
}

function PosterCard({ abstract, accept, reason, note, expanded, showReasonError, onToggle, onNote, onAccept, onReason }) {
  const reasonMissing = accept === false && !reason.trim()
  return (
    <article
      id={`card-${abstract.id}`}
      data-testid={`card-${abstract.id}`}
      className="scroll-mb-56 border border-white/10 bg-white/[0.03] sm:scroll-mb-40"
    >
      <div className="p-2.5 sm:p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-white/45">{abstract.id}</span>
          <Badge badge="POSTER" />
          <ThemeDot session={abstract.session} />
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
        <input
          type="text"
          value={note}
          maxLength={240}
          placeholder="Optional note"
          aria-label={`Optional note for ${abstract.id}`}
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
            placeholder="Please say why you are rejecting this poster"
            aria-invalid={showReasonError && reasonMissing}
            onChange={(event) => onReason(abstract.id, event.target.value)}
            className={`mt-1 min-h-11 w-full rounded-sm border bg-[#0B1629] px-2 text-sm text-white placeholder:text-white/30 ${
              showReasonError && reasonMissing ? 'border-white' : 'border-white/20'
            }`}
          />
          {showReasonError && reasonMissing && (
            <p className="mt-1 text-xs text-white/70">Please add a short reason.</p>
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
          <p className="px-1 py-3 text-xs text-white/40">No talks in this session yet. Drag one here if it fits better.</p>
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
  const [saveError, setSaveError] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [showReasonErrors, setShowReasonErrors] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    setSaveError(!saveState(state))
  }, [state])

  const byId = useMemo(() => Object.fromEntries(reviewData.abstracts.map((abs) => [abs.id, abs])), [])
  const posters = useMemo(() => reviewData.abstracts.filter((abs) => abs.badge === 'POSTER'), [])
  const payload = useMemo(() => buildRankingPayload(reviewData, state), [state])
  const uploadUrl = scriptUrl()
  const headerCounts = countsLabel(reviewData)
  const postersOpen = state.postersOpen !== false

  const update = (recipe) => {
    setSubmitStatus('')
    setSubmitMessage('')
    setState(recipe)
  }

  const revealSession = (session) => {
    setState((prev) => {
      if (prev.openPanels?.[session]) return prev
      return { ...prev, openPanels: { ...prev.openPanels, [session]: true } }
    })
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
    if (!uploadUrl) return
    if (!ensureReasons()) return
    setSubmitStatus('sending')
    setSubmitMessage('')
    try {
      const received = await postRanking(uploadUrl, payload)
      if (!received) throw new Error(SUBMIT_ERROR)
      setSubmitStatus('sent')
    } catch {
      setSubmitStatus('error')
      setSubmitMessage(SUBMIT_ERROR)
    }
  }

  const activeAbstract = activeId ? byId[activeId] : null
  const activeSession = activeId ? sessionOf(state.ranked, activeId) : null

  return (
    <div className="min-h-screen bg-[#0B1629] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B1629]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Quantum Dot Day 2026 Committee Ranking</h1>
            </div>
          </div>
          <p className="text-sm font-semibold text-white" data-testid="header-counts">
            {headerCounts}
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3">
        <section className="border border-white/10 bg-white/[0.03] px-4 py-3" aria-label="How to rank">
          <h2 className="text-sm font-bold text-white">How to rank</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-snug text-white/75">
            <li>Choose 3 contributed talks for each session from the Talk and Either requests.</li>
            <li>
              Drag a talk to reorder it. Top three per session are picks. Click a title to read the abstract. Use the
              session menu if a talk fits better elsewhere, and add a note if you want.
            </li>
            <li>
              Maxim Makhonin&apos;s talk starts in Colour centres, with Confirm this session already selected. Choose Keep
              in original session if it should stay in Optics.
            </li>
            <li>Posters are accepted unless you click Reject. Add a short reason only if you reject one.</li>
            <li>Your progress is saved automatically in this browser. Initials are optional. Press Submit once when you are finished.</li>
          </ul>
          {saveError && (
            <p className="mt-2 text-xs text-white" role="alert">
              Your ranking could not be saved in this browser.
            </p>
          )}
        </section>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
          <span className="font-semibold uppercase tracking-[0.14em]">Request</span>
          <Badge badge="TALK" />
          <Badge badge="EITHER" />
          <Badge badge="POSTER" />
          <span className="ml-1 font-semibold uppercase tracking-[0.14em]">Theme</span>
          {reviewData.sessions.map((session) => (
            <ThemeDot key={session} session={session} />
          ))}
        </div>
      </div>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 pb-56 sm:pb-40">
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
                const target = TALK_TARGET
                const open = state.openPanels?.[session] !== false
                let cutPlaced = false
                const cards = []
                const placeCut = () => {
                  if (cutPlaced) return
                  cards.push(<CutLine key={`${session}-cut`} target={target} session={session} />)
                  cutPlaced = true
                }
                ids.forEach((id, index) => {
                  if (index === target) placeCut()
                  const position = index + 1
                  const abstract = byId[id]
                  const proposal = proposedMoveFor(id)
                  cards.push(
                    <RankCard
                      key={id}
                      abstract={abstract}
                      currentSession={session}
                      position={position}
                      aboveCut={position <= target}
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
                })
                placeCut()

                return (
                  <section key={session} className="border border-white/10" data-testid={`session-${theme.label}`}>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 border-l-4 px-3 py-3 text-left ${theme.border} ${theme.headerBg}`}
                      aria-expanded={open}
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          openPanels: {
                            ...prev.openPanels,
                            [session]: prev.openPanels?.[session] === false
                          }
                        }))
                      }
                    >
                      <span>
                        <span className="block text-sm font-bold text-white">{session}</span>
                        <span className="mt-0.5 block text-[11px] text-white/55">
                          {ids.length} to rank · {target} to choose · Drag and drop talks and click to expand abstract
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
                onClick={() => setState((prev) => ({ ...prev, postersOpen: prev.postersOpen === false }))}
              >
                <span>
                  <span className="block text-sm font-bold text-white">Poster session</span>
                  <span className="mt-0.5 block text-[11px] text-white/55">
                    {posters.length} posters · accepted unless you reject one · colour shows the submitted theme
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
                        note={state.meta[abstract.id]?.note || ''}
                        expanded={Boolean(expanded[abstract.id])}
                        showReasonError={showReasonErrors}
                        onToggle={() => setExpanded((prev) => ({ ...prev, [abstract.id]: !prev[abstract.id] }))}
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
                  Please add a short reason for each poster you reject, then press Submit again.
                </p>
              )}
              {submitStatus === 'sent' && (
                <p className="text-sm font-semibold text-cyan-200">Thanks — your ranking has been received.</p>
              )}
              {submitStatus === 'error' && (
                <p className="text-sm text-white" role="alert">
                  {submitMessage}
                </p>
              )}
              <div>
                <label htmlFor="reviewer-initials" className="text-xs text-white/70">
                  Reviewer initials (optional)
                </label>
                <input
                  id="reviewer-initials"
                  type="text"
                  value={state.reviewerInitials}
                  maxLength={40}
                  autoComplete="off"
                  onChange={(event) =>
                    update((prev) => ({ ...prev, reviewerInitials: event.target.value.slice(0, 40) }))
                  }
                  className="mt-1 min-h-11 w-full rounded-sm border border-white/20 bg-[#0B1629] px-2 text-sm text-white sm:max-w-xs"
                />
              </div>
              {submitStatus === 'sending' && (
                <p className="text-sm font-semibold text-white" role="status">
                  Sending data to sheet… please wait…
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                {uploadUrl ? (
                  <button
                    type="button"
                    onClick={sendRanking}
                    disabled={submitStatus === 'sending'}
                    className="min-h-11 rounded-sm bg-cyan-400 px-4 text-sm font-bold text-[#0B1629] hover:bg-cyan-300 disabled:opacity-40"
                  >
                    {submitStatus === 'sending' ? 'Sending…' : 'Submit'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
    </div>
  )
}
