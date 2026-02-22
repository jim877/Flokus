import { useState, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { WorkItem } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import { SECTION_ORDER, SECTION_CONFIG } from '@/lib/sections'
import type { Section } from '@/lib/supabase'
import ItemCard from './ItemCard'

const SECTION_DROPPABLE_PREFIX = 'section-'

interface WorkspaceListProps {
  sections: Record<Section, WorkItem[]>
  profiles: Profile[]
  selectedId: string | null
  highlightedId: string | null
  onSelect: (id: string | null) => void
  onReorderSection: (section: Section, orderedItems: WorkItem[]) => Promise<void>
  onMoveToSection: (itemId: string, section: Section) => Promise<void>
  onMarkDone?: (itemId: string) => void
  completingId?: string | null
  getProjectChildren?: (parentId: string) => WorkItem[]
}

function SectionDropZone({
  sectionId,
  children,
}: {
  sectionId: Section
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: SECTION_DROPPABLE_PREFIX + sectionId })
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-dashed transition-colors min-h-[40px] ${
        isOver ? 'border-success/50 bg-success/5' : 'border-[var(--border)]'
      }`}
    >
      {children}
    </div>
  )
}

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

export default function WorkspaceList({
  sections,
  profiles,
  selectedId,
  highlightedId,
  onSelect,
  onReorderSection,
  onMoveToSection,
  onMarkDone,
  completingId,
  getProjectChildren,
}: WorkspaceListProps) {
  const [futureOpen, setFutureOpen] = useState(false)
  const highlightedRef = useRef<HTMLDivElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (highlightedId && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedId])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const overId = String(over.id)
    if (overId.startsWith(SECTION_DROPPABLE_PREFIX)) {
      const targetSection = overId.replace(SECTION_DROPPABLE_PREFIX, '') as Section
      await onMoveToSection(active.id as string, targetSection)
      if (targetSection === 'icebox') setFutureOpen(true)
      return
    }

    const overItemId = overId
    const overSection = SECTION_ORDER.find((s) => sections[s].some((i) => i.id === overItemId))
    const activeSection = SECTION_ORDER.find((s) => sections[s].some((i) => i.id === active.id))
    if (!overSection || !activeSection) return
    const list = sections[overSection]
    const oldIndex = list.findIndex((i) => i.id === active.id)
    const newIndex = list.findIndex((i) => i.id === overItemId)
    if (oldIndex === -1 || newIndex === -1) return
    if (overSection !== activeSection) {
      await onMoveToSection(active.id as string, overSection)
      const currentInTarget = sections[overSection].filter((i) => i.id !== active.id)
      const movedItem = sections[activeSection].find((i) => i.id === active.id)
      if (movedItem) {
        const inserted = [...currentInTarget]
        inserted.splice(newIndex, 0, { ...movedItem, section: overSection })
        await onReorderSection(overSection, inserted)
      }
      if (overSection === 'icebox') setFutureOpen(true)
      return
    }
    const reordered = arrayMove(list, oldIndex, newIndex)
    await onReorderSection(overSection, reordered)
  }

  return (
    <div className="flex-1 min-w-0 overflow-auto p-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {SECTION_ORDER.map((sectionId) => {
            const items = sections[sectionId]
            const { label, Icon } = SECTION_CONFIG[sectionId]
            const isFuture = sectionId === 'icebox'
            const isCollapsed = isFuture && !futureOpen

            return (
              <section key={sectionId} id={'section-' + sectionId}>
                {isFuture ? (
                  <SectionDropZone sectionId={sectionId}>
                    <button
                      type="button"
                      onClick={() => setFutureOpen(!futureOpen)}
                      className={`w-full flex items-center gap-2 py-2 px-2 text-left text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-t-xl ${
                        isCollapsed ? 'rounded-b-xl min-h-[44px]' : ''
                      }`}
                    >
                      <span><Icon /></span>
                      <h2 className="text-sm font-medium">{label}</h2>
                      {items.length > 0 && <span className="text-xs">({items.length})</span>}
                      <svg
                        className={`w-4 h-4 ml-1 transition-transform ${futureOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {!isCollapsed && (
                      <div className="p-2 space-y-1.5 border-t border-[var(--border)]/50">
                        <SortableContext
                          items={items.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {items.length === 0 ? (
                            <div className="py-5 text-center text-[var(--text-muted)] text-sm">
                              Nothing for later yet.
                            </div>
                          ) : (
                            items.map((item) => (
                              <div
                                key={item.id}
                                data-item-id={item.id}
                                ref={item.id === highlightedId ? highlightedRef : null}
                              >
<ItemCard
                                item={item}
                                profiles={profiles}
                                isSelected={selectedId === item.id}
                                isHighlighted={highlightedId === item.id}
                                onSelect={() => onSelect(selectedId === item.id ? null : item.id)}
                                onMarkDone={onMarkDone}
                                isCompleting={completingId === item.id}
                                assigneeProfiles={getAssigneeProfiles(item, profiles, getProjectChildren).profiles}
                                ownerId={getAssigneeProfiles(item, profiles, getProjectChildren).ownerId}
                              />
                              </div>
                            ))
                          )}
                        </SortableContext>
                      </div>
                    )}
                  </SectionDropZone>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[var(--text-muted)]"><Icon /></span>
                      <h2 className="text-sm font-medium text-[var(--text)]">{label}</h2>
                      {items.length > 0 && (
                        <span className="text-xs text-[var(--text-muted)]">({items.length})</span>
                      )}
                    </div>
                    <SectionDropZone sectionId={sectionId}>
                      <div className="p-2 space-y-1.5">
                        <SortableContext
                          items={items.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {items.length === 0 ? (
                            <div className="py-5 text-center text-[var(--text-muted)] text-sm">
                              Drop here or add below.
                            </div>
                          ) : (
                            items.map((item) => (
                              <div
                                key={item.id}
                                data-item-id={item.id}
                                ref={item.id === highlightedId ? highlightedRef : null}
                              >
<ItemCard
                                item={item}
                                profiles={profiles}
                                isSelected={selectedId === item.id}
                                isHighlighted={highlightedId === item.id}
                                onSelect={() => onSelect(selectedId === item.id ? null : item.id)}
                                onMarkDone={onMarkDone}
                                isCompleting={completingId === item.id}
                                assigneeProfiles={getAssigneeProfiles(item, profiles, getProjectChildren).profiles}
                                ownerId={getAssigneeProfiles(item, profiles, getProjectChildren).ownerId}
                              />
                              </div>
                            ))
                          )}
                        </SortableContext>
                      </div>
                    </SectionDropZone>
                  </>
                )}
              </section>
            )
          })}
        </DndContext>
      </div>
    </div>
  )
}
