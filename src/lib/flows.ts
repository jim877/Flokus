/** Flow status: New = just created, not set up. Active = set up and counting down (locked). */
export type FlowStatus = 'new' | 'active'

/** Flow color theme id for sidebar and identity */
export type FlowColorTheme = 'teal' | 'amber' | 'violet' | 'rose' | 'sky'

/** Flow icon id for sidebar and identity */
export type FlowIconId = 'mountain' | 'lightbulb' | 'target' | 'rocket' | 'heart' | 'star'

/** A 90-day flow: can be synced to a quarter or async. When active/locked, project list is fixed. */
export interface Flow {
  id: string
  name: string
  /** New = not yet set up; Active = set up and counting down (locked) */
  status?: FlowStatus
  /** Quarter start (YYYY-MM-DD); set when syncMode is 'quarter' */
  quarterStart?: string
  /** Quarter end (YYYY-MM-DD); set when syncMode is 'quarter' or 'async' (async = today + 90) */
  quarterEnd?: string
  /** When true, cannot add/remove/reorder projects on the mountain (active flows are locked) */
  isLocked?: boolean
  /** 'quarter' = aligned to calendar quarter; 'async' = 90 days from start */
  syncMode?: 'quarter' | 'async'
  /** Optional icon for flow identity */
  icon?: FlowIconId
  /** Optional color theme for flow identity */
  colorTheme?: FlowColorTheme
  /** Optional background id (e.g. 'zen' | 'warm' | 'cool') when this flow is active */
  backgroundId?: string
}

export const FLOWS_STORAGE_KEY = 'flokus-flows'

export function createFlowId(): string {
  return 'flow-' + Math.random().toString(36).slice(2, 11)
}

export const FLOW_COLOR_THEMES: FlowColorTheme[] = ['teal', 'amber', 'violet', 'rose', 'sky']
export const FLOW_ICON_IDS: FlowIconId[] = ['mountain', 'lightbulb', 'target', 'rocket', 'heart', 'star']

function isValidColorTheme(v: unknown): v is FlowColorTheme {
  return typeof v === 'string' && FLOW_COLOR_THEMES.includes(v as FlowColorTheme)
}
function isValidIconId(v: unknown): v is FlowIconId {
  return typeof v === 'string' && FLOW_ICON_IDS.includes(v as FlowIconId)
}

/** Migrate legacy flow shape (just id/name) to full Flow */
export function normalizeFlow(raw: { id: string; name: string; [k: string]: unknown }): Flow {
  const isLocked = Boolean(raw.isLocked)
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status === 'active' || raw.status === 'new' ? raw.status : (isLocked ? 'active' : 'new'),
    quarterStart: typeof raw.quarterStart === 'string' ? raw.quarterStart : undefined,
    quarterEnd: typeof raw.quarterEnd === 'string' ? raw.quarterEnd : undefined,
    isLocked,
    syncMode: raw.syncMode === 'quarter' || raw.syncMode === 'async' ? raw.syncMode : undefined,
    icon: isValidIconId(raw.icon) ? raw.icon : undefined,
    colorTheme: isValidColorTheme(raw.colorTheme) ? raw.colorTheme : undefined,
    backgroundId: typeof raw.backgroundId === 'string' ? raw.backgroundId : undefined,
  }
}
