/**
 * Mock data for local development without Supabase.
 * Set VITE_USE_MOCK=true in .env, or leave VITE_SUPABASE_URL unset, to use this.
 */

import type { WorkItem, Profile, Facility } from './supabase'

export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_SUPABASE_URL

export const MOCK_USER_ID = 'dev-user-1'
export const MOCK_USER_EMAIL = 'you@local.dev'

/** Minimal user-like object for mock auth (matches what components use: id, email) */
export const MOCK_USER = {
  id: MOCK_USER_ID,
  email: MOCK_USER_EMAIL,
}

const now = () => new Date().toISOString()

export const MOCK_PROFILES: Profile[] = [
  {
    id: MOCK_USER_ID,
    name: 'You',
    email: MOCK_USER_EMAIL,
    avatar_url: null,
    initials: 'YO',
    short_name: null,
  },
]

export const MOCK_FACILITIES: Facility[] = [
  { id: 'f1', name: 'New York City' },
  { id: 'f2', name: 'Remote' },
  { id: 'f3', name: 'Other' },
]

function seedWorkItems(): WorkItem[] {
  return [
    {
      id: 'mock-0',
      type: 'task',
      title: 'Ship collapsible sidebar',
      description: null,
      parent_id: null,
      position: 0,
      section: 'this_week',
      due_date: new Date().toISOString().slice(0, 10),
      priority: 'high',
      facility_id: null,
      owner_id: MOCK_USER_ID,
      is_private: false,
      status: 'todo',
      attachments: [],
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'mock-1',
      type: 'task',
      title: 'Review TaskFlow design',
      description: 'Check layout and flows with the team.',
      parent_id: null,
      position: 0,
      section: 'primary',
      due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      priority: 'high',
      facility_id: 'f1',
      owner_id: MOCK_USER_ID,
      is_private: false,
      status: 'todo',
      attachments: [],
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'mock-2',
      type: 'task',
      title: 'Add dark mode toggle',
      description: null,
      parent_id: null,
      position: 1,
      section: 'primary',
      due_date: null,
      priority: 'medium',
      facility_id: null,
      owner_id: null,
      is_private: false,
      status: 'todo',
      attachments: [],
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'mock-3',
      type: 'project',
      title: 'Phase 2: This Week & IceBox',
      description: 'Sections and filters.',
      parent_id: null,
      position: 2,
      section: 'primary',
      due_date: null,
      priority: 'low',
      facility_id: null,
      owner_id: MOCK_USER_ID,
      is_private: false,
      status: 'todo',
      attachments: [],
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'mock-4',
      type: 'task',
      title: 'Backlog: PWA offline support',
      description: null,
      parent_id: null,
      position: 0,
      section: 'icebox',
      due_date: null,
      priority: 'low',
      facility_id: null,
      owner_id: null,
      is_private: false,
      status: 'todo',
      attachments: [],
      created_at: now(),
      updated_at: now(),
    },
  ]
}

export { seedWorkItems }
