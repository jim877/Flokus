import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { WorkItem } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import AvatarStack from './AvatarStack'

function formatDue(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 7) return `In ${diff} days`
  return d.toLocaleDateString()
}

function formatDoneDate(updatedAt: string | undefined): string {
  if (!updatedAt) return ''
  const d = new Date(updatedAt)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sameDay = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  if (sameDay) return `Done today at ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  return `Done ${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
}

interface ItemCardProps {
  item: WorkItem
  profiles: Profile[]
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
  onMarkDone?: (itemId: string) => void
  isCompleting?: boolean
  /** For avatar stack: assignees (owner + step assignees), owner first */
  assigneeProfiles?: Profile[]
  ownerId?: string | null
  /** When true, show gradient outline "deposited" animation */
  isJustDeposited?: boolean
}

export default function ItemCard({ item, profiles, isSelected, isHighlighted, onSelect, onMarkDone, isCompleting, assigneeProfiles, ownerId, isJustDeposited }: ItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const displayProfiles = assigneeProfiles && assigneeProfiles.length > 0 ? assigneeProfiles : (item.owner_id ? profiles.filter((p) => p.id === item.owner_id) : [])
  const displayOwnerId = ownerId ?? item.owner_id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-[var(--bg-panel)] backdrop-blur-sm
        cursor-pointer transition-all duration-200
        ${isSelected ? 'ring-1 ring-teal-dark/30 border-teal-light/40' : 'border-[var(--border)]'}
        ${isJustDeposited ? 'deposit-highlight' : isHighlighted ? 'animate-glow-teal ring-1 ring-teal-dark/30' : ''}
        hover:border-teal-light/30
        ${isDragging ? 'opacity-70 shadow-card-soft z-10' : ''}
        ${isCompleting ? 'animate-dissolve pointer-events-none' : ''}
      `}
      onClick={onSelect}
    >
      <button
        type="button"
        className="touch-none p-1 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text)]"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="7" cy="6" r="1.5" />
          <circle cx="13" cy="6" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
        </svg>
      </button>
      <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {item.type === 'project' ? (
          <span className="text-[var(--text-muted)]" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (item.status !== 'done') onMarkDone?.(item.id)
            }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-light/40 focus:ring-offset-0 ${
              item.status === 'done'
                ? 'border-teal-light/50 bg-teal-light/20'
                : 'border-[var(--border)] hover:border-teal-light/40 hover:bg-teal-light/5'
            }`}
            aria-label={item.status === 'done' ? 'Done' : 'Mark done'}
          >
            {item.status === 'done' && (
              <svg className="w-2.5 h-2.5 text-teal-dark" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate block ${item.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
          {item.title}
        </span>
        {item.status === 'done' && item.updated_at && (
          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5" title={new Date(item.updated_at).toLocaleString()}>
            {formatDoneDate(item.updated_at)}
          </span>
        )}
        {item.status !== 'done' && item.due_date && (
          <span className="text-xs text-[var(--text-muted)]">
            {formatDue(item.due_date)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {displayProfiles.length > 0 && (
          <AvatarStack
            profiles={displayProfiles}
            ownerId={displayOwnerId}
            className="flex-shrink-0"
            onMarkDone={item.type === 'task' ? () => item.status !== 'done' && onMarkDone?.(item.id) : undefined}
            isDone={item.type === 'task' ? item.status === 'done' : undefined}
          />
        )}
        {item.is_private && (
          <span className="text-[var(--text-muted)]" title="Private">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm2-2v2h6V7a3 3 0 00-6 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
        <span className="text-[var(--text-muted)] opacity-50">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  )
}
