import { useState } from 'react'
import type { Profile } from '@/lib/supabase'
import { TeamAvatar, AVATAR_COLORS, COLOR_PREFIX } from './TeamAvatar'

export interface BackgroundOption {
  id: string
  label: string
  className: string
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  /* Your uploaded photos (public folder) */
  { id: 'local-valley', label: 'Green valley', className: 'zen-bg-local-valley' },
  { id: 'local-misty-peaks', label: 'Misty peaks', className: 'zen-bg-local-misty-peaks' },
  { id: 'local-stones', label: 'River stones', className: 'zen-bg-local-stones' },
  { id: 'local-alpine-lake', label: 'Alpine lake', className: 'zen-bg-local-alpine-lake' },
  { id: 'local-sunrise', label: 'Sunrise mountains', className: 'zen-bg-local-sunrise' },
  { id: 'local-misty-hills', label: 'Misty hills', className: 'zen-bg-local-misty-hills' },
  { id: 'local-vista', label: 'Mountain vista', className: 'zen-bg-local-vista' },
  { id: 'local-dunes', label: 'Desert dunes', className: 'zen-bg-local-dunes' },
  /* Built-in options */
  { id: 'zen', label: 'Zen pebbles', className: 'zen-bg' },
  { id: 'warm', label: 'Warm gradient', className: 'zen-bg-warm' },
  { id: 'cool', label: 'Cool mist', className: 'zen-bg-cool' },
]

export type MeetingCadence = 'weekly' | 'biweekly'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  profiles: Profile[]
  onAddTeammate: (name: string, email: string) => void
  onUpdateProfile: (id: string, updates: Partial<Pick<Profile, 'name' | 'avatar_url' | 'initials' | 'short_name'>>) => void
  backgroundId: string
  onBackgroundChange: (id: string) => void
  /** 0 = photo fully visible, 100 = maximum overlay (most faded) */
  backgroundOverlay?: number
  onBackgroundOverlayChange?: (percent: number) => void
  meetingCadence?: MeetingCadence
  onMeetingCadenceChange?: (cadence: MeetingCadence) => void
}

export default function SettingsModal({
  open,
  onClose,
  profiles,
  onAddTeammate,
  onUpdateProfile,
  backgroundId,
  onBackgroundChange,
  backgroundOverlay = 75,
  onBackgroundOverlayChange,
  meetingCadence = 'weekly',
  onMeetingCadenceChange,
}: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<'team' | 'background' | 'meeting'>('team')
  const [showAddMember, setShowAddMember] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [editingShortName, setEditingShortName] = useState<string | null>(null)
  const [shortNameDraft, setShortNameDraft] = useState('')

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
            <button
              type="button"
              onClick={() => setActiveSection('meeting')}
              className={`px-4 py-2.5 text-sm font-medium ${activeSection === 'meeting' ? 'text-teal-dark border-b-2 border-teal-dark' : 'text-[var(--text-muted)]'}`}
            >
              Meeting
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {activeSection === 'team' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-muted)]">Add and manage team members. Assign avatars and short names for the 90-day view.</p>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="px-3 py-2 rounded-xl text-sm font-medium bg-teal-dark text-white hover:bg-teal-dark/90 transition-colors"
                  >
                    {showAddMember ? 'Cancel' : '+ Add member'}
                  </button>
                </div>
                {showAddMember && (
                  <form onSubmit={handleAddMember} className="p-4 rounded-2xl border-2 border-[var(--border)] bg-white/60 dark:bg-white/5 space-y-3">
                    <label className="block">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Name</span>
                      <input
                        type="text"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        placeholder="Full name"
                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Email</span>
                      <input
                        type="email"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        placeholder="email@example.com"
                        required
                        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
                      />
                    </label>
                    <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-medium bg-teal-dark text-white hover:bg-teal-dark/90">
                      Add to team
                    </button>
                  </form>
                )}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Team members</h3>
                  {profiles.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)] py-4 text-center rounded-xl border border-dashed border-[var(--border)]">
                      No members yet. Add someone above.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {profiles.map((p) => {
                        const isEditing = editingShortName === p.id
                        const shortNameValue = (p.short_name || '').trim()
                        const otherShortNames = new Set(profiles.filter((x) => x.id !== p.id).map((x) => (x.short_name || '').trim()).filter(Boolean))
                        const duplicate = Boolean(shortNameDraft.trim() && otherShortNames.has(shortNameDraft.trim()))
                        return (
                          <li key={p.id} className="p-4 rounded-2xl border border-[var(--border)] bg-white/70 dark:bg-white/5 hover:border-teal-dark/20 transition-colors">
                            <div className="flex items-start gap-4">
                              <TeamAvatar profile={p} size="lg" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-[var(--text)]">{p.short_name?.trim() || p.name || p.email}</div>
                                <div className="text-xs text-[var(--text-muted)] truncate">{p.short_name?.trim() ? `${p.name || p.email} · ${p.email}` : p.email}</div>
                                {isEditing ? (
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <input
                                      type="text"
                                      value={shortNameDraft}
                                      onChange={(e) => setShortNameDraft(e.target.value)}
                                      placeholder="Short name (unique)"
                                      className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white dark:bg-white/10 text-sm w-28"
                                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveShortName(p.id); if (e.key === 'Escape') { setEditingShortName(null); setShortNameDraft('') } }}
                                    />
                                    {duplicate && <span className="text-xs text-red-600">Already used</span>}
                                    <button type="button" onClick={() => handleSaveShortName(p.id)} disabled={duplicate} className="text-sm text-teal-dark font-medium disabled:opacity-50">Save</button>
                                    <button type="button" onClick={() => { setEditingShortName(null); setShortNameDraft('') }} className="text-sm text-[var(--text-muted)]">Cancel</button>
                                  </div>
                                ) : (
                                  <button type="button" onClick={() => startEditShortName(p)} className="text-sm text-teal-dark hover:underline mt-0.5">
                                    {shortNameValue ? `Short name: ${shortNameValue}` : 'Set short name'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[var(--border)]/60">
                              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Avatar color</span>
                              <div className="flex flex-wrap gap-2">
                                {AVATAR_COLORS.map((c) => {
                                  const isSelected = (p.avatar_url?.startsWith(COLOR_PREFIX) && p.avatar_url.slice(COLOR_PREFIX.length) === c.id) || (!p.avatar_url && c.id === 'teal')
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => onUpdateProfile(p.id, { avatar_url: COLOR_PREFIX + c.id })}
                                      className={`w-8 h-8 rounded-full ${c.bg} ${c.text} text-xs font-bold border-2 transition-all ${isSelected ? 'border-[var(--text)] ring-2 ring-teal-dark/30' : 'border-transparent hover:scale-110'}`}
                                      title={c.id}
                                    >
                                      {p.initials || (p.name || p.email).slice(0, 1).toUpperCase()}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)]">Short names are unique and show in the 90-day mountain. Avatar colors help tell people apart at a glance.</p>
              </div>
            )}
            {activeSection === 'background' && (
              <div className="space-y-4">
                {onBackgroundOverlayChange != null && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--text)]">
                      Overlay: {backgroundOverlay}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={backgroundOverlay}
                      onChange={(e) => onBackgroundOverlayChange(Number(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none bg-[var(--border)] accent-teal-dark"
                    />
                    <p className="text-xs text-[var(--text-muted)]">Lower = more photo visible, higher = more faded for readability.</p>
                  </div>
                )}
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
              </div>
            )}
            {activeSection === 'meeting' && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">Weekly review cadence. Use the Meeting button in the sidebar to run a review for the selected flow.</p>
                <div className="space-y-2">
                  {(['weekly', 'biweekly'] as const).map((cadence) => (
                    <button
                      key={cadence}
                      type="button"
                      onClick={() => onMeetingCadenceChange?.(cadence)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${meetingCadence === cadence ? 'border-teal-dark bg-teal-light/10' : 'border-[var(--border)] hover:border-teal-dark/30'}`}
                    >
                      <span className="font-medium text-[var(--text)]">{cadence === 'weekly' ? 'Weekly' : 'Every 2 weeks'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export { BACKGROUND_OPTIONS }
