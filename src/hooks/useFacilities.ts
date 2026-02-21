import { useEffect, useState } from 'react'
import { USE_MOCK, MOCK_FACILITIES } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import type { Facility } from '@/lib/supabase'

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>(USE_MOCK ? MOCK_FACILITIES : [])
  const [loading, setLoading] = useState(!USE_MOCK)

  useEffect(() => {
    if (USE_MOCK) return
    let cancelled = false
    async function load() {
      const { data } = await supabase.from('facilities').select('*').order('name')
      if (!cancelled) {
        setFacilities((data as Facility[]) || [])
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { facilities, loading }
}
