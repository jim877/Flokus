import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { WorkItem, WorkItemUpdate, Profile } from '@/lib/supabase'
import { SECTION_ORDER, SECTION_CONFIG } from '@/lib/sections'
import type { Section } from '@/lib/supabase'

interface FocusViewProps {
  item: WorkItem
  profiles: Profile[]
  onClose: () => void
  onUpdate: (id: string, u: WorkItemUpdate) => Promise<WorkItem | undefined>
  onDelete: (id: string) => Promise<void>
  onMarkDone?: (itemId: string) => void
  getProjectChildren?: (parentId: string) => WorkItem[]
  onAddSubTask?: (title: string, ownerId: string | null) => Promise<unknown>
  reorderProjectSteps?: (projectId: string, orderedSteps: WorkItem[]) => Promise<void>
  removeStepFromProject?: (stepId: string, projectSection: Section) => Promise<void>
  linkTaskToProject?: (taskId: string, projectId: string, projectSection: Section) => Promise<void>
  standaloneTasks?: WorkItem[]
}

export default function FocusView({
  item,
  profiles,
  onClose,
  onUpdate,
  onDelete,
  onMarkDone,
  getProjectChildren,
  onAddSubTask,
  reorderProjectSteps,
  removeStepFromProject,
  linkTaskToProject,
  standaloneTasks = [],
}: FocusViewProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<WorkItem['type']>('task')
  const [section, setSection] = useState<Section>('primary')
  const [dueDate, setDueDate] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepOwnerId, setNewStepOwnerId] = useState<string | null>(null)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [linkTaskId, setLinkTaskId] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [lastAddedStepId, setLastAddedStepId] = useState<string | null>(null)

  const steps = (item.type === 'project' && getProjectChildren) ? getProjectChildren(item.id) : []
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    setTitle(item.title)
    setDescription(item.description ?? '')
    setItemType(item.type)
    setSection(item.section)
    setDueDate(item.due_date ? item.due_date.slice(0, 10) : '')
    setIsPrivate(item.is_private)
    setOwnerId(item.owner_id)
  }, [item])

  const handleSave = async (overrides?: Partial<WorkItemUpdate>) => {
    setSaving(true)
    try {
      await onUpdate(item.id, {
        title: title.trim() || item.title,
        description: description.trim() || null,
        type: itemType,
        section,
        due_date: dueDate || null,
        is_private: isPrivate,
        owner_id: ownerId,
        ...overrides,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this item?')) {
      await onDelete(item.id)
      onClose()
    }
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-[var(--bg-panel)]/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-[var(--border)] flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text)] flex items-center gap-1.5 text-sm"
          aria-label="Back to list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        {saving && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
      </div>
      <div className="flex-1 overflow-auto p-8 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void handleSave()}
              className="focus-glow w-full text-2xl font-medium bg-white dark:bg-white/10 rounded-lg px-3 py-2 border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)]"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => void handleSave()}
              rows={4}
              className="focus-glow w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 resize-none text-[var(--text)] placeholder:text-[var(--text-muted)]"
              placeholder="Add description…"
            />
          </div>
          {item.type === 'project' && onAddSubTask && (
            <div className="pt-4 border-t border-[var(--border)]">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">Steps & tasks</label>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const t = newStepTitle.trim()
                  if (!t) return
                  const result = await onAddSubTask(t, newStepOwnerId)
                  setNewStepTitle('')
                  setNewStepOwnerId(null)
                  const newId = result && typeof result === 'object' && 'id' in result ? (result as { id: string }).id : null
                  if (newId) {
                    setLastAddedStepId(newId)
                    setTimeout(() => setLastAddedStepId(null), 2200)
                  }
                }}
                className="flex flex-wrap items-end gap-2 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-[var(--border)] mb-4"
              >
                <input
                  type="text"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="New step or task…"
                  className="focus-glow flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm"
                  tabIndex={0}
                  aria-label="New step or task"
                />
                <select
                  value={newStepOwnerId ?? ''}
                  onChange={(e) => setNewStepOwnerId(e.target.value || null)}
                  className="focus-glow px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm"
                  tabIndex={0}
                  aria-label="Assignee (Tab to focus, Enter to open list, arrows to pick, Enter to accept)"
                  title="Tab to focus, Enter to open list, arrows to pick, Enter to accept"
                >
                  <option value="">Unassigned</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.short_name || p.name || p.email}</option>
                  ))}
                </select>
                <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">Tab → assignee, Enter to open</span>
                <button type="submit" className="focus-glow px-3 py-2 rounded-lg bg-teal-dark text-white text-sm font-medium hover:bg-teal-dark/90">
                  Add step
                </button>
              </form>
              {steps.length > 0 && reorderProjectSteps && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={async (ev: DragEndEvent) => {
                  const { active, over } = ev
                  if (!over || active.id === over.id) return
                  const oldIndex = steps.findIndex((s) => s.id === active.id)
                  const newIndex = steps.findIndex((s) => s.id === over.id)
                  if (oldIndex === -1 || newIndex === -1) return
                  const reordered = arrayMove(steps, oldIndex, newIndex)
                  await reorderProjectSteps(item.id, reordered)
                }}>
                  <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2 mb-4">
                      {steps.map((step) => (
                        <StepRow
                          key={step.id}
                          step={step}
                          profiles={profiles}
                          isEditing={editingStepId === step.id}
                          onEditStart={() => setEditingStepId(step.id)}
                          onEditEnd={() => setEditingStepId(null)}
                          onUpdate={onUpdate}
                          onMarkDone={onMarkDone}
                          onRemoveFromProject={removeStepFromProject ? () => removeStepFromProject(step.id, item.section) : undefined}
                          isJustAdded={step.id === lastAddedStepId}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}
              {steps.length > 0 && !reorderProjectSteps && (
                <ul className="space-y-2 mb-4">
                  {steps.map((step) => (
                    <StepRow
                      key={step.id}
                      step={step}
                      profiles={profiles}
                      isEditing={editingStepId === step.id}
                      onEditStart={() => setEditingStepId(step.id)}
                      onEditEnd={() => setEditingStepId(null)}
                      onUpdate={onUpdate}
                      onMarkDone={onMarkDone}
                      onRemoveFromProject={removeStepFromProject ? () => removeStepFromProject(step.id, item.section) : undefined}
                      isJustAdded={step.id === lastAddedStepId}
                    />
                  ))}
                </ul>
              )}
              {standaloneTasks.length > 0 && linkTaskToProject && (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-dashed border-[var(--border)] mt-3">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Add existing task:</span>
                  <select
                    value={linkTaskId}
                    onChange={(e) => setLinkTaskId(e.target.value)}
                    className="focus-glow flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm"
                  >
                    <option value="">Choose task…</option>
                    {standaloneTasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!linkTaskId) return
                      await linkTaskToProject(linkTaskId, item.id, item.section)
                      setLinkTaskId('')
                    }}
                    disabled={!linkTaskId}
                    className="px-3 py-2 rounded-lg bg-teal-light/20 text-teal-dark text-sm font-medium disabled:opacity-50"
                  >
                    Link
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              className="text-xs font-medium text-[var(--text-muted)] hover:text-teal-dark flex items-center gap-1.5"
            >
              {detailsOpen ? '▼' : '▶'} Details (section, date, assignee)
            </button>
            {detailsOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Section</label>
                  <select
                    value={section}
                    onChange={(e) => {
                      const v = e.target.value as Section
                      setSection(v)
                      void handleSave({ section: v })
                    }}
                    className="focus-glow w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
                  >
                    {SECTION_ORDER.map((id) => (
                      <option key={id} value={id}>
                        {SECTION_CONFIG[id].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={() => void handleSave()}
                    className="focus-glow w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Assignee</label>
                  <select
                    value={ownerId ?? ''}
                    onChange={(e) => {
                      const v = e.target.value || null
                      setOwnerId(v)
                      void handleSave({ owner_id: v })
                    }}
                    className="focus-glow w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
                  >
                    <option value="">Unassigned</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="focus-private"
                    checked={isPrivate}
                    onChange={(e) => {
                      const v = e.target.checked
                      setIsPrivate(v)
                      void handleSave({ is_private: v })
                    }}
                    className="rounded border-[var(--border)] accent-teal-dark"
                  />
                  <label htmlFor="focus-private" className="text-sm text-[var(--text-muted)]">Private</label>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-6">
            {item.status !== 'done' && (
              <button
                type="button"
                onClick={() => onMarkDone?.(item.id)}
                className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-teal-light/10 hover:text-teal-dark hover:border-teal-light/30 text-sm font-medium transition-colors"
              >
                Mark done
              </button>
            )}
            {item.status === 'done' && (
              <>
                {item.updated_at && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Done {new Date(item.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    {(() => {
                      const d = new Date(item.updated_at)
                      const today = new Date()
                      if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
                        return ` at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                      }
                      return ''
                    })()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await onUpdate(item.id, { status: 'todo' })
                  }}
                  className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-teal-light/10 hover:text-teal-dark text-sm font-medium transition-colors"
                >
                  Reopen
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text)] text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepRow({
  step,
  profiles,
  isEditing,
  onEditStart,
  onEditEnd,
  onUpdate,
  onMarkDone,
  onRemoveFromProject,
  isJustAdded = false,
}: {
  step: WorkItem
  profiles: Profile[]
  isEditing: boolean
  onEditStart: () => void
  onEditEnd: () => void
  onUpdate: (id: string, u: WorkItemUpdate) => Promise<WorkItem | undefined>
  onMarkDone?: (itemId: string) => void
  onRemoveFromProject?: () => void
  isJustAdded?: boolean
}) {
  const [editTitle, setEditTitle] = useState(step.title)
  const [editDue, setEditDue] = useState(step.due_date ? step.due_date.slice(0, 10) : '')
  const [editOwnerId, setEditOwnerId] = useState<string | null>(step.owner_id)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const owner = step.owner_id ? profiles.find((p) => p.id === step.owner_id) : null

  useEffect(() => {
    setEditTitle(step.title)
    setEditDue(step.due_date ? step.due_date.slice(0, 10) : '')
    setEditOwnerId(step.owner_id)
  }, [step.id, step.title, step.due_date, step.owner_id])

  const handleSave = () => {
    void onUpdate(step.id, {
      title: editTitle.trim() || step.title,
      due_date: editDue || null,
      owner_id: editOwnerId,
    })
    onEditEnd()
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-wrap items-center gap-2 py-2.5 px-3 rounded-xl border border-[var(--border)] bg-white/60 dark:bg-white/5 ${isDragging ? 'opacity-80 shadow-lg' : ''} ${isJustAdded ? 'glow-added' : ''}`}
    >
      <button type="button" className="p-1.5 rounded text-[var(--text-muted)] hover:bg-black/5 cursor-grab active:cursor-grabbing" {...attributes} {...listeners} aria-label="Drag to reorder">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
      </button>
      {isEditing ? (
        <>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="focus-glow flex-1 min-w-[120px] px-2 py-1 rounded border border-[var(--border)] bg-white dark:bg-white/10 text-sm"
            placeholder="Step title"
          />
          <input
            type="date"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
            className="focus-glow w-36 px-2 py-1 rounded border border-[var(--border)] bg-white dark:bg-white/10 text-xs"
          />
          <select
            value={editOwnerId ?? ''}
            onChange={(e) => setEditOwnerId(e.target.value || null)}
            className="focus-glow px-2 py-1 rounded border border-[var(--border)] bg-white dark:bg-white/10 text-xs min-w-[100px]"
          >
            <option value="">Unassigned</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.short_name || p.name || p.email}</option>
            ))}
          </select>
          <button type="button" onClick={handleSave} className="text-xs text-teal-dark font-medium">Save</button>
          <button type="button" onClick={onEditEnd} className="text-xs text-[var(--text-muted)]">Cancel</button>
        </>
      ) : (
        <>
          <button type="button" onClick={onEditStart} className="flex-1 text-left min-w-0">
            <span className={`text-sm block truncate ${step.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
              {step.title}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-muted)]">
              {step.due_date && <span>Due {new Date(step.due_date).toLocaleDateString()}</span>}
              {owner && <span>{owner.short_name || owner.name || owner.email}</span>}
            </div>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dateInputRef.current?.click() }}
            className="p-1.5 rounded text-[var(--text-muted)] hover:bg-black/5 flex-shrink-0"
            title={step.due_date ? `Due ${new Date(step.due_date).toLocaleDateString()}` : 'Set due date'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={step.due_date ? step.due_date.slice(0, 10) : ''}
            onChange={(e) => void onUpdate(step.id, { due_date: e.target.value || null })}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            aria-label="Due date"
          />
          <button
            type="button"
            onClick={() => step.status !== 'done' && onMarkDone?.(step.id)}
            className="text-xs text-teal-dark hover:underline font-medium"
          >
            {step.status === 'done' ? 'Done' : 'Mark done'}
          </button>
        </>
      )}
    </li>
  )
}
