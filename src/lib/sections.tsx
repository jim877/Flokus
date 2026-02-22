import type { Section } from './supabase'

/** Display order: Focus first, then Flow, then Future */
export const SECTION_ORDER: Section[] = ['this_week', 'primary', 'icebox']

function IconThisWeek() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function IconInbox() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}
function IconLightBulb() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5c-2.4 0-4.2 1.9-4.2 4.3 0 1.3.5 2.5 1.2 3.5v.1c0 .4.2.6.6.6h5.2c.4 0 .6-.2.6-.6v-.1c.7-1 1.2-2.2 1.2-3.5 0-2.4-1.8-4.3-4.2-4.3z" />
      <path d="M9.5 12.5v1.2h5v-1.2" strokeWidth="1" />
      <path d="M9 13.7h6v1.2c0 .6-.5 1.2-1.2 1.2h-3.6c-.7 0-1.2-.6-1.2-1.2v-1.2z" strokeWidth="1" />
      <path d="M12 8.8v1.5M10.8 10.2c.3.3.9.3 1.2 0M12 10.5c.3.3.9.3 1.2 0" strokeWidth="0.8" />
    </svg>
  )
}

export const SECTION_CONFIG: Record<Section, { label: string; Icon: () => JSX.Element }> = {
  this_week: { label: 'Focus', Icon: IconThisWeek },
  primary: { label: 'Flow', Icon: IconInbox },
  icebox: { label: 'Future', Icon: IconLightBulb },
}
