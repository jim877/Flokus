import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
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

interface FlowListViewProps {
  mountainItems: WorkItem[]
  futureItems: WorkItem[]
  futureOrder: string[]
  profiles: Profile[]
  selectedId: string | null
  highlightedId: string | null
  onSelect: (id: string | null) => void
  onMarkDone?: (itemId: string) => void
  completingId?: string | null
  getProjectChildren?: (parentId: string) => WorkItem[]
}

export default function FlowListView({
  mountainItems,
  futureItems,
  futureOrder,
  profiles,
  selectedId,
  highlightedId,
  onSelect,
  onMarkDone,
  completingId,
  getProjectChildren,
}: FlowListViewProps) {
  const [futureOpen, setFutureOpen] = useState(true)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const orderedFuture = futureOrder.length > 0
    ? futureOrder.map((id) => futureItems.find((i) => i.id === id)).filter(Boolean) as WorkItem[]
    : futureItems
  const restFuture = futureItems.filter((i) => !futureOrder.includes(i.id))
  const displayFuture = [...orderedFuture, ...restFuture]

  const sortableIds = [...mountainItems.map((i) => i.id), ...futureItems.map((i) => i.id)]
  return (
    <div className="flex-1 min-w-0 overflow-auto p-6 pb-24">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={() => {}}>
        <div className="max-w-2xl mx-auto space-y-8">
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <section>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-medium text-[var(--text)]">Mountain (90 days)</h2>
            {mountainItems.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">({mountainItems.length})</span>
            )}
          </div>
          <div className="space-y-2">
            {mountainItems.length === 0 ? (
              <div className="py-5 rounded-xl border-2 border-dashed border-teal-dark/20 text-center text-[var(--text-muted)] text-sm">
                No items on the mountain. Switch to 90-day view to build it.
              </div>
            ) : (
              mountainItems.map((item) => {
                const { profiles: assigneeProfiles, ownerId } = getAssigneeProfiles(item, profiles, getProjectChildren)
                return (
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
                  />
                )
              })
            )}
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-teal-dark/25 overflow-hidden">
          <button
            type="button"
            onClick={() => setFutureOpen(!futureOpen)}
            className="w-full flex items-center gap-2 py-2 px-3 text-left text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <h2 className="text-sm font-medium">Future</h2>
            {futureItems.length > 0 && (
              <span className="text-xs">({futureItems.length})</span>
            )}
            <svg
              className={`w-4 h-4 ml-1 transition-transform ${futureOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {futureOpen && (
            <div className="p-2 pt-0 space-y-2 border-t border-[var(--border)]/50">
              {displayFuture.length === 0 ? (
                <div className="py-5 text-center text-[var(--text-muted)] text-sm">
                  No future items. Add ideas with + or open Future in the sidebar to manage your list.
                </div>
              ) : (
                displayFuture.map((item) => {
                  const { profiles: assigneeProfiles, ownerId } = getAssigneeProfiles(item, profiles, getProjectChildren)
                  return (
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
                    />
                  )
                })
              )}
            </div>
          )}
        </section>
          </SortableContext>
        </div>
      </DndContext>
    </div>
  )
}
