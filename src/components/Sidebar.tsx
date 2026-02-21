import { SECTION_ORDER, SECTION_CONFIG } from '@/lib/sections'
import { USE_MOCK } from '@/lib/mockData'
import type { Section } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import FlokusLogo from './FlokusLogo'
import TeammatesPanel from './TeammatesPanel'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onSectionClick?: (sectionId: Section) => void
  profiles?: Profile[]
  onAddTeammate?: (name: string, email: string) => void
  searchQuery?: string
  onSearchChange?: (value: string) => void
  searchOpen?: boolean
  onSearchOpenChange?: (open: boolean) => void
  viewMode?: 'list' | 'mountain'
  onViewModeChange?: (mode: 'list' | 'mountain') => void
}

export default function Sidebar({ collapsed, onToggleCollapse, onSectionClick, profiles = [], onAddTeammate, searchQuery = '', onSearchChange, searchOpen, onSearchOpenChange, viewMode = 'mountain', onViewModeChange }: SidebarProps) {
  return (
    <aside
      className={`flex-shrink-0 border-r border-[var(--border)] sidebar-bg backdrop-blur-sm flex flex-col transition-[width] duration-200 ${
        collapsed ? 'w-12' : 'w-40'
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full p-2.5 flex items-center gap-2 min-h-[48px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-none text-left"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <FlokusLogo className="w-7 h-7 mx-auto flex-shrink-0" />
        ) : (
          <>
            <span className="font-semibold text-sm text-[var(--text)] truncate">Flökus</span>
            {USE_MOCK && (
              <span className="text-[10px] text-[var(--text-muted)] px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 flex-shrink-0">
                Local
              </span>
            )}
          </>
        )}
      </button>
      {onSearchOpenChange && (
        <div className={`px-2 py-1 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            type="button"
            onClick={() => onSearchOpenChange(!searchOpen)}
            className={`w-full flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
              collapsed ? 'justify-center p-2' : 'px-2.5 py-2 text-left'
            }`}
            aria-label="Search"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!collapsed && <span>Search</span>}
          </button>
          {searchOpen && !collapsed && (
            <div className="px-1 pb-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search tasks…"
                className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white/60 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-teal-light/30"
                autoFocus
              />
            </div>
          )}
        </div>
      )}
      {onViewModeChange && (
        <div className={`px-2 py-1 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex rounded-lg border border-[var(--border)] bg-black/[0.03] p-0.5 ${collapsed ? 'flex-col' : ''}`}>
            <button type="button" onClick={() => onViewModeChange('mountain')} className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'mountain' ? 'bg-white dark:bg-white/10 text-teal-dark shadow-sm' : 'text-[var(--text-muted)]'}`}>
              {collapsed ? '90' : '90-day'}
            </button>
            <button type="button" onClick={() => onViewModeChange('list')} className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-teal-dark shadow-sm' : 'text-[var(--text-muted)]'}`}>
              List
            </button>
          </div>
        </div>
      )}
      <nav className="flex-1 px-2 py-2 space-y-0.5" aria-label="Sections">
        {SECTION_ORDER.map((sectionId) => {
          const { label, Icon } = SECTION_CONFIG[sectionId]
          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => onSectionClick?.(sectionId)}
              className={`w-full flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                collapsed ? 'justify-center p-2' : 'px-2.5 py-2 text-left'
              }`}
              title={label}
              aria-label={`Go to ${label}`}
            >
              <span className="flex-shrink-0 text-current">
                <Icon />
              </span>
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>
      {onAddTeammate && (
        <TeammatesPanel
          profiles={profiles}
          onAddTeammate={onAddTeammate}
          collapsed={collapsed}
        />
      )}
      <div className={`p-2 border-t border-[var(--border)] ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`rounded-lg p-2 text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text)] transition-colors ${
            collapsed ? 'w-full flex justify-center' : 'w-full flex items-center gap-2'
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
