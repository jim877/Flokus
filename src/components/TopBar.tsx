import { USE_MOCK } from '@/lib/mockData'
import FlokusLogo from './FlokusLogo'

interface TopBarProps {
  userEmail: string
  onSignOut: () => void
  logoSpinning?: boolean
  onOpenSettings?: () => void
  /** Current flow/organization name – everything in the app is scoped to this flow */
  flowName?: string | null
  /** Optional search – when provided, a subtle search bar is shown in the center of the header */
  searchQuery?: string
  onSearchChange?: (value: string) => void
}

export default function TopBar({ userEmail, onSignOut, logoSpinning, onOpenSettings, flowName, searchQuery = '', onSearchChange }: TopBarProps) {
  return (
    <header className="h-12 flex-shrink-0 flex items-center gap-4 px-4 bg-white/30 dark:bg-white/5 border-b border-[var(--border)] backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className={logoSpinning ? 'inline-block animate-logo-spin' : 'inline-block'}>
          <FlokusLogo className="w-8 h-8 flex-shrink-0" />
        </span>
        <span className="font-semibold text-sm text-[var(--text)] lowercase">fókusz</span>
        {flowName && (
          <span className="text-sm text-[var(--text-muted)] truncate max-w-[180px]" title={flowName}>
            · {flowName}
          </span>
        )}
        {USE_MOCK && (
          <span className="text-[10px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-black/5">
            Local
          </span>
        )}
      </div>
      {onSearchChange && (
        <div className="flex-1 flex justify-center max-w-md mx-2 min-w-0">
          <label className="relative w-full max-w-xs">
            <span className="sr-only">Search</span>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-white/50 dark:bg-white/5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-light/30 focus:border-sage/40"
              aria-label="Search"
            />
          </label>
        </div>
      )}
      {!onSearchChange && <div className="flex-1" />}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-black/5"
            aria-label="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
        <span className="text-xs text-[var(--text-muted)] truncate max-w-[140px]">{userEmail}</span>
        <button
          type="button"
          onClick={onSignOut}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
