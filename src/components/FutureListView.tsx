import { useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { WorkItem } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import ItemCard from './ItemCard'

function getAssigneeProfiles(item: WorkItem, profiles: Profile[], getProjectChildren?: (parentId: string) => WorkItem[]): { profiles: Profile[]; ownerId: string | null } {
  const ownerId = item.owner_id
  const ids = new Set<string>()
  if (ownerId) ids.add(ownerId)
  if (item.type === 'project' && getProjectChildren) {
    getProjectChildren(item.id).forEach((s) => { if (s.owner_id) ids.add(s.owner_id) })
  }
  const list = profiles.filter((p) => ids.has(p.id))
  const ordered = ownerId ? [...list].sort((a, b) => (a.id === ownerId ? -1 : b.id === ownerId ? 1 : 0)) : list
  return { profiles: ordered, ownerId: ownerId || null }
}

interface FutureListViewProps {
  items: WorkItem[]
  order: string[]
  onReorder: (orderedIds: string[]) => void
  profiles: Profile[]
  selectedId: string | null
  highlightedId: string | null
  onSelect: (id: string | null) => void
  onMarkDone?: (itemId: string) => void
  completingId?: string | null
  getProjectChildren?: (parentId: string) => WorkItem[]
  /** When set, the card with this id shows the "just deposited" gradient outline animation */
  justDepositedId?: string | null
}

export default function FutureListView({
  items,
  order,
  onReorder,
  profiles,
  selectedId,
  highlightedId,
  onSelect,
  onMarkDone,
  completingId,
  getProjectChildren,
  justDepositedId,
}: FutureListViewProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const highlightedRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if ((highlightedId || justDepositedId) && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedId, justDepositedId])
  const orderedItems = order.length > 0
    ? order.map((id) => items.find((i) => i.id === id)).filter(Boolean) as WorkItem[]
    : items
  const orderedIds = orderedItems.map((i) => i.id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedIds.indexOf(active.id as string)
    const newIndex = orderedIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const next = arrayMove(orderedIds, oldIndex, newIndex)
    onReorder(next)
  }

  return (
    <div className="flex-1 min-w-0 overflow-auto p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-lg font-semibold text-[var(--text)]">Future ideas</h1>
          <span className="text-sm text-[var(--text-muted)]">({items.length})</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Items not on your 90-day mountain. Drag to prioritize. Click to edit. Add to the mountain from the 90-day view.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {orderedItems.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-muted)] rounded-xl border-2 border-dashed border-teal-dark/20">
                  No future items. Add ideas with the + button; they’ll appear here until you place them on the mountain.
                </div>
              ) : (
                orderedItems.map((item) => {
                  const { profiles: assigneeProfiles, ownerId } = getAssigneeProfiles(item, profiles, getProjectChildren)
                  const isHighlighted = item.id === highlightedId || item.id === justDepositedId
                  return (
                    <div key={item.id} ref={isHighlighted ? highlightedRef : null}>
                    <ItemCard
                      key={item.id}
                      item={item}
                      profiles={profiles}
                      isSelected={selectedId === item.id}
                      isHighlighted={highlightedId === item.id}
                      onSelect={() => onSelect(selectedId === item.id ? null : item.id)}
                      onMarkDone={onMarkDone}
                      isCompleting={completingId === item.id}
                      assigneeProfiles={assigneeProfiles}
                      ownerId={ownerId}
                      isJustDeposited={item.id === justDepositedId}
                    />
                    </div>
                  )
                })
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
