import { useEffect, useState } from 'react'
import { USE_MOCK, MOCK_USER } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (USE_MOCK) {
      setUser(MOCK_USER as unknown as User)
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (USE_MOCK) return { error: null }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    if (USE_MOCK) return { data: null, error: null }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    return { data, error }
  }

  const signOut = async () => {
    if (USE_MOCK) return
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signUp, signOut }
}
