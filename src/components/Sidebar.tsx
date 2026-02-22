import { SECTION_ORDER, SECTION_CONFIG } from '@/lib/sections'
import type { Section } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import type { Flow } from '@/lib/flows'
import FlokusLogo from './FlokusLogo'
import { FLOW_COLOR_CLASSES } from './FlowIcon'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onSectionClick?: (sectionId: Section) => void
  flows?: Flow[]
  currentFlowId?: string
  onFlowChange?: (flowId: string) => void
  /** When user clicks to lock the flow (planning → committed) */
  onLockFlowClick?: (flowId: string) => void
  /** When user clicks to unlock the flow (committed → planning) */
  onUnlockFlowClick?: (flowId: string) => void
  /** Current flow is locked (show Unlock in tray) */
  flowIsLocked?: boolean
  /** Current flow can be locked (show Lock in tray) */
  canLockFlow?: boolean
  /** When user clicks to edit flow identity (icon, color, background) */
  onEditFlowClick?: (flowId: string) => void
  onAddFlowClick?: () => void
  onMeetingClick?: () => void
  activeSectionId?: Section | null
  /** When true, flash the Future section button (e.g. after depositing a new idea) */
  futureSectionFlash?: boolean
  profiles?: Profile[]
  onAddTeammate?: (name: string, email: string) => void
  searchQuery?: string
  onSearchChange?: (value: string) => void
  searchOpen?: boolean
  onSearchOpenChange?: (open: boolean) => void
  viewMode?: 'list' | 'mountain'
  onViewModeChange?: (mode: 'list' | 'mountain') => void
}

export default function Sidebar({ collapsed, onToggleCollapse, onSectionClick, flows = [], currentFlowId = '', onFlowChange, onLockFlowClick, onUnlockFlowClick, flowIsLocked = false, canLockFlow = false, onEditFlowClick, onAddFlowClick, onMeetingClick, activeSectionId, futureSectionFlash = false, profiles: _profiles = [], onAddTeammate: _onAddTeammate, searchQuery = '', onSearchChange, searchOpen, onSearchOpenChange, viewMode = 'mountain', onViewModeChange }: SidebarProps) {
  return (
    <aside
      className={`flex-shrink-0 border-r border-[var(--border)] sidebar-bg backdrop-blur-sm flex flex-col transition-[width] duration-200 overflow-y-auto ${
        collapsed ? 'w-16' : 'w-40'
      }`}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full p-2.5 flex items-center justify-center min-h-[48px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-none"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <FlokusLogo className={`flex-shrink-0 ${collapsed ? 'w-7 h-7' : 'w-8 h-8'}`} />
      </button>
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
      {onFlowChange && (
        <div className={`py-1 ${collapsed ? 'flex flex-col items-center px-1.5' : 'px-2'}`}>
          {collapsed ? (
            <div className="w-6 border-t border-[var(--border)] my-0.5" aria-hidden />
          ) : (
            <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider px-2.5 pb-1">
              Flows
            </div>
          )}
          {onAddFlowClick && (
            <button
              type="button"
              onClick={onAddFlowClick}
              className={`w-full flex items-center gap-2 rounded-lg text-sm font-medium text-teal-dark hover:bg-teal-light/20 transition-colors ${collapsed ? 'justify-center p-2' : 'px-2.5 py-2 text-left'}`}
              title="New 90-day flow"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {!collapsed && <span>New flow</span>}
            </button>
          )}
          {flows.length > 0 && (
          <div className="space-y-0.5 mt-0.5">
            {flows.map((f) => {
              const isCurrent = currentFlowId === f.id
              const theme = (f.colorTheme && FLOW_COLOR_CLASSES[f.colorTheme]) ? FLOW_COLOR_CLASSES[f.colorTheme] : FLOW_COLOR_CLASSES.teal
              const letter = (f.name.trim().charAt(0) || 'F').toUpperCase()
              const badgeBg = isCurrent ? theme.dot : theme.dot + ' opacity-70'
              return (
                <div
                  key={f.id}
                  className={`w-full rounded-lg text-sm font-medium transition-colors ${isCurrent ? `${theme.bg} ${theme.text}` : 'text-[var(--text-muted)]'} ${collapsed ? 'flex flex-col items-center justify-center p-1.5' : 'flex items-center gap-2 min-w-0 px-2.5 py-2'}`}
                >
                  <button
                    type="button"
                    onClick={() => onFlowChange(f.id)}
                    className={`flex items-center gap-2 min-w-0 flex-1 text-left rounded-lg transition-colors ${collapsed ? 'flex flex-col p-0' : ''} ${isCurrent ? 'font-semibold' : 'hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                    title={f.name}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs leading-none ${badgeBg}`} aria-hidden>
                      {letter}
                    </span>
                    {!collapsed && <span className="truncate flex-1 min-w-0">{f.name}</span>}
                  </button>
                  {!collapsed && onEditFlowClick && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEditFlowClick(f.id) }}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-black/5 flex-shrink-0"
                      aria-label="Edit flow"
                      title="Edit flow identity"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          )}
          {!collapsed && currentFlowId && (canLockFlow || flowIsLocked) && (
            <div className="mt-2 pt-2 border-t border-[var(--border)]">
              {flowIsLocked && onUnlockFlowClick ? (
                <button
                  type="button"
                  onClick={() => onUnlockFlowClick(currentFlowId)}
                  className="w-full flex items-center gap-2 rounded-lg text-sm font-medium border-2 border-amber-500/50 bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 transition-colors px-2.5 py-2 text-left"
                  title="Flow is locked (committed). Unlock to edit project list"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <span>Unlock</span>
                </button>
              ) : canLockFlow && onLockFlowClick ? (
                <button
                  type="button"
                  onClick={() => onLockFlowClick(currentFlowId)}
                  className="w-full flex items-center gap-2 rounded-lg text-sm font-medium text-teal-dark hover:bg-teal-light/20 transition-colors px-2.5 py-2 text-left"
                  title="Lock flow to start your 90-day quarter"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Lock for quarter</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}
      {flows.length > 0 && onMeetingClick && (
        <div className={`px-2 py-1 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            type="button"
            onClick={onMeetingClick}
            className={`w-full flex items-center gap-2 rounded-lg text-sm font-medium text-teal-dark hover:bg-teal-light/20 transition-colors ${
              collapsed ? 'justify-center p-2' : 'px-2.5 py-2 text-left'
            }`}
            title="Meeting for this flow"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {!collapsed && <span>Meeting</span>}
          </button>
        </div>
      )}
      <nav className="flex-1 px-2 py-2 space-y-0.5 min-h-0 overflow-auto" aria-label="Sections">
        {SECTION_ORDER.filter((id) => id === 'icebox').map((sectionId) => {
          const { label, Icon } = SECTION_CONFIG[sectionId]
          const isActive = activeSectionId === sectionId && viewMode === 'list'
          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => onSectionClick?.(sectionId)}
              className={`w-full flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-teal-light/20 text-teal-dark' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5'
              } ${futureSectionFlash ? 'future-section-flash' : ''} ${collapsed ? 'justify-center p-2' : 'px-2.5 py-2 text-left'}`}
              title={label}
              aria-label={`Go to ${label}`}
            >
              <span className={`flex-shrink-0 text-current ${futureSectionFlash ? 'future-icon-strobe' : ''}`}>
                <Icon />
              </span>
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}
      </nav>
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
