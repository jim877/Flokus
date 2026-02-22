import { useState, useEffect } from 'react'
import type { Flow, FlowIconId, FlowColorTheme } from '@/lib/flows'
import { FLOW_ICON_IDS, FLOW_COLOR_THEMES } from '@/lib/flows'
import FlowIcon from './FlowIcon'
import { BACKGROUND_OPTIONS } from './SettingsModal'

interface FlowEditModalProps {
  open: boolean
  flow: Flow | null
  onClose: () => void
  onSave: (updates: Partial<Pick<Flow, 'name' | 'icon' | 'colorTheme' | 'backgroundId'>>) => void
}

export default function FlowEditModal({ open, flow, onClose, onSave }: FlowEditModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<FlowIconId | ''>('')
  const [colorTheme, setColorTheme] = useState<FlowColorTheme>('teal')
  const [backgroundId, setBackgroundId] = useState('')

  useEffect(() => {
    if (flow) {
      setName(flow.name)
      setIcon(flow.icon ?? '')
      setColorTheme(flow.colorTheme ?? 'teal')
      setBackgroundId(flow.backgroundId ?? '')
    }
  }, [flow])

  if (!open || !flow) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: name.trim() || flow.name,
      icon: icon || undefined,
      colorTheme: colorTheme || undefined,
      backgroundId: backgroundId || undefined,
    })
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-xl max-w-md w-full pointer-events-auto max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text)]">Flow identity</h2>
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
                placeholder="Flow name"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-white dark:bg-white/10 text-sm text-[var(--text)]"
              />
            </label>
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Icon</span>
              <div className="flex flex-wrap gap-2">
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
              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Color</span>
              <div className="flex flex-wrap gap-2">
                {FLOW_COLOR_THEMES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setColorTheme(id)}
                    className={`w-8 h-8 rounded-full border-2 transition-colors ${
                      colorTheme === id ? 'ring-2 ring-offset-1 ring-[var(--text)]' : ''
                    } ${
                      id === 'teal' ? 'bg-teal-dark border-teal-dark' :
                      id === 'amber' ? 'bg-amber-500 border-amber-500' :
                      id === 'violet' ? 'bg-violet-500 border-violet-500' :
                      id === 'rose' ? 'bg-rose-500 border-rose-500' :
                      'bg-sky-500 border-sky-500'
                    }`}
                    title={id}
                  />
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] block mb-2">Background when this flow is active</span>
              <div className="space-y-2">
                {BACKGROUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBackgroundId(backgroundId === opt.id ? '' : opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${backgroundId === opt.id ? 'border-teal-dark bg-teal-light/10' : 'border-[var(--border)] hover:border-teal-dark/30'}`}
                  >
                    <span className="font-medium text-[var(--text)]">{opt.label}</span>
                  </button>
                ))}
                {backgroundId && (
                  <button type="button" onClick={() => setBackgroundId('')} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
                    Use default background
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-black/5">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-teal-dark text-white font-medium hover:opacity-90">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
