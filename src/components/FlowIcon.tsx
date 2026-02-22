import type { FlowIconId } from '@/lib/flows'

interface FlowIconProps {
  icon?: FlowIconId
  className?: string
}

const ICON_SVGS: Record<FlowIconId, (className: string) => JSX.Element> = {
  mountain: (c) => (
    <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l9-9m0 0l4 4M3 21h18M3 21V3m18 18V3" />
    </svg>
  ),
  lightbulb: (c) => (
    <svg className={c} fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5c-2.4 0-4.2 1.9-4.2 4.3 0 1.3.5 2.5 1.2 3.5v.1c0 .4.2.6.6.6h5.2c.4 0 .6-.2.6-.6v-.1c.7-1 1.2-2.2 1.2-3.5 0-2.4-1.8-4.3-4.2-4.3z M9.5 12.5v1.2h5v-1.2 M9 13.7h6v1.2c0 .6-.5 1.2-1.2 1.2h-3.6c-.7 0-1.2-.6-1.2-1.2v-1.2z M12 8.8v1.5" />
    </svg>
  ),
  target: (c) => (
    <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-10C6.5 4 4 6.5 4 10s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6z" />
    </svg>
  ),
  rocket: (c) => (
    <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.63v-3.5l-2-2v-2.5l-2-2H5.5A2.5 2.5 0 013 9.5V6a2 2 0 012-2h.5l2 2h2.5l2 2v2.5l2 2h3.5c.83 0 1.59-.34 2.14-.88M12 2v6m0 0l2-2m-2 2L8 6" />
    </svg>
  ),
  heart: (c) => (
    <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  star: (c) => (
    <svg className={c} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
}

export default function FlowIcon({ icon, className = 'w-4 h-4' }: FlowIconProps) {
  if (!icon || !ICON_SVGS[icon]) return null
  return ICON_SVGS[icon](className)
}

export const FLOW_COLOR_CLASSES: Record<string, { dot: string; border: string; bg: string; text: string; lockButton: string }> = {
  teal: {
    dot: 'bg-teal-dark',
    border: 'border-teal-dark/40',
    bg: 'bg-teal-light/5 dark:bg-teal-light/10',
    text: 'text-teal-dark dark:text-teal-light',
    lockButton: 'border-teal-dark/40 bg-teal-dark/15 text-teal-dark',
  },
  amber: {
    dot: 'bg-amber-500',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-300',
    lockButton: 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200',
  },
  violet: {
    dot: 'bg-violet-500',
    border: 'border-violet-500/50',
    bg: 'bg-violet-500/5 dark:bg-violet-500/10',
    text: 'text-violet-700 dark:text-violet-300',
    lockButton: 'border-violet-500/40 bg-violet-500/15 text-violet-800 dark:text-violet-200',
  },
  rose: {
    dot: 'bg-rose-500',
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/5 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-300',
    lockButton: 'border-rose-500/40 bg-rose-500/15 text-rose-800 dark:text-rose-200',
  },
  sky: {
    dot: 'bg-sky-500',
    border: 'border-sky-500/50',
    bg: 'bg-sky-500/5 dark:bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
    lockButton: 'border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-200',
  },
}
