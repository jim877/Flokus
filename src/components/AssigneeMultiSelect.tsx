import { useState, useRef, useEffect } from 'react'
import type { Profile } from '@/lib/supabase'
import { TeamAvatar } from './TeamAvatar'

const SLOT_SIZE = 'w-7 h-7'

interface AssigneeMultiSelectProps {
  profiles: Profile[]
  value: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
}

/** Empty circle + person icon for "no assignee" placeholder so trigger size stays fixed */
function EmptyAssigneeIcon({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border-2 border-dashed border-[var(--text-muted)]/40 text-[var(--text-muted)]/50 ${className}`}
      aria-hidden
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </span>
  )
}

export default function AssigneeMultiSelect({
  profiles,
  value,
  onChange,
  placeholder = 'Assign',
  className = '',
  size = 'sm',
}: AssigneeMultiSelectProps) {
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

  const selected = value.map((id) => profiles.find((p) => p.id === id)).filter(Boolean) as Profile[]

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-[4.25rem] h-8 rounded border border-[var(--border)] bg-white dark:bg-white/10 text-xs text-[var(--text)] hover:border-teal-dark/40 focus:outline-none focus:ring-2 focus:ring-teal-light/40 focus:border-teal-dark/40"
        title={placeholder}
      >
        {selected.length > 0 ? (
          <span className="flex items-center justify-center gap-0 -space-x-2 flex-shrink-0">
            {selected.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center justify-center rounded-full ring-2 ring-white dark:ring-[var(--bg-panel)] flex-shrink-0 w-6 h-6 overflow-hidden"
              >
                <TeamAvatar profile={p} size={size} className="w-6 h-6 rounded-full !m-0" />
              </span>
            ))}
            {selected.length > 3 && (
              <span
                className="w-6 h-6 rounded-full bg-teal-light/30 text-teal-dark text-[10px] font-medium flex items-center justify-center ring-2 ring-white dark:ring-[var(--bg-panel)] flex-shrink-0"
              >
                +{selected.length - 3}
              </span>
            )}
          </span>
        ) : (
          <EmptyAssigneeIcon className={SLOT_SIZE} />
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] shadow-lg z-50 min-w-[180px] max-h-64 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 min-h-0">
            {profiles.map((p) => {
              const isSelected = value.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isSelected) onChange(value.filter((id) => id !== p.id))
                    else onChange([...value, p.id])
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors min-h-[2.25rem] ${isSelected ? 'bg-teal-light/20 text-teal-dark' : 'text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <span className="flex items-center justify-center flex-shrink-0 w-7 h-7">
                    <TeamAvatar profile={p} size="sm" className="w-7 h-7 text-[10px]" />
                  </span>
                  <span className="truncate flex-1 min-w-0">{p.short_name || p.name || p.email}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 flex-shrink-0 text-teal-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
          <div className="border-t border-[var(--border)] pt-2 mt-1 px-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-1.5 rounded-md text-sm font-medium text-teal-dark hover:bg-teal-light/15"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
