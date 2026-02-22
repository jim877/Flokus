import { useState, useRef, useEffect } from 'react'
import type { WorkItemType } from '@/lib/supabase'
import FlokusLogo from './FlokusLogo'

interface FloatingAddProps {
  onAdd: (title: string, type: WorkItemType, opts?: { select?: boolean; addToMountainSlot?: number }) => Promise<string | void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialAddToMountainSlot?: number | null
  /** When true, pill stays open after adding (e.g. in mountain/edit mode for quick entry) */
  keepOpenAfterAdd?: boolean
  /** When user has multiple flows, ideas are assigned to this flow – shown in the pill for clarity */
  flowName?: string | null
  hasMultipleFlows?: boolean
}

const ENTER_CLOSE_MS = 400

export default function FloatingAdd({ onAdd, open: controlledOpen, onOpenChange, initialAddToMountainSlot, keepOpenAfterAdd: keepOpenProp, flowName, hasMultipleFlows }: FloatingAddProps) {
  const [title, setTitle] = useState('')
  const [toast, setToast] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const lastEnterRef = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (v: boolean) => { onOpenChange?.(v); if (controlledOpen === undefined) setInternalOpen(v) }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const keepOpenAfterAdd = initialAddToMountainSlot != null || keepOpenProp === true

  const ingest = async (text: string) => {
    const t = text.trim()
    if (!t) return
    await onAdd(t, 'project', { select: false, addToMountainSlot: initialAddToMountainSlot ?? undefined })
    setTitle('')
    setToast(true)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)
    if (!keepOpenAfterAdd) setOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await ingest(title)
    if (!keepOpenAfterAdd) setOpen(false)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const dt = e.clipboardData
    if (!dt) return
    const url = dt.getData('text/uri-list')?.trim()
    const text = dt.getData('text/plain')?.trim()
    if (url && !title) {
      e.preventDefault()
      ingest(url)
      if (!keepOpenAfterAdd) setOpen(false)
      return
    }
    if (dt.files.length > 0 && !title) {
      e.preventDefault()
      const file = dt.files[0]
      const name = file.name || (file.type.startsWith('image/') ? 'Image' : 'File')
      ingest(`[${name}]`)
      if (!keepOpenAfterAdd) setOpen(false)
      return
    }
    if (text && !title) {
      e.preventDefault()
      ingest(text)
      if (!keepOpenAfterAdd) setOpen(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dt = e.dataTransfer
    const url = dt.getData('text/uri-list')?.trim()
    const _text = dt.getData('text/plain')?.trim()
    if (url) {
      ingest(url)
      if (!keepOpenAfterAdd) setOpen(false)
      return
    }
    if (dt.files.length > 0) {
      const file = dt.files[0]
      ingest(`[${file.name || (file.type.startsWith('image/') ? 'Image' : 'File')}]`)
      if (!keepOpenAfterAdd) setOpen(false)
      return
    }
    if (_text) {
      ingest(_text)
      if (!keepOpenAfterAdd) setOpen(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), initialAddToMountainSlot != null ? 80 : 50)
  }, [open, initialAddToMountainSlot])

  return (
    <>
      <div
        ref={containerRef}
        className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 sm:max-w-2xl sm:px-4 flex justify-center"
      >
        {!open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            className="flex items-center gap-2 rounded-full pl-2.5 pr-4 py-2 bg-white/75 dark:bg-white/10 border border-[var(--border)] text-[var(--text-muted)] hover:text-teal-dark hover:border-sage/40 hover:bg-white/90 shadow-[0_4px_14px_rgba(61,107,107,0.12)] backdrop-blur-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-light/40 focus:ring-offset-0"
            aria-label="Add an idea"
          >
            <FlokusLogo className="w-8 h-8 flex-shrink-0" />
            <span className="text-sm font-medium">Add idea</span>
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`w-full min-w-0 rounded-full flex items-center gap-2 pl-2.5 pr-2 py-1.5 bg-white/75 dark:bg-white/10 border-2 border-teal-dark/40 shadow-[0_4px_14px_rgba(61,107,107,0.15)] backdrop-blur-xl overflow-hidden ring-2 ring-teal-light/50 transition-all ${justAdded ? 'idea-pill-just-added' : ''}`}
          >
            {hasMultipleFlows && flowName && (
              <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap hidden sm:inline">Adding to {flowName}</span>
            )}
            <button
              type="button"
              onClick={() => { setOpen(false); setTitle('') }}
              className="flex-shrink-0 p-1 rounded-full text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-teal-dark transition-colors"
              aria-label="Close"
            >
              <FlokusLogo className="w-7 h-7" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false)
                  setTitle('')
                  return
                }
                if (e.key === 'Enter' && !title.trim()) {
                  e.preventDefault()
                  const now = Date.now()
                  if (now - lastEnterRef.current <= ENTER_CLOSE_MS) {
                    setOpen(false)
                    setTitle('')
                    lastEnterRef.current = 0
                    return
                  }
                  lastEnterRef.current = now
                }
              }}
              placeholder={initialAddToMountainSlot != null ? 'Next project…' : hasMultipleFlows && flowName ? `Add to ${flowName}…` : 'Add an idea…'}
              className="focus-glow flex-1 min-w-0 py-1.5 bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm rounded-lg px-2 border-0"
              aria-label={initialAddToMountainSlot != null ? 'Add your next most important project here' : hasMultipleFlows && flowName ? `Add an idea to ${flowName}` : 'Add an idea'}
            />
          </form>
        )}
      </div>
      {toast && (
        <div
          className="fixed top-20 right-6 z-50 px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-[var(--border)] text-[var(--text-muted)] text-sm animate-fade-in shadow-lg"
          role="status"
        >
          Closer to done…
        </div>
      )}
    </>
  )
}
