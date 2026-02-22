import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { WorkItem } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { getDaysUntilNextQuarter, getNextQuarterLabel } from '@/lib/quarter'
import AvatarStack from './AvatarStack'

export const MOUNTAIN_LAYOUTS: number[][] = [[1], [1, 3], [1, 3, 5], [1, 3, 5, 7]] // 1, 4, 9, 16 slots
const MOUNTAIN_SLOT_PREFIX = 'mountain-'
const FUTURE_DROPPABLE = 'future'

interface MountainViewProps {
  mountainOrder: string[]
  onMountainOrderChange: (order: string[]) => void
  allActiveItems: WorkItem[]
  allItems?: WorkItem[]
  profiles: Profile[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onMarkDone?: (itemId: string) => void
  completingId?: string | null
  getProjectChildren?: (parentId: string) => WorkItem[]
  onEmptySlotClick?: (slotIndex: number) => void
  /** When mountain is full and user tries to add from Future, call with (itemId, slotIndex) instead of applying */
  onMountainFullAttempt?: (itemId: string, slotIndex: number) => void
  /** Slot index where the next idea will be added (from pill) – this placeholder is shown as active */
  activeAddSlotIndex?: number | null
  mountainLocked?: boolean
  canLockFlow?: boolean
  onLockFlow?: () => void
  onUnlockFlow?: () => void
  /** When 'new', show setup steps; when 'active', flow is locked */
  flowStatus?: 'new' | 'active'
  layers?: number
  onLayersChange?: (layers: number) => void
  showFuture?: boolean
  onShowFutureChange?: (show: boolean) => void
  showHelp?: boolean
  onShowHelpChange?: (show: boolean) => void
  /** Meeting review status per project id – shown on project cards (on_track / off_track) */
  trackByProject?: Record<string, 'on_track' | 'off_track' | null>
  /** Called when user tries to drag onto the mountain while flow is locked */
  onLockedFlowDropAttempt?: () => void
  /** When true, flash the Future / Show Future row (e.g. after adding an idea while Future is hidden) */
  futureSectionFlash?: boolean
}

const ELEVATION_LABELS: string[] = ['Highest impact', 'High priority', 'Important', 'When you can']

export default function MountainView({
  mountainOrder,
  onMountainOrderChange,
  allActiveItems,
  allItems = allActiveItems,
  profiles,
  selectedId,
  onSelect,
  onMarkDone,
  completingId,
  getProjectChildren,
  onEmptySlotClick,
  onMountainFullAttempt,
  activeAddSlotIndex = null,
  mountainLocked = false,
  canLockFlow: _canLockFlow = false,
  onLockFlow: _onLockFlow,
  onUnlockFlow: _onUnlockFlow,
  flowStatus,
  layers: controlledLayers,
  onLayersChange,
  showFuture = true,
  onShowFutureChange,
  showHelp: controlledShowHelp = true,
  onShowHelpChange,
  trackByProject = {},
  onLockedFlowDropAttempt,
  futureSectionFlash = false,
}: MountainViewProps) {
  const [internalLayers, setInternalLayers] = useState(3)
  const [internalShowHelp, setInternalShowHelp] = useState(true)
  const layers = controlledLayers ?? internalLayers
  const setLayers = (v: number) => {
    const clamped = Math.min(4, Math.max(1, v))
    onLayersChange?.(clamped)
    if (controlledLayers === undefined) setInternalLayers(clamped)
  }
  const showHelp = controlledShowHelp ?? internalShowHelp
  const setShowHelp = (v: boolean) => {
    onShowHelpChange?.(v)
    if (controlledShowHelp === undefined) setInternalShowHelp(v)
  }
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const itemMap = new Map(allItems.map((i) => [i.id, i]))
  const futureIds = new Set(allActiveItems.map((i) => i.id).filter((id) => !mountainOrder.includes(id)))
  const futureItems = allActiveItems.filter((i) => futureIds.has(i.id))
  const layout = MOUNTAIN_LAYOUTS[layers - 1] ?? MOUNTAIN_LAYOUTS[2]
  const maxSlots = layout.reduce((a, n) => a + n, 0)

  const daysLeft = getDaysUntilNextQuarter()
  const quarterLabel = getNextQuarterLabel()
  const mountainItems = mountainOrder.map((id) => itemMap.get(id)).filter(Boolean) as WorkItem[]
  const subTaskProgress = getProjectChildren
    ? mountainItems
        .filter((i) => i.type === 'project')
        .map((p) => {
          const children = getProjectChildren(p.id)
          const done = children.filter((c) => c.status === 'done').length
          return { total: children.length, done }
        })
    : []
  const totalSubDone = subTaskProgress.reduce((a, x) => a + x.done, 0)
  const totalSubTasks = subTaskProgress.reduce((a, x) => a + x.total, 0)

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event
    if (mountainLocked) {
      if (over) onLockedFlowDropAttempt?.()
      return
    }
    const { active } = event
    if (!over) return
    const overId = String(over.id)
    const activeId = active.id as string

    if (overId === FUTURE_DROPPABLE) {
      const next = mountainOrder.filter((id) => id !== activeId)
      onMountainOrderChange(next)
      return
    }
    if (overId.startsWith(MOUNTAIN_SLOT_PREFIX)) {
      const toIndex = parseInt(overId.replace(MOUNTAIN_SLOT_PREFIX, ''), 10)
      const fromIndex = mountainOrder.indexOf(activeId)
      if (fromIndex === -1) {
        if (mountainOrder.length >= maxSlots && onMountainFullAttempt) {
          onMountainFullAttempt(activeId, toIndex)
          return
        }
        const next = [...mountainOrder]
        next.splice(Math.min(toIndex, next.length), 0, activeId)
        onMountainOrderChange(next.slice(0, maxSlots))
      } else {
        const next = mountainOrder.filter((id) => id !== activeId)
        next.splice(Math.min(toIndex, next.length), 0, activeId)
        onMountainOrderChange(next.slice(0, maxSlots))
      }
    }
  }

  const getRowStartIndex = (r: number) => layout.slice(0, r).reduce((a, n) => a + n, 0)
  const isRowEmpty = (r: number) => {
    const start = getRowStartIndex(r)
    const count = layout[r] ?? 0
    return Array.from({ length: count }, (_, i) => start + i).every((i) => !mountainOrder[i])
  }
  let slotIndex = 0
  return (
    <div ref={scrollRef} className="flex-1 min-w-0 overflow-auto p-6 pb-24">
      <div className="max-w-3xl mx-auto">
        {false && flowStatus === 'new' && (
          <div className="mb-6 p-4 rounded-2xl bg-teal-light/10 border border-teal-light/25 space-y-4">
            <h2 className="text-sm font-semibold text-teal-dark">Set up your 90-day flow</h2>
            <p className="text-xs text-[var(--text-muted)]">You can edit your project list until you lock.</p>
            <ol className="space-y-2 text-sm text-[var(--text)] list-decimal list-inside">
              <li><strong>Add projects</strong> — Start with your most impactful at the top. Drag from Future or create new.</li>
              <li><strong>Prioritize</strong> — Drag projects to the right elevation (top = highest impact).</li>
              <li><strong>Add or remove elevations</strong> — Start small; add rows only if you can commit to them.</li>
              <li><strong>Lock your flow</strong> — Lock when ready to create your 90-day commitment.</li>
            </ol>
            <p className="text-xs text-[var(--text-muted)] pt-1">Congratulations — once you lock, you’re on your way to crushing the next 90 days.</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h1 className="text-lg font-semibold text-[var(--text)]">90-day focus</h1>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]" title={`${daysLeft} days until ${quarterLabel}`}>
            <svg className="w-5 h-5 text-teal-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{daysLeft} days until next quarter</span>
          </div>
          {totalSubTasks > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span>Sub-tasks: {totalSubDone}/{totalSubTasks} done</span>
            </div>
          )}
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 max-w-5xl mx-auto items-start">
            <div className="flex-1 min-w-0 space-y-4">
            {layout.map((cols, row) => {
              return (
              <div key={row} className="space-y-1">
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider ring-on-bg px-2 py-0.5 rounded" title="Higher = more important">
                    {ELEVATION_LABELS[row] ?? `Elevation ${row + 1}`}
                  </span>
                </div>
                <div className="flex justify-center gap-2" style={{ gap: '0.5rem' }}>
                {Array.from({ length: cols }).map((_, _col) => {
                  const idx = slotIndex++
                  const slotId = MOUNTAIN_SLOT_PREFIX + idx
                  const itemId = mountainOrder[idx]
                  const item = itemId ? itemMap.get(itemId) : null
                  return (
                    <MountainSlot
                      key={slotId}
                      id={slotId}
                      slotIndex={idx}
                      item={item ?? null}
                      profiles={profiles}
                      isSelected={selectedId === itemId}
                      onSelect={() => onSelect(itemId ? (selectedId === itemId ? null : itemId) : null)}
                      onMarkDone={onMarkDone}
                      completingId={completingId}
                      getProjectChildren={getProjectChildren}
                      onEmptySlotClick={onEmptySlotClick}
                      isActiveAddTarget={activeAddSlotIndex === idx}
                      trackByProject={trackByProject}
                    />
                  )
                })}
                </div>
              </div>
            )
            })}
            {flowStatus === 'new' && (onLayersChange !== undefined || controlledLayers === undefined) && (() => {
              const lastRowIndex = layout.length - 1
              const hasEmptyLastRow = lastRowIndex >= 0 && isRowEmpty(lastRowIndex)
              const canAdd = layers < 4
              if (hasEmptyLastRow) {
                return (
                  <div className="pt-0.5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setLayers(layers - 1)}
                      className="text-xs font-medium text-teal-dark hover:text-teal-dark/80 hover:underline text-on-bg ring-on-bg px-2 py-0.5 rounded"
                      title="Remove this empty elevation"
                    >
                      Remove elevation
                    </button>
                  </div>
                )
              }
              if (canAdd) {
                return (
                  <div className="pt-0.5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setLayers(layers + 1)}
                      className="text-xs font-medium text-teal-dark hover:text-teal-dark/80 hover:underline flex items-center gap-1 text-on-bg ring-on-bg px-2 py-0.5 rounded"
                      title="Add another elevation to your mountain"
                    >
                      <span className="text-base leading-none">+</span>
                      <span>Add elevation</span>
                    </button>
                  </div>
                )
              }
              return null
            })()}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            {onShowFutureChange ? (
              <>
                <div className={`flex items-center justify-between gap-2 mb-2 rounded-lg px-2 py-1 transition-colors ${futureSectionFlash ? 'future-section-flash' : ''}`}>
                  <h2 className="text-sm font-medium text-[var(--text-muted)] text-on-bg ring-on-bg px-2 py-0.5 rounded">Future</h2>
                  <button
                    type="button"
                    onClick={() => onShowFutureChange(!showFuture)}
                    className={`text-xs font-medium transition-colors text-on-bg ring-on-bg px-2 py-0.5 rounded ${futureSectionFlash ? 'future-section-flash text-teal-dark' : 'text-[var(--text-muted)] hover:text-teal-dark'}`}
                    title={showFuture ? 'Hide Future ideas' : 'Show Future ideas'}
                  >
                    {showFuture ? 'Hide Future' : 'Show Future'}
                  </button>
                </div>
                {showFuture && (
                  <FutureDropZone futureItems={futureItems} profiles={profiles} selectedId={selectedId} onSelect={onSelect} onMarkDone={onMarkDone} />
                )}
              </>
            ) : (
              <>
                <h2 className="text-sm font-medium text-[var(--text-muted)] mb-2 text-on-bg ring-on-bg px-2 py-0.5 rounded inline-block">Future</h2>
                <FutureDropZone futureItems={futureItems} profiles={profiles} selectedId={selectedId} onSelect={onSelect} onMarkDone={onMarkDone} />
              </>
            )}
          </div>
        </DndContext>
      </div>
    </div>
  )
}

function MountainSlot({
  id,
  slotIndex,
  item,
  profiles,
  isSelected,
  onSelect,
  onMarkDone,
  completingId,
  getProjectChildren,
  onEmptySlotClick,
  isActiveAddTarget = false,
  trackByProject = {},
}: {
  id: string
  slotIndex: number
  item: WorkItem | null
  profiles: Profile[]
  isSelected: boolean
  onSelect: () => void
  onMarkDone?: (itemId: string) => void
  completingId?: string | null
  getProjectChildren?: (parentId: string) => WorkItem[]
  onEmptySlotClick?: (slotIndex: number) => void
  isActiveAddTarget?: boolean
  trackByProject?: Record<string, 'on_track' | 'off_track' | null>
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const hasItem = Boolean(item)
  const subProgress = item && getProjectChildren && item.type === 'project'
    ? (() => { const c = getProjectChildren(item.id); const d = c.filter((x) => x.status === 'done').length; return c.length ? `${d}/${c.length}` : null })()
    : null

  const emptySlotStyle = isActiveAddTarget
    ? 'border-teal-dark ring-2 ring-teal-dark/30 bg-teal-light/15 dark:bg-teal-light/10 border-2 shadow-sm empty-slot-active'
    : 'border-dashed border-2 border-teal-dark/30 bg-white/40 dark:bg-white/5'

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl min-h-[72px] min-w-[140px] flex flex-col justify-center transition-all duration-200 ${
        isOver ? 'border-teal-dark/40 bg-teal-light/10 border-2' : hasItem ? (item!.status === 'done' ? 'border-[var(--border)] bg-gray-200/90 dark:bg-white/10 border-2' : 'border-[var(--border)] bg-white/95 dark:bg-[var(--bg-panel)] border-2') : emptySlotStyle
      } ${isSelected && hasItem ? 'ring-2 ring-teal-dark shadow-md' : ''} ${hasItem ? 'hover:bg-teal-light/10 hover:ring-2 hover:ring-teal-dark/25 hover:shadow-sm' : ''} ${item ? 'cursor-pointer' : 'cursor-pointer'}`}
      onClick={item ? onSelect : () => onEmptySlotClick?.(slotIndex)}
    >
      {item ? (
        <DraggableCard
          item={item}
          profiles={profiles}
          getProjectChildren={getProjectChildren}
          isSelected={isSelected}
          onSelect={onSelect}
          onMarkDone={onMarkDone}
          isCompleting={completingId === item.id}
          subProgress={subProgress}
          trackStatus={item.type === 'project' ? trackByProject[item.id] ?? null : null}
        />
      ) : (
        <span className={`text-xs text-center p-2 block text-on-bg ${isActiveAddTarget ? 'text-teal-dark font-medium' : 'text-[var(--text-muted)]'}`}>
          {isActiveAddTarget ? 'Next idea goes here · type in pill below' : 'Drop here or click to add'}
        </span>
      )}
    </div>
  )
}

function DraggableCard({
  item,
  profiles,
  getProjectChildren,
  isSelected,
  onSelect: _onSelect,
  onMarkDone,
  isCompleting,
  subProgress,
  trackStatus = null,
}: {
  item: WorkItem
  profiles: Profile[]
  getProjectChildren?: (parentId: string) => WorkItem[]
  isSelected: boolean
  onSelect: () => void
  onMarkDone?: (itemId: string) => void
  isCompleting?: boolean
  subProgress?: string | null
  /** From weekly meeting review – overrides due-date-based off-track when set */
  trackStatus?: 'on_track' | 'off_track' | null
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.id })
  const ids = new Set<string>()
  if (item.owner_id) ids.add(item.owner_id)
  if (item.type === 'project' && getProjectChildren) getProjectChildren(item.id).forEach((s) => { if (s.owner_id) ids.add(s.owner_id) })
  const assigneeProfiles = profiles.filter((p) => ids.has(p.id))
  const ordered = item.owner_id ? [...assigneeProfiles].sort((a, b) => (a.id === item.owner_id ? -1 : b.id === item.owner_id ? 1 : 0)) : assigneeProfiles
  const isDone = item.status === 'done'
  const isProject = item.type === 'project'
  const isOffTrack = trackStatus === 'off_track' || (trackStatus === null && Boolean(item.due_date && new Date(item.due_date) < new Date() && !isDone))

  return (
    <div
      ref={setNodeRef}
      className={`p-2.5 ${isCompleting ? 'animate-dissolve pointer-events-none' : ''} ${isDone ? 'opacity-60' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        {ordered.length > 0 ? (
          <span onClick={(e) => e.stopPropagation()} className="flex-shrink-0 mt-0.5">
            <AvatarStack profiles={ordered} ownerId={item.owner_id} maxVisible={2} onMarkDone={() => onMarkDone?.(item.id)} isDone={isDone} />
          </span>
        ) : (
          <button
            type="button"
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 border-[var(--border)] hover:border-teal-light/40"
            onClick={(e) => { e.stopPropagation(); onMarkDone?.(item.id) }}
            aria-label="Mark done"
          >
            {item.status === 'done' && <span className="text-teal-dark text-xs">✓</span>}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <span className={`block truncate ${isProject ? 'font-bold text-sm' : 'text-sm'} ${isDone ? 'text-[var(--text-muted)] line-through' : isSelected ? 'font-medium text-teal-dark' : 'text-[var(--text)]'}`}>
            {item.title}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isDone && item.updated_at && (
              <span className="text-[10px] text-[var(--text-muted)]" title={new Date(item.updated_at).toLocaleString()}>
                Done {new Date(item.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {subProgress && <span className="text-[10px] text-teal-dark">({subProgress})</span>}
            {isProject && !isDone && (
              <span className={`text-[10px] font-medium ${isOffTrack ? 'text-red-600 dark:text-red-400' : 'text-teal-dark'}`}>
                {isOffTrack ? 'Off track' : 'On track'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FutureCard({
  item,
  profiles,
  isSelected,
  onSelect: _onSelectFuture,
  onMarkDone: _onMarkDoneFuture,
}: {
  item: WorkItem
  profiles: Profile[]
  isSelected: boolean
  onSelect: (id: string | null) => void
  onMarkDone?: (itemId: string) => void
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.id })
  const owner = item.owner_id ? profiles.find((p) => p.id === item.owner_id) : null
  return (
    <div
      ref={setNodeRef}
      className="rounded-lg border border-[var(--border)] bg-gray-100/90 dark:bg-white/10 px-2.5 py-2 min-w-[120px] cursor-pointer transition-all duration-200 hover:bg-teal-light/15 hover:ring-2 hover:ring-teal-dark/25 hover:shadow-sm"
      onClick={() => _onSelectFuture(isSelected ? null : item.id)}
      {...attributes}
      {...listeners}
    >
      <span className={`text-sm block truncate ${isSelected ? 'font-medium text-teal-dark' : ''}`}>{item.title}</span>
      {owner && <span className="text-[10px] text-[var(--text-muted)]">{owner.name || owner.email}</span>}
    </div>
  )
}

function FutureDropZone({
  futureItems,
  profiles,
  selectedId,
  onSelect,
  onMarkDone,
}: {
  futureItems: WorkItem[]
  profiles: Profile[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onMarkDone?: (itemId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: FUTURE_DROPPABLE })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 min-h-[80px] p-3 transition-colors ${
        futureItems.length === 0 ? 'border-dashed border-teal-dark/25 bg-white/40 dark:bg-white/5' : 'border-[var(--border)] bg-transparent'
      } ${isOver ? '!border-teal-dark/40 !bg-teal-light/10' : ''}`}
    >
      {futureItems.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-2">Items that don’t fit the mountain wait here.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {futureItems.map((item) => (
            <FutureCard key={item.id} item={item} profiles={profiles} isSelected={selectedId === item.id} onSelect={onSelect} onMarkDone={onMarkDone} />
          ))}
        </div>
      )}
    </div>
  )
}
