import { useState } from 'react'
import type { Profile } from '@/lib/supabase'

const AVATAR_PRESETS = ['👤', '🧑', '👩', '👨', '🧑‍💻', '👩‍💻', '🌿', '📋', '✓', '◆']

export interface BackgroundOption {
  id: string
  label: string
  className: string
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'zen', label: 'Zen pebbles', className: 'zen-bg' },
  { id: 'warm', label: 'Warm gradient', className: 'zen-bg-warm' },
  { id: 'cool', label: 'Cool mist', className: 'zen-bg-cool' },
]

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  profiles: Profile[]
  onAddTeammate: (name: string, email: string) => void
  onUpdateProfile: (id: string, updates: Partial<Pick<Profile, 'name' | 'avatar_url' | 'initials' | 'short_name'>>) => void
  backgroundId: string
  onBackgroundChange: (id: string) => void
}

export default function SettingsModal({
  open,
  onClose,
  profiles,
  onAddTeammate,
  onUpdateProfile,
  backgroundId,
  onBackgroundChange,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<'team' | 'background'>('team')
  const [showAddMember, setShowAddMember] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [editingShortName, setEditingShortName] = useState<string | null>(null)
  const [shortNameDraft, setShortNameDraft] = useState('')

  const usedShortNames = new Set(profiles.map((p) => (p.short_name || '').trim()).filter(Boolean))
  const avatarEmojiPrefix = 'emoji:'

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    const email = addEmail.trim()
    if (!email) return
    onAddTeammate(addName.trim(), email)
    setAddName('')
    setAddEmail('')
    setShowAddMember(false)
  }

  const handleSaveShortName = (profileId: string) => {
    const raw = shortNameDraft.trim()
    const takenByOther = raw && profiles.some((p) => p.id !== profileId && (p.short_name || '').trim() === raw)
    if (takenByOther) return
    onUpdateProfile(profileId, { short_name: raw || null })
    setEditingShortName(null)
    setShortNameDraft('')
  }

  const startEditShortName = (p: Profile) => {
    setEditingShortName(p.id)
    setShortNameDraft(p.short_name || '')
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text)]">Settings</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveSection('team')}
              className={`px-4 py-2.5 text-sm font-medium ${activeSection === 'team' ? 'text-teal-dark border-b-2 border-teal-dark' : 'text-[var(--text-muted)]'}`}
            >
              Team
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('background')}
              className={`px-4 py-2.5 text-sm font-medium ${activeSection === 'background' ? 'text-teal-dark border-b-2 border-teal-dark' : 'text-[var(--text-muted)]'}`}
            >
              Background
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {activeSection === 'team' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Members</span>
                  <button type="button" onClick={() => setShowAddMember(!showAddMember)} className="text-sm text-teal-dark hover:underline">
                    {showAddMember ? 'Cancel' : '+ Add member'}
                  </button>
                </div>
                {showAddMember && (
                  <form onSubmit={handleAddMember} className="space-y-2 p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm" />
                    <input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="Email" required className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm" />
                    <button type="submit" className="w-full py-2 rounded-lg text-sm font-medium bg-teal-light/20 text-teal-dark">Add</button>
                  </form>
                )}
                <ul className="space-y-2">
                  {profiles.map((p) => {
                    const isEditing = editingShortName === p.id
                    const shortNameValue = (p.short_name || '').trim()
                    const otherShortNames = new Set(profiles.filter((x) => x.id !== p.id).map((x) => (x.short_name || '').trim()).filter(Boolean))
                    const duplicate = Boolean(shortNameDraft.trim() && otherShortNames.has(shortNameDraft.trim()))
                    return (
                      <li key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-white/50 dark:bg-white/5">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-light/20 text-teal-dark flex items-center justify-center text-lg overflow-hidden">
                          {p.avatar_url?.startsWith(avatarEmojiPrefix) ? (
                            <span>{p.avatar_url.slice(avatarEmojiPrefix.length)}</span>
                          ) : p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{p.initials || (p.name || p.email).slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--text)] truncate">{p.name || p.email}</div>
                          <div className="text-xs text-[var(--text-muted)] truncate">{p.email}</div>
                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={shortNameDraft}
                                onChange={(e) => setShortNameDraft(e.target.value)}
                                placeholder="Short name (unique)"
                                className="mt-1 px-2 py-1 rounded border border-[var(--border)] bg-transparent text-xs w-24"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveShortName(p.id); if (e.key === 'Escape') { setEditingShortName(null); setShortNameDraft('') } }}
                              />
                              {duplicate && <span className="text-[10px] text-red-600">Duplicate</span>}
                              <button type="button" onClick={() => handleSaveShortName(p.id)} disabled={duplicate} className="text-xs text-teal-dark disabled:opacity-50">Save</button>
                              <button type="button" onClick={() => { setEditingShortName(null); setShortNameDraft('') }} className="text-xs text-[var(--text-muted)]">Cancel</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => startEditShortName(p)} className="text-xs text-teal-dark hover:underline mt-0.5">
                              {shortNameValue || 'Set short name'}
                            </button>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0 flex-wrap">
                          {AVATAR_PRESETS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => onUpdateProfile(p.id, { avatar_url: avatarEmojiPrefix + emoji })}
                              className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-sm hover:border-teal-dark/40"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <p className="text-xs text-[var(--text-muted)]">Short names cannot be duplicated. Use them for quick display in the mountain.</p>
              </div>
            )}
            {activeSection === 'background' && (
              <div className="space-y-2">
                {BACKGROUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onBackgroundChange(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${backgroundId === opt.id ? 'border-teal-dark bg-teal-light/10' : 'border-[var(--border)] hover:border-teal-dark/30'}`}
                  >
                    <span className="font-medium text-[var(--text)]">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export { BACKGROUND_OPTIONS }
