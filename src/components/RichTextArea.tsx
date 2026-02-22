import { useRef, useEffect } from 'react'

const ALLOWED_TAGS = ['p', 'div', 'br', 'b', 'strong', 'i', 'em', 'ol', 'ul', 'li', 'span']

/** Strip dangerous tags/attrs; leave only formatting tags. */
export function sanitizeTaskHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    if (!ALLOWED_TAGS.includes(tag)) return Array.from(el.childNodes).map(walk).join('')
    const children = Array.from(el.childNodes).map(walk).join('')
    if (tag === 'br') return '<br>'
    return `<${tag}>${children}</${tag}>`
  }
  return walk(doc.body) || ''
}

/** Whether the string looks like HTML we should render (contains our allowed tags). */
export function isFormattedTitle(title: string): boolean {
  if (!title || typeof title !== 'string') return false
  return /<(?:\/?(?:p|div|br|b|strong|i|em|ol|ul|li|span))[\s>]/.test(title) || title.includes('<br')
}

interface RichTextAreaProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
  autoFocus?: boolean
}

export default function RichTextArea({
  value,
  onChange,
  placeholder = 'Task title',
  className = '',
  minHeight = '2.5rem',
  onKeyDown,
  autoFocus = false,
}: RichTextAreaProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const normalized = value || ''
    if (normalized && el.innerHTML !== normalized) el.innerHTML = normalized
    if (!normalized && el.innerHTML !== '') el.innerHTML = ''
  }, [value])

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  const apply = (cmd: string, value?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, value)
    if (ref.current) onChange(ref.current.innerHTML)
  }

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-0.5 flex-wrap">
        <button
          type="button"
          onClick={() => apply('bold')}
          className="p-1.5 rounded border border-transparent hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)]"
          title="Bold"
          aria-label="Bold"
        >
          <span className="font-bold text-sm">B</span>
        </button>
        <button
          type="button"
          onClick={() => apply('insertOrderedList')}
          className="p-1.5 rounded border border-transparent hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)]"
          title="Numbered list"
          aria-label="Numbered list"
        >
          <span className="text-xs font-medium">1.</span>
        </button>
        <button
          type="button"
          onClick={() => apply('insertUnorderedList')}
          className="p-1.5 rounded border border-transparent hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)]"
          title="Bullet list"
          aria-label="Bullet list"
        >
          <span className="text-sm">•</span>
        </button>
        <button
          type="button"
          onClick={() => apply('indent')}
          className="p-1.5 rounded border border-transparent hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)]"
          title="Indent"
          aria-label="Indent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => apply('outdent')}
          className="p-1.5 rounded border border-transparent hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)]"
          title="Outdent"
          aria-label="Outdent"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={onKeyDown}
        data-placeholder={placeholder}
        className="w-full min-h-[2.5rem] max-h-32 overflow-y-auto px-2 py-1.5 rounded border border-[var(--border)] bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-light/40 focus:border-teal-dark/40 empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--text-muted)]"
        style={{ minHeight }}
      />
    </div>
  )
}
