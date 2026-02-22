import { useState } from 'react'
import type { Flow, FlowIconId, FlowColorTheme } from '@/lib/flows'
import { createFlowId, FLOW_ICON_IDS, FLOW_COLOR_THEMES } from '@/lib/flows'
import { getCurrentQuarterStartISO, getCurrentQuarterEndISO, getAsyncFlowEndISO, formatQuarterRange } from '@/lib/quarter'
import FlowIcon from './FlowIcon'
import { BACKGROUND_OPTIONS } from './SettingsModal'

interface CreateFlowModalProps {
  open: boolean
  onClose: () => void
  onCreate: (flow: Flow) => void
}

const isWallpaperBackground = (id: string) => id === 'zen' || id.startsWith('local-')

export default function CreateFlowModal({ open, onClose, onCreate }: CreateFlowModalProps) {
  const [name, setName] = useState('')
  const [syncMode, setSyncMode] = useState<'quarter' | 'async'>('quarter')
  const [icon, setIcon] = useState<FlowIconId | ''>('')
  const [colorTheme, setColorTheme] = useState<FlowColorTheme>('teal')
  const [backgroundId, setBackgroundId] = useState('')
  const [backgroundOverlay, setBackgroundOverlay] = useState(50)

  const quarterStart = getCurrentQuarterStartISO()
  const quarterEnd = getCurrentQuarterEndISO()
  const asyncEnd = getAsyncFlowEndISO()
  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const flow: Flow = {
      id: createFlowId(),
      name: trimmed,
      status: 'new',
      syncMode,
      isLocked: false,
      icon: icon || undefined,
      colorTheme: colorTheme || undefined,
      backgroundId: backgroundId || undefined,
      backgroundOverlay: backgroundId && isWallpaperBackground(backgroundId) ? backgroundOverlay : undefined,
    }
    if (syncMode === 'quarter') {
      flow.quarterStart = quarterStart
      flow.quarterEnd = quarterEnd
    } else {
      flow.quarterStart = today
      flow.quarterEnd = asyncEnd
    }
    onCreate(flow)
    setName('')
    setSyncMode('quarter')
    setIcon('')
    setColorTheme('teal')
    setBackgroundId('')
    setBackgroundOverlay(50)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xl max-w-md w-full pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text)]">New 90-day flow</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5" aria-label="Close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--text-muted)]">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Product launch"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-dark/30"
                autoFocus
              />
            </label>
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Icon (optional)</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {FLOW_ICON_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIcon(icon === id ? '' : id)}
                    className={`p-2 rounded-xl border-2 transition-colors ${icon === id ? 'border-teal-dark bg-teal-light/20' : 'border-[var(--border)] hover:border-teal-dark/30'}`}
                    title={id}
                  >
                    <FlowIcon icon={id} className="w-5 h-5 text-[var(--text)]" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Color (optional)</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {FLOW_COLOR_THEMES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setColorTheme(id)}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${colorTheme === id ? 'ring-2 ring-offset-1 ring-[var(--text)]' : ''} ${id === 'teal' ? 'bg-teal-dark border-teal-dark' : id === 'amber' ? 'bg-amber-500 border-amber-500' : id === 'violet' ? 'bg-violet-500 border-violet-500' : id === 'rose' ? 'bg-rose-500 border-rose-500' : 'bg-sky-500 border-sky-500'}`}
                    title={id}
                  />
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Background when active (optional)</span>
              <div className="flex flex-wrap gap-2 mb-2">
                {BACKGROUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBackgroundId(backgroundId === opt.id ? '' : opt.id)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm transition-colors ${backgroundId === opt.id ? 'border-teal-dark bg-teal-light/10' : 'border-[var(--border)] hover:border-teal-dark/30'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {backgroundId && isWallpaperBackground(backgroundId) && (
                <div className="space-y-1 mb-4">
                  <label className="block text-xs font-medium text-[var(--text)]">Shading: {backgroundOverlay}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={backgroundOverlay}
                    onChange={(e) => setBackgroundOverlay(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none bg-[var(--border)] accent-teal-dark"
                  />
                </div>
              )}
            </div>
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Time frame</span>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors border-[var(--border)] hover:border-teal-dark/30 has-[:checked]:border-teal-dark has-[:checked]:bg-teal-light/10">
                  <input type="radio" name="sync" checked={syncMode === 'quarter'} onChange={() => setSyncMode('quarter')} className="mt-1 text-teal-dark" />
                  <div>
                    <span className="font-medium text-[var(--text)]">Sync to current quarter</span>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatQuarterRange(quarterStart, quarterEnd)}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors border-[var(--border)] hover:border-teal-dark/30 has-[:checked]:border-teal-dark has-[:checked]:bg-teal-light/10">
                  <input type="radio" name="sync" checked={syncMode === 'async'} onChange={() => setSyncMode('async')} className="mt-1 text-teal-dark" />
                  <div>
                    <span className="font-medium text-[var(--text)]">Work asynchronously</span>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">90 days from today (no calendar tie)</p>
                  </div>
                </label>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">New flows start unlocked. Add projects to the 90-day mountain, then lock the flow from the mountain view when you’re ready to start the quarter.</p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-black/5">
                Cancel
              </button>
              <button type="submit" disabled={!name.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-dark text-white font-medium hover:opacity-90 disabled:opacity-50">
                Create flow
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
