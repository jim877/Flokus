import { useState, useRef, useEffect } from 'react'
import type { Profile } from '@/lib/supabase'
import { TeamAvatar } from './TeamAvatar'

const OVERLAP = 6

interface AvatarStackProps {
  /** Profiles to show; first is owner (on top), rest are step assignees */
  profiles: Profile[]
  ownerId?: string | null
  maxVisible?: number
  className?: string
  /** When set, click marks item done instead of opening assignee list */
  onMarkDone?: () => void
  /** When true, show checkmark to indicate done state */
  isDone?: boolean
}

export default function AvatarStack({ profiles, ownerId, maxVisible = 3, className = '', onMarkDone, isDone }: AvatarStackProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const ordered = ownerId
    ? [...profiles].sort((a, b) => (a.id === ownerId ? -1 : b.id === ownerId ? 1 : 0))
    : profiles
  const visible = ordered.slice(0, maxVisible)
  const rest = ordered.slice(maxVisible)
  const hasMore = rest.length > 0

  if (ordered.length === 0) return null

  return (
    <div ref={ref} className={`relative flex ${className}`}>
      <button
        type="button"
        onClick={() => (onMarkDone ? onMarkDone() : setOpen((o) => !o))}
        className="flex items-center -space-x-2 focus:outline-none focus:ring-2 focus:ring-teal-light/40 rounded-full"
        aria-label={onMarkDone ? (isDone ? 'Done' : 'Mark done') : (ordered.length === 1 ? ordered[0].short_name || ordered[0].name || ordered[0].email : `${ordered.length} assigned`)}
      >
        {visible.map((p, i) => (
          <div
            key={p.id}
            className={`ring-2 ring-[var(--bg-panel)] dark:ring-[var(--bg)] rounded-full flex-shrink-0 ${isDone ? 'opacity-75' : ''}`}
            style={{ marginLeft: i === 0 ? 0 : -OVERLAP }}
          >
            <TeamAvatar profile={p} size="sm" className="w-6 h-6 text-[10px]" />
          </div>
        ))}
        {hasMore && (
          <span
            className="w-6 h-6 rounded-full bg-teal-light/30 text-teal-dark text-[10px] font-medium flex items-center justify-center ring-2 ring-[var(--bg-panel)] dark:ring-[var(--bg)] flex-shrink-0"
            style={{ marginLeft: -OVERLAP }}
          >
            +{rest.length}
          </span>
        )}
      </button>
      {open && ordered.length > 0 && !onMarkDone && (
        <div className="absolute top-full right-0 mt-1.5 py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] shadow-lg z-50 min-w-[140px]">
          <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Assigned</div>
          {ordered.map((p) => (
            <div key={p.id} className="flex items-center gap-2 py-1">
              <TeamAvatar profile={p} size="sm" />
              <span className="text-sm text-[var(--text)] truncate">{p.short_name || p.name || p.email}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
