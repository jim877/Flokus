import { useState } from 'react'
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

const MOUNTAIN_LAYOUTS: number[][] = [[1], [1, 3], [1, 3, 5], [1, 3, 5, 7]] // 1, 4, 9, 16 slots
const MOUNTAIN_SLOT_PREFIX = 'mountain-'
const FUTURE_DROPPABLE = 'future'
const RECOMMENDED_LAYERS_INDIVIDUAL = 3

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
  layers?: number
  onLayersChange?: (layers: number) => void
  showFuture?: boolean
  onShowFutureChange?: (show: boolean) => void
  showHelp?: boolean
  onShowHelpChange?: (show: boolean) => void
}

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
  layers: controlledLayers,
  onLayersChange,
  showFuture = true,
  onShowFutureChange,
  showHelp: controlledShowHelp = true,
  onShowHelpChange,
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
    const { active, over } = event
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

  let slotIndex = 0
  return (
    <div className="flex-1 min-w-0 overflow-auto p-6 pb-24">
      <div className="max-w-3xl mx-auto">
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
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {onLayersChange !== undefined || controlledLayers === undefined ? (
              <span className="flex items-center gap-1">
                <button type="button" onClick={() => setLayers(layers - 1)} disabled={layers <= 1} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50" title="Remove row">− Row</button>
                <span className="text-xs text-[var(--text-muted)]">{layers}</span>
                <button type="button" onClick={() => setLayers(layers + 1)} disabled={layers >= 4} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50" title="Add row">+ Row</button>
                {layers > RECOMMENDED_LAYERS_INDIVIDUAL && <span className="text-[10px] text-[var(--text-muted)]" title="For individual accounts we recommend 3 levels">(recommend 3)</span>}
              </span>
            ) : null}
            {onShowFutureChange && (
              <button type="button" onClick={() => onShowFutureChange(!showFuture)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">{showFuture ? 'Hide Future' : 'Show Future'}</button>
            )}
            {(onShowHelpChange !== undefined || controlledShowHelp === undefined) && (
              <button type="button" onClick={() => setShowHelp(!showHelp)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">{showHelp ? 'Hide help' : 'Show help'}</button>
            )}
          </div>
        </div>
        {showHelp && (
          <div className="mb-4 p-3 rounded-xl bg-teal-light/10 border border-teal-light/20 text-sm text-[var(--text)]">
            Your mountain keeps you on track. Top = highest priority. Drag to reorder. Only {maxSlots} items fit; the rest wait in Future.
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {layout.map((cols, row) => (
              <div key={row} className="flex justify-center gap-2" style={{ gap: '0.5rem' }}>
                {Array.from({ length: cols }).map((_, col) => {
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
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {showFuture && (
            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <h2 className="text-sm font-medium text-[var(--text-muted)] mb-2">Future</h2>
              <FutureDropZone futureItems={futureItems} profiles={profiles} selectedId={selectedId} onSelect={onSelect} onMarkDone={onMarkDone} />
            </div>
          )}
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
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const hasItem = Boolean(item)
  const subProgress = item && getProjectChildren && item.type === 'project'
    ? (() => { const c = getProjectChildren(item.id); const d = c.filter((x) => x.status === 'done').length; return c.length ? `${d}/${c.length}` : null })()
    : null

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 min-h-[72px] min-w-[140px] flex flex-col justify-center transition-colors ${
        isOver ? 'border-teal-dark/40 bg-teal-light/10' : hasItem ? (item!.status === 'done' ? 'border-[var(--border)] bg-gray-200/90 dark:bg-white/10' : 'border-[var(--border)] bg-white/95 dark:bg-[var(--bg-panel)]') : 'border-dashed border-[var(--border)]/70 bg-white/50 dark:bg-white/10'
      } ${item ? 'cursor-pointer' : 'cursor-pointer'}`}
      onClick={item ? onSelect : () => onEmptySlotClick?.(slotIndex)}
    >
      {item ? (
        <DraggableCard
          item={item}
          profiles={profiles}
          isSelected={isSelected}
          onSelect={onSelect}
          onMarkDone={onMarkDone}
          isCompleting={completingId === item.id}
          subProgress={subProgress}
        />
      ) : (
        <span className="text-xs text-[var(--text-muted)] text-center p-2">Drop here or click to add</span>
      )}
    </div>
  )
}

function DraggableCard({
  item,
  profiles,
  isSelected,
  onSelect,
  onMarkDone,
  isCompleting,
  subProgress,
}: {
  item: WorkItem
  profiles: Profile[]
  isSelected: boolean
  onSelect: () => void
  onMarkDone?: (itemId: string) => void
  isCompleting?: boolean
  subProgress?: string | null
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.id })
  const owner = item.owner_id ? profiles.find((p) => p.id === item.owner_id) : null
  const isDone = item.status === 'done'
  const isProject = item.type === 'project'
  const isOffTrack = Boolean(
    item.due_date && new Date(item.due_date) < new Date() && !isDone
  )

  return (
    <div
      ref={setNodeRef}
      className={`p-2.5 ${isCompleting ? 'animate-dissolve pointer-events-none' : ''} ${isDone ? 'opacity-60' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 border-[var(--border)] hover:border-teal-light/40"
          onClick={(e) => { e.stopPropagation(); onMarkDone?.(item.id) }}
          aria-label="Mark done"
        >
          {item.status === 'done' && <span className="text-teal-dark text-xs">✓</span>}
        </button>
        <div className="min-w-0 flex-1">
          <span className={`block truncate ${isProject ? 'font-bold text-sm' : 'text-sm'} ${isDone ? 'text-[var(--text-muted)] line-through' : isSelected ? 'font-medium text-teal-dark' : 'text-[var(--text)]'}`}>
            {item.title}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {owner && <span className="text-[10px] text-[var(--text-muted)]">{owner.short_name || owner.name || owner.email}</span>}
            {subProgress && <span className="text-[10px] text-teal-dark">({subProgress})</span>}
            {isProject && !isDone && (
              <span className={`text-[10px] ${isOffTrack ? 'text-red-600 dark:text-red-400' : 'text-teal-dark'}`}>
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
  onSelect,
  onMarkDone,
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
      className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)]/90 px-2.5 py-2 min-w-[120px] cursor-pointer"
      onClick={() => onSelect(isSelected ? null : item.id)}
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
      className={`rounded-xl border-2 border-dashed min-h-[80px] p-3 transition-colors ${
        isOver ? 'border-teal-dark/40 bg-teal-light/10' : 'border-[var(--border)]'
      } ${futureItems.length > 0 ? 'bg-white/90 dark:bg-white/15' : 'bg-white/40 dark:bg-white/5'}`}
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
