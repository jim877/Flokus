import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasSupabase = Boolean(url && anonKey)
if (!hasSupabase) {
  console.warn('TaskFlow: No Supabase env — using local mock data. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect.')
}

// Use placeholder URL when missing so createClient() doesn't throw; mock mode never calls it.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type WorkItemType = 'task' | 'project'
export type Section = 'this_week' | 'primary' | 'icebox'
export type Priority = 'high' | 'medium' | 'low'
export type Status = 'todo' | 'in_progress' | 'done'

export interface Profile {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  initials: string | null
  short_name: string | null
  created_at?: string
  updated_at?: string
}

export interface Facility {
  id: string
  name: string
  created_at?: string
}

export interface WorkItem {
  id: string
  type: WorkItemType
  title: string
  description: string | null
  parent_id: string | null
  position: number
  section: Section
  due_date: string | null
  priority: Priority
  facility_id: string | null
  owner_id: string | null
  /** When set, multiple assignees; otherwise owner_id is the single assignee */
  assignee_ids?: string[]
  is_private: boolean
  status: Status
  attachments: string[]
  created_at: string
  updated_at: string
}

export interface WorkItemInsert {
  type: WorkItemType
  title: string
  description?: string | null
  parent_id?: string | null
  position?: number
  section?: Section
  due_date?: string | null
  priority?: Priority
  facility_id?: string | null
  owner_id?: string | null
  assignee_ids?: string[]
  is_private?: boolean
  status?: Status
  attachments?: string[]
}

export interface WorkItemUpdate {
  title?: string
  description?: string | null
  type?: WorkItemType
  parent_id?: string | null
  position?: number
  section?: Section
  due_date?: string | null
  priority?: Priority
  facility_id?: string | null
  owner_id?: string | null
  assignee_ids?: string[]
  is_private?: boolean
  status?: Status
  attachments?: string[]
  updated_at?: string
}
