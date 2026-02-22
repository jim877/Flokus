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
import AssigneeMultiSelect from './AssigneeMultiSelect'
import RichTextArea, { sanitizeTaskHtml, isFormattedTitle } from './RichTextArea'

function getAssigneeIds(item: WorkItem): string[] {
  if (item.assignee_ids && item.assignee_ids.length > 0) return item.assignee_ids
  return item.owner_id ? [item.owner_id] : []
}

function initials(profile: Profile): string {
  if (profile.short_name && profile.short_name.length <= 3) return profile.short_name
  const name = (profile.name || profile.email || '').trim()
  if (!name) return (profile.email || '?').slice(0, 2).toUpperCase()
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface DrawerItemViewProps {
  item: WorkItem
  profiles: Profile[]
  onClose: () => void
  onExpand?: () => void
  onCollapse?: () => void
  onUpdate: (id: string, u: WorkItemUpdate) => Promise<WorkItem | undefined>
  onDelete: (id: string) => Promise<void>
  onMarkDone?: (itemId: string) => void
  getProjectChildren?: (parentId: string) => WorkItem[]
  onAddSubTask?: (title: string, ownerId: string | null) => Promise<unknown>
  reorderProjectSteps?: (projectId: string, orderedSteps: WorkItem[]) => Promise<void>
  removeStepFromProject?: (stepId: string, projectSection: Section) => Promise<void>
  completingId?: string | null
  expanded?: boolean
}

export default function DrawerItemView({
  item,
  profiles,
  onClose,
  onExpand,
  onCollapse,
  onUpdate,
  onDelete,
  onMarkDone,
  getProjectChildren,
  onAddSubTask,
  reorderProjectSteps,
  removeStepFromProject,
  completingId,
  expanded = false,
}: DrawerItemViewProps) {
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [section, setSection] = useState<Section>(item.section)
  const [dueDate, setDueDate] = useState(item.due_date ? item.due_date.slice(0, 10) : '')
  const [ownerId, setOwnerId] = useState<string | null>(item.owner_id)
  const [saving, setSaving] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepAssigneeIds, setNewStepAssigneeIds] = useState<string[]>([])
  const [editingStepId, setEditingStepId] = useState<string | null>(null)

  const steps = getProjectChildren ? getProjectChildren(item.id) : []
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    setTitle(item.title)
    setDescription(item.description ?? '')
    setSection(item.section)
    setDueDate(item.due_date ? item.due_date.slice(0, 10) : '')
    setOwnerId(item.owner_id)
  }, [item])

  const handleSave = async (overrides?: Partial<WorkItemUpdate>) => {
    setSaving(true)
    try {
      await onUpdate(item.id, {
        title: title.trim() || item.title,
        description: description.trim() || null,
        section,
        due_date: dueDate || null,
        owner_id: ownerId,
        ...overrides,
      })
    } finally {
      setSaving(false)
    }
  }

  const owner = ownerId ? profiles.find((p) => p.id === ownerId) : null

  return (
    <aside
      className={`flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-panel)] backdrop-blur-sm flex flex-col overflow-hidden ${expanded ? 'w-[420px]' : 'w-80'}`}
    >
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
            aria-label="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {onExpand && !expanded && (
            <button type="button" onClick={onExpand} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0" aria-label="Widen panel" title="Widen panel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
          {onCollapse && expanded && (
            <button type="button" onClick={onCollapse} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0" aria-label="Narrow panel" title="Narrow panel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </div>
        {saving && <span className="text-xs text-[var(--text-muted)]">Saving…</span>}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-4">
        {/* Title at top */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void handleSave()}
            className="w-full text-lg font-semibold bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-teal-dark/40 focus:outline-none px-0 py-1 text-[var(--text)] placeholder:text-[var(--text-muted)]"
            placeholder="Title"
          />
        </div>

        {/* Description */}
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void handleSave()}
            rows={2}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none"
            placeholder="Description (optional)"
          />
        </div>

        {/* Tasks (any card can have subtasks) */}
        {onAddSubTask && (
          <div className="pt-2 border-t border-[var(--border)]">
            <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tasks</h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const t = newStepTitle.trim()
                if (!t) return
                await onAddSubTask(t, newStepAssigneeIds[0] ?? null)
                setNewStepTitle('')
                setNewStepAssigneeIds([])
                setNewStepOwnerId(null)
              }}
              className="flex flex-wrap gap-2 mb-3"
            >
              <input
                type="text"
                value={newStepTitle}
                onChange={(e) => setNewStepTitle(e.target.value)}
                placeholder="New task title…"
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-teal-dark/30 bg-white dark:bg-white/10 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-teal-light/40 focus:border-teal-dark/40"
              />
              {profiles.length > 0 && (
                <AssigneeMultiSelect
                  profiles={profiles}
                  value={newStepAssigneeIds}
                  onChange={setNewStepAssigneeIds}
                  placeholder="Assign"
                  size="sm"
                />
              )}
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-teal-dark text-white text-sm font-medium hover:opacity-90">
                Add task
              </button>
            </form>
            {reorderProjectSteps && steps.length > 0 ? (
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
                  <ul className="space-y-1.5">
                    {steps.map((step) => (
                      <DrawerSortableStepRow
                        key={step.id}
                        step={step}
                        profiles={profiles}
                        onUpdate={onUpdate}
                        onMarkDone={onMarkDone}
                        onRemove={removeStepFromProject ? () => removeStepFromProject(step.id, item.section) : undefined}
                        completingId={completingId}
                        isEditing={editingStepId === step.id}
                        onEditStart={() => setEditingStepId(step.id)}
                        onEditEnd={() => setEditingStepId(null)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            ) : (
              <ul className="space-y-1.5">
                {steps.map((step) => (
                  <DrawerStepCard
                    key={step.id}
                    step={step}
                    profiles={profiles}
                    onUpdate={onUpdate}
                    onMarkDone={onMarkDone}
                    onRemove={removeStepFromProject ? () => removeStepFromProject(step.id, item.section) : undefined}
                    completingId={completingId}
                    isEditing={editingStepId === step.id}
                    onEditStart={() => setEditingStepId(step.id)}
                    onEditEnd={() => setEditingStepId(null)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Collapsible details */}
        <details className="text-sm">
          <summary className="text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)]">Section, due date, assignee</summary>
          <div className="mt-2 space-y-2 pl-0">
            <select
              value={section}
              onChange={(e) => {
                const v = e.target.value as Section
                setSection(v)
                void handleSave({ section: v })
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm"
            >
              {SECTION_ORDER.map((id) => (
                <option key={id} value={id}>{SECTION_CONFIG[id].label}</option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={() => void handleSave()}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm"
            />
            <select
              value={ownerId ?? ''}
              onChange={(e) => {
                const v = e.target.value || null
                setOwnerId(v)
                void handleSave({ owner_id: v })
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm"
            >
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name || p.email}</option>
              ))}
            </select>
          </div>
        </details>
      </div>

      <footer className="flex-shrink-0 p-3 border-t border-[var(--border)] bg-[var(--bg-panel)] flex flex-col gap-2">
        <button
          type="button"
          onClick={item.status === 'done' ? () => onUpdate(item.id, { status: 'todo' }) : () => onMarkDone?.(item.id)}
          className={`w-full py-2.5 rounded-lg border text-sm font-medium transition-opacity duration-300 ${completingId === item.id ? 'animate-dissolve opacity-50' : ''} ${item.status === 'done' ? 'border-[var(--border)] text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text)]' : 'border-teal-dark/40 bg-teal-light/15 text-teal-dark hover:bg-teal-light/25'}`}
        >
          {item.status === 'done' ? `Undo · Done${owner ? ` ${initials(owner)}` : ''}` : 'Mark done'}
        </button>
        <button
          type="button"
          onClick={async () => { if (window.confirm('Delete this item?')) { await onDelete(item.id); onClose() } }}
          className="w-full py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 text-sm font-medium"
        >
          Delete
        </button>
      </footer>
    </aside>
  )
}

function DrawerStepContent({
  step,
  profiles,
  onUpdate,
  onMarkDone,
  onRemove,
  completingId: _completingId,
  isEditing,
  onEditStart,
  onEditEnd,
}: {
  step: WorkItem
  profiles: Profile[]
  onUpdate: (id: string, u: WorkItemUpdate) => Promise<WorkItem | undefined>
  onMarkDone?: (itemId: string) => void
  onRemove?: () => void
  completingId?: string | null
  isEditing?: boolean
  onEditStart?: () => void
  onEditEnd?: () => void
}) {
  const [editTitle, setEditTitle] = useState(step.title)
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>(() => getAssigneeIds(step))
  const [editDueDate, setEditDueDate] = useState(step.due_date ? step.due_date.slice(0, 10) : '')
  const dateInputRef = useRef<HTMLInputElement>(null)
  void _completingId

  useEffect(() => {
    setEditTitle(step.title)
    setEditAssigneeIds(getAssigneeIds(step))
    setEditDueDate(step.due_date ? step.due_date.slice(0, 10) : '')
  }, [step.id, step.title, step.owner_id, step.due_date, step.assignee_ids])

  const handleSave = () => {
    const raw = (editTitle || '').trim()
    const title = raw ? sanitizeTaskHtml(raw) : step.title
    void onUpdate(step.id, {
      title: title || step.title,
      assignee_ids: editAssigneeIds.length ? editAssigneeIds : undefined,
      owner_id: editAssigneeIds[0] ?? null,
      due_date: editDueDate || null,
    })
    onEditEnd?.()
  }

  return (
    <>
      {isEditing ? (
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
          <RichTextArea
            value={editTitle}
            onChange={setEditTitle}
            placeholder="Task title"
            minHeight="2.5rem"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }; if (e.key === 'Escape') onEditEnd?.() }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--text-muted)]">Due</span>
              <button
                type="button"
                onClick={() => dateInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--border)] bg-white dark:bg-white/10 text-xs text-[var(--text)] hover:border-teal-dark/40 hover:bg-teal-light/10 min-w-0"
                title="Pick due date"
              >
                <svg className="w-4 h-4 flex-shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{editDueDate ? new Date(editDueDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set date'}</span>
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0 pointer-events-none [color-scheme:light]"
                aria-label="Due date"
                title="Due date"
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-xs text-[var(--text-muted)]">Assignee</span>
              <AssigneeMultiSelect
                profiles={profiles}
                value={editAssigneeIds}
                onChange={setEditAssigneeIds}
                placeholder="Assign"
                size="sm"
              />
            </label>
            <button type="button" onClick={handleSave} className="text-xs text-teal-dark font-medium">Save</button>
            <button type="button" onClick={onEditEnd} className="text-xs text-[var(--text-muted)]">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 min-h-8 w-full">
          {onEditStart ? (
            <button type="button" onClick={onEditStart} className="flex-1 min-w-0 text-left truncate min-h-8 flex items-center">
              <span className={`text-sm block truncate ${step.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                {isFormattedTitle(step.title) ? (
                  <span className="task-formatted-title line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeTaskHtml(step.title) }} />
                ) : (
                  step.title
                )}
              </span>
            </button>
          ) : (
            <span className={`text-sm truncate flex-1 min-w-0 min-h-8 flex items-center ${step.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
              {isFormattedTitle(step.title) ? (
                <span className="task-formatted-title line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeTaskHtml(step.title) }} />
              ) : (
                step.title
              )}
            </span>
          )}
          {profiles.length > 0 && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center min-h-8">
              <AssigneeMultiSelect
                profiles={profiles}
                value={getAssigneeIds(step)}
                onChange={(ids) => void onUpdate(step.id, { assignee_ids: ids.length ? ids : undefined, owner_id: ids[0] ?? null })}
                placeholder="Assign"
                size="sm"
              />
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); dateInputRef.current?.click() }}
            className="flex items-center gap-1.5 min-h-8 min-w-0 px-1.5 py-0.5 rounded border border-transparent hover:border-[var(--border)] text-[10px] text-[var(--text-muted)] hover:text-teal-dark flex-shrink-0"
            title={step.due_date ? new Date(step.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set due date'}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{step.due_date ? new Date(step.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Due date'}</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={step.due_date ? step.due_date.slice(0, 10) : ''}
            onChange={(e) => void onUpdate(step.id, { due_date: e.target.value || null })}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            aria-label="Due date"
          />
          {step.status === 'done' && (
            <button type="button" onClick={() => onUpdate(step.id, { status: 'todo' })} className="text-xs text-teal-dark hover:underline font-medium min-h-8 flex items-center flex-shrink-0">Undo</button>
          )}
          {step.status !== 'done' && (
            <button type="button" onClick={() => onMarkDone?.(step.id)} className="text-xs text-teal-dark hover:underline font-medium min-h-8 flex items-center flex-shrink-0">Done</button>
          )}
        </div>
      )}
    </>
  )
}

const GripHandleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
  </svg>
)

function DrawerStepCard({
  step,
  profiles,
  onUpdate,
  onMarkDone,
  onRemove,
  completingId,
  isEditing,
  onEditStart,
  onEditEnd,
}: {
  step: WorkItem
  profiles: Profile[]
  onUpdate: (id: string, u: WorkItemUpdate) => Promise<WorkItem | undefined>
  onMarkDone?: (itemId: string) => void
  onRemove?: () => void
  completingId?: string | null
  isEditing?: boolean
  onEditStart?: () => void
  onEditEnd?: () => void
}) {
  return (
    <li
      className={`rounded-lg border border-[var(--border)] p-2.5 flex flex-wrap items-center gap-2 transition-opacity duration-300 ${completingId === step.id ? 'animate-dissolve opacity-50' : ''} ${step.status === 'done' ? 'bg-gray-100/80 dark:bg-white/5' : 'bg-white/80 dark:bg-white/5'}`}
    >
      <span className="p-1 rounded text-[var(--text-muted)] flex-shrink-0 opacity-50" aria-hidden>
        <GripHandleIcon />
      </span>
      <DrawerStepContent
        step={step}
        profiles={profiles}
        onUpdate={onUpdate}
        onMarkDone={onMarkDone}
        onRemove={onRemove}
        completingId={completingId}
        isEditing={isEditing}
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
      />
    </li>
  )
}

function DrawerSortableStepRow({
  step,
  profiles,
  onUpdate,
  onMarkDone,
  onRemove,
  completingId,
  isEditing,
  onEditStart,
  onEditEnd,
}: {
  step: WorkItem
  profiles: Profile[]
  onUpdate: (id: string, u: WorkItemUpdate) => Promise<WorkItem | undefined>
  onMarkDone?: (itemId: string) => void
  onRemove?: () => void
  completingId?: string | null
  isEditing: boolean
  onEditStart: () => void
  onEditEnd: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-[var(--border)] p-2.5 flex flex-wrap items-center gap-2 transition-opacity duration-300 ${completingId === step.id ? 'animate-dissolve opacity-50' : ''} ${step.status === 'done' ? 'bg-gray-100/80 dark:bg-white/5' : 'bg-white/80 dark:bg-white/5'} ${isDragging ? 'opacity-80 shadow-lg z-10' : ''}`}
    >
      <button type="button" className="p-1 rounded text-[var(--text-muted)] hover:bg-black/5 cursor-grab active:cursor-grabbing flex-shrink-0" {...attributes} {...listeners} aria-label="Drag to reorder">
        <GripHandleIcon />
      </button>
      <DrawerStepContent
        step={step}
        profiles={profiles}
        onUpdate={onUpdate}
        onMarkDone={onMarkDone}
        onRemove={onRemove}
        completingId={completingId}
        isEditing={isEditing}
        onEditStart={onEditStart}
        onEditEnd={onEditEnd}
      />
    </li>
  )
}
