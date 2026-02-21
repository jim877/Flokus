import { useEffect, useState } from 'react'
import { USE_MOCK, seedWorkItems } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import type { WorkItem, WorkItemInsert, WorkItemUpdate } from '@/lib/supabase'

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const now = () => new Date().toISOString()

export function useWorkItems(section: 'primary' | 'this_week' | 'icebox' = 'primary') {
  const [items, setItems] = useState<WorkItem[]>(() =>
    USE_MOCK ? seedWorkItems().filter((i) => i.section === section).sort((a, b) => a.position - b.position) : []
  )
  const [loading, setLoading] = useState(!USE_MOCK)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (USE_MOCK) return
    const fetch = async () => {
      setLoading(true)
      const { data, error: e } = await supabase
        .from('work_items')
        .select('*')
        .is('parent_id', null)
        .eq('section', section)
        .order('position', { ascending: true })
      if (e) {
        setError(e as Error)
        setItems([])
      } else {
        setItems((data as WorkItem[]) || [])
      }
      setLoading(false)
    }
    fetch()
  }, [section])

  useEffect(() => {
    if (USE_MOCK) return
    const channel = supabase
      .channel(`work_items:${section}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_items', filter: `section=eq.${section}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => {
              const next = [...prev, payload.new as WorkItem].sort((a, b) => a.position - b.position)
              return next
            })
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((i) => (i.id === (payload.new as WorkItem).id ? (payload.new as WorkItem) : i)).sort((a, b) => a.position - b.position)
            )
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id))
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [section])

  const addItem = async (input: WorkItemInsert): Promise<WorkItem> => {
    if (USE_MOCK) {
      const newItem: WorkItem = {
        id: uuid(),
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        parent_id: input.parent_id ?? null,
        position: items.length,
        section: input.section ?? 'primary',
        due_date: input.due_date ?? null,
        priority: input.priority ?? 'medium',
        facility_id: input.facility_id ?? null,
        owner_id: input.owner_id ?? null,
        is_private: input.is_private ?? false,
        status: input.status ?? 'todo',
        attachments: input.attachments ?? [],
        created_at: now(),
        updated_at: now(),
      }
      setItems((prev) => [...prev, newItem].sort((a, b) => a.position - b.position))
      return newItem
    }
    const { data: max } = await supabase
      .from('work_items')
      .select('position')
      .eq('section', input.section ?? 'primary')
      .is('parent_id', null)
      .order('position', { ascending: false })
      .limit(1)
      .single()
    const position = (max?.position ?? -1) + 1
    const { data, error: e } = await supabase
      .from('work_items')
      .insert({ ...input, section: input.section ?? 'primary', position })
      .select()
      .single()
    if (e) throw e
    return data as WorkItem
  }

  const updateItem = async (id: string, update: WorkItemUpdate): Promise<WorkItem | undefined> => {
    if (USE_MOCK) {
      let updated: WorkItem | undefined
      setItems((prev) => {
        const next = prev.map((i) =>
          i.id === id ? (updated = { ...i, ...update, updated_at: now() } as WorkItem) : i
        ) as WorkItem[]
        return next
      })
      return updated
    }
    const { data, error: e } = await supabase
      .from('work_items')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (e) throw e
    return data as WorkItem
  }

  const deleteItem = async (id: string): Promise<void> => {
    if (USE_MOCK) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      return
    }
    await supabase.from('work_items').delete().eq('id', id)
  }

  const reorder = async (orderedItems: WorkItem[]): Promise<void> => {
    if (USE_MOCK) {
      setItems(orderedItems.map((item, i) => ({ ...item, position: i })))
      return
    }
    const updates = orderedItems.map((item, index) => ({ id: item.id, position: index }))
    for (const u of updates) {
      await supabase.from('work_items').update({ position: u.position, updated_at: new Date().toISOString() }).eq('id', u.id)
    }
    setItems(orderedItems.map((item, i) => ({ ...item, position: i })))
  }

  return { items, loading, error, addItem, updateItem, deleteItem, reorder, setItems }
}
