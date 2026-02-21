import { USE_MOCK } from '@/lib/mockData'
import FlokusLogo from './FlokusLogo'

interface TopBarProps {
  userEmail: string
  onSignOut: () => void
  logoSpinning?: boolean
  onOpenSettings?: () => void
}

export default function TopBar({ userEmail, onSignOut, logoSpinning, onOpenSettings }: TopBarProps) {
  return (
    <header className="h-12 flex-shrink-0 flex items-center gap-4 px-4 bg-white/30 dark:bg-white/5 border-b border-[var(--border)] backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className={logoSpinning ? 'inline-block animate-logo-spin' : 'inline-block'}>
          <FlokusLogo className="w-8 h-8 flex-shrink-0" />
        </span>
        <span className="font-semibold text-sm text-[var(--text)]">Flökus</span>
        {USE_MOCK && (
          <span className="text-[10px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-black/5">
            Local
          </span>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
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
