import { useEffect, useState } from 'react'
import { USE_MOCK, MOCK_PROFILES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>(USE_MOCK ? [...MOCK_PROFILES] : [])
  const [loading, setLoading] = useState(!USE_MOCK)

  useEffect(() => {
    if (USE_MOCK) return
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('profiles').select('*')
      if (!cancelled) {
        setProfiles((data as Profile[]) || [])
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const addProfile = (name: string, email: string) => {
    const trimmed = name.trim()
    let initials: string
    if (trimmed) {
      const parts = trimmed.split(/\s+/).filter(Boolean)
      initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : trimmed.slice(0, 2).toUpperCase()
    } else {
      initials = email.slice(0, 2).toUpperCase()
    }
    const newProfile: Profile = {
      id: uuid(),
      name: name.trim() || null,
      email: email.trim(),
      avatar_url: null,
      initials,
      short_name: null,
    }
    setProfiles((prev) => [...prev, newProfile])
    return newProfile
  }

  const updateProfile = (id: string, updates: Partial<Pick<Profile, 'name' | 'avatar_url' | 'initials' | 'short_name'>>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  return { profiles, loading, addProfile, updateProfile }
}
