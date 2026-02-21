import { useState, useEffect } from 'react'
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
}

export default function FocusView({ item, profiles, onClose, onUpdate, onDelete, onMarkDone, getProjectChildren, onAddSubTask }: FocusViewProps) {
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

  const steps = (item.type === 'project' && getProjectChildren) ? getProjectChildren(item.id) : []

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

  const owner = ownerId ? profiles.find((p) => p.id === ownerId) : null

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
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void handleSave()}
              className="w-full text-2xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--text)] placeholder:text-[var(--text-muted)] py-1"
              placeholder="Task title"
            />
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
              <span className="capitalize">{SECTION_CONFIG[section].label}</span>
              <span>·</span>
              <span className="capitalize">{itemType}</span>
              {dueDate && (
                <>
                  <span>·</span>
                  <span>Due {new Date(dueDate).toLocaleDateString()}</span>
                </>
              )}
              {owner && (
                <>
                  <span>·</span>
                  <span>{owner.name || owner.email}</span>
                </>
              )}
              {isPrivate && <span>· Private</span>}
            </div>
          </div>
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => void handleSave()}
              rows={6}
              className="w-full px-0 py-2 bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-[var(--text)] placeholder:text-[var(--text-muted)]"
              placeholder="Add description…"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Section</label>
              <select
                value={section}
                onChange={(e) => {
                  const v = e.target.value as Section
                  setSection(v)
                  void handleSave({ section: v })
                }}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm text-[var(--text)]"
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
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm text-[var(--text)]"
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
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm text-[var(--text)]"
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
                className="rounded border-[var(--border)] text-teal-dark"
              />
              <label htmlFor="focus-private" className="text-sm text-[var(--text-muted)]">Private</label>
            </div>
          </div>
          {item.type === 'project' && onAddSubTask && (
            <div className="pt-6 border-t border-[var(--border)]">
              <h3 className="text-sm font-medium text-[var(--text)] mb-2">Steps & tasks</h3>
              {steps.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {steps.map((step) => {
                    const stepOwner = step.owner_id ? profiles.find((p) => p.id === step.owner_id) : null
                    return (
                      <li
                        key={step.id}
                        className="flex items-center gap-2 py-2 px-3 rounded-lg border border-[var(--border)] bg-black/[0.02]"
                      >
                        <span className={`flex-1 text-sm ${step.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                          {step.title}
                        </span>
                        {stepOwner && (
                          <span className="text-xs text-[var(--text-muted)]">
                            {stepOwner.name || stepOwner.email}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => step.status !== 'done' && onMarkDone?.(step.id)}
                          className="text-xs text-teal-dark hover:underline"
                        >
                          {step.status === 'done' ? 'Done' : 'Mark done'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const t = newStepTitle.trim()
                  if (!t) return
                  await onAddSubTask(t, newStepOwnerId)
                  setNewStepTitle('')
                  setNewStepOwnerId(null)
                }}
                className="flex flex-wrap items-end gap-2"
              >
                <input
                  type="text"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  placeholder="Add a step or task…"
                  className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                />
                <select
                  value={newStepOwnerId ?? ''}
                  onChange={(e) => setNewStepOwnerId(e.target.value || null)}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm"
                >
                  <option value="">Unassigned</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.email}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-teal-light/20 text-teal-dark text-sm font-medium"
                >
                  Add step
                </button>
              </form>
            </div>
          )}
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
              <button
                type="button"
                onClick={async () => {
                  await onUpdate(item.id, { status: 'todo' })
                }}
                className="px-4 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-teal-light/10 hover:text-teal-dark text-sm font-medium transition-colors"
              >
                Reopen
              </button>
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
