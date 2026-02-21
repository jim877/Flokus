import { useState, useRef, useEffect } from 'react'
import type { WorkItemType } from '@/lib/supabase'
import LightBulbIcon from './LightBulbIcon'

interface FloatingAddProps {
  onAdd: (title: string, type: WorkItemType, opts?: { select?: boolean; addToMountainSlot?: number }) => Promise<string | void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialAddToMountainSlot?: number | null
}

const ENTER_CLOSE_MS = 400

export default function FloatingAdd({ onAdd, open: controlledOpen, onOpenChange, initialAddToMountainSlot }: FloatingAddProps) {
  const [title, setTitle] = useState('')
  const [toast, setToast] = useState(false)
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

  const [addAsProject, setAddAsProject] = useState(false)

  const ingest = async (text: string, asProject?: boolean) => {
    const t = text.trim()
    if (!t) return
    await onAdd(t, asProject ? 'project' : 'task', { select: false, addToMountainSlot: initialAddToMountainSlot ?? undefined })
    setTitle('')
    setToast(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await ingest(title, addAsProject)
    setOpen(false)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const dt = e.clipboardData
    if (!dt) return
    const url = dt.getData('text/uri-list')?.trim()
    const text = dt.getData('text/plain')?.trim()
    if (url && !title) {
      e.preventDefault()
      ingest(url, addAsProject)
      setOpen(false)
      return
    }
    if (dt.files.length > 0 && !title) {
      e.preventDefault()
      const file = dt.files[0]
      const name = file.name || (file.type.startsWith('image/') ? 'Image' : 'File')
      ingest(`[${name}]`, addAsProject)
      setOpen(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dt = e.dataTransfer
    const url = dt.getData('text/uri-list')?.trim()
    const text = dt.getData('text/plain')?.trim()
    if (url) {
      ingest(url, addAsProject)
      setOpen(false)
      return
    }
    if (dt.files.length > 0) {
      const file = dt.files[0]
      ingest(`[${file.name || (file.type.startsWith('image/') ? 'Image' : 'File')}]`, addAsProject)
      setOpen(false)
      return
    }
    if (text) {
      ingest(text, addAsProject)
      setOpen(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  return (
    <>
      <div
        ref={containerRef}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 flex justify-center"
      >
        {!open ? (
          <button
            type="button"
            onClick={() => {
              setOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-white/75 dark:bg-white/10 border border-[var(--border)] text-[var(--text-muted)] hover:text-teal-dark hover:border-sage/40 hover:bg-white/90 shadow-[0_4px_14px_rgba(61,107,107,0.12)] backdrop-blur-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-light/40 focus:ring-offset-0"
            aria-label="Add an idea"
          >
            <LightBulbIcon className="w-10 h-10" />
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full rounded-2xl bg-white/75 dark:bg-white/10 border border-[var(--border)] shadow-[0_4px_14px_rgba(61,107,107,0.1)] backdrop-blur-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-light/40 focus-within:border-sage/50 transition-all"
          >
            <div className="flex items-center gap-3 px-4 py-2.5">
              <LightBulbIcon className="w-8 h-8 flex-shrink-0" />
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
                placeholder="drop your next great idea here"
                className="flex-1 min-w-0 py-2 bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none"
                aria-label="Add an idea"
              />
              <div className="flex rounded-lg border border-[var(--border)] bg-black/[0.03] dark:bg-white/[0.06] p-0.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setAddAsProject(false)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${!addAsProject ? 'bg-white dark:bg-white/10 text-teal-dark shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setAddAsProject(true)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${addAsProject ? 'bg-white dark:bg-white/10 text-teal-dark shadow-sm' : 'text-[var(--text-muted)]'}`}
                >
                  Project
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setTitle('') }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </div>
      {toast && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/40 text-[var(--text-muted)] text-sm animate-fade-in shadow-md"
          role="status"
        >
          Closer to done…
        </div>
      )}
    </>
  )
}
