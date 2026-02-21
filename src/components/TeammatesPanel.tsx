import { useState } from 'react'
import type { Profile } from '@/lib/supabase'

function getInitials(p: Profile): string {
  return p.initials || (p.name ? p.name.slice(0, 2).toUpperCase() : p.email.slice(0, 2).toUpperCase())
}

interface TeammatesPanelProps {
  profiles: Profile[]
  onAddTeammate: (name: string, email: string) => void
  collapsed?: boolean
}

export default function TeammatesPanel({ profiles, onAddTeammate, collapsed }: TeammatesPanelProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return
    onAddTeammate(name.trim(), trimmedEmail)
    setName('')
    setEmail('')
    setShowAdd(false)
  }

  if (collapsed) {
    return (
      <div className="p-2 flex justify-center" title="Team">
        <span className="w-8 h-8 rounded-full bg-teal-light/20 text-teal-dark text-xs font-medium flex items-center justify-center">
          {profiles.length}
        </span>
      </div>
    )
  }

  return (
    <div className="px-2 py-2 border-t border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-muted)]">Team</span>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-teal-dark hover:underline"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-2 space-y-1.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-transparent text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-transparent text-sm"
            required
          />
          <button type="submit" className="w-full py-1.5 rounded text-sm font-medium bg-teal-light/20 text-teal-dark">
            Add teammate
          </button>
        </form>
      )}
      <ul className="space-y-1">
        {profiles.map((p) => (
          <li key={p.id} className="flex items-center gap-2 py-1">
            <span
              className="w-7 h-7 rounded-full bg-teal-light/20 text-teal-dark text-[10px] font-medium flex items-center justify-center flex-shrink-0"
              title={p.email}
            >
              {getInitials(p)}
            </span>
            <span className="text-sm text-[var(--text)] truncate">{p.name || p.email}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
