import { useState, useEffect } from 'react'
import type { WorkItem, WorkItemUpdate, Profile } from '@/lib/supabase'
import { SECTION_ORDER, SECTION_CONFIG } from '@/lib/sections'
import type { Section } from '@/lib/supabase'

interface DetailPanelProps {
  item: WorkItem | null
  profiles: Profile[]
  onClose: () => void
  onUpdate: (id: string, u: WorkItemUpdate) => Promise<WorkItem | undefined>
  onDelete: (id: string) => Promise<void>
  onMarkDone?: (itemId: string) => void
}

export default function DetailPanel({ item, profiles, onClose, onUpdate, onDelete, onMarkDone }: DetailPanelProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<WorkItem['type']>('task')
  const [section, setSection] = useState<Section>('primary')
  const [priority, setPriority] = useState<WorkItem['priority']>('medium')
  const [dueDate, setDueDate] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setDescription(item.description ?? '')
    setItemType(item.type)
    setSection(item.section)
    setPriority(item.priority)
    setDueDate(item.due_date ? item.due_date.slice(0, 10) : '')
    setIsPrivate(item.is_private)
    setOwnerId(item.owner_id)
  }, [item])

  const handleSave = async (overrides?: Partial<WorkItemUpdate>) => {
    if (!item) return
    setSaving(true)
    try {
      await onUpdate(item.id, {
        title: title.trim() || item.title,
        description: description.trim() || null,
        type: itemType,
        section,
        priority,
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
      await onDelete(item!.id)
      onClose()
    }
  }

  const handleStatusToggle = async () => {
    if (!item) return
    if (item.status === 'done') {
      await onUpdate(item.id, { status: 'todo' })
    } else {
      onMarkDone?.(item.id)
    }
  }

  if (!item) {
    return (
      <aside className="w-14 flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-panel)] backdrop-blur-sm flex flex-col items-center py-6">
        <p className="text-xs text-[var(--text-muted)] rotate-180 whitespace-nowrap mt-8" style={{ writingMode: 'vertical-rl' }}>
          Click a task to edit
        </p>
      </aside>
    )
  }

  return (
    <aside className="w-64 flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-panel)] backdrop-blur-sm flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--text)]">Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => { setItemType('task'); void handleSave({ type: 'task' }); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                itemType === 'task' ? 'bg-teal-light/20 text-teal-dark' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
              }`}
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => { setItemType('project'); void handleSave({ type: 'project' }); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                itemType === 'project' ? 'bg-teal-light/20 text-teal-dark' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
              }`}
            >
              Project
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Section</label>
          <select
            value={section}
            onChange={(e) => {
              const v = e.target.value as Section
              setSection(v)
              void handleSave({ section: v })
            }}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
          >
            {SECTION_ORDER.map((id) => (
              <option key={id} value={id}>
                {SECTION_CONFIG[id].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void handleSave()}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void handleSave()}
            rows={2}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            onBlur={() => void handleSave()}
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
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
            className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
          >
            <option value="">Unassigned</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="private"
            checked={isPrivate}
            onChange={(e) => {
              const v = e.target.checked
              setIsPrivate(v)
              void handleSave({ is_private: v })
            }}
            className="rounded border-[var(--border)] text-teal-dark"
          />
          <label htmlFor="private" className="text-xs text-[var(--text-muted)]">Private</label>
        </div>
        <div className="pt-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleStatusToggle}
            className="w-full py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-teal-light/10 hover:text-teal-dark hover:border-teal-light/30 text-sm font-medium transition-colors"
          >
            {item.status === 'done' ? 'Reopen' : 'Mark done'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full py-2 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text)] text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      {saving && (
        <div className="px-3 py-1.5 text-xs text-[var(--text-muted)] border-t border-[var(--border)]">Saving...</div>
      )}
    </aside>
  )
}
