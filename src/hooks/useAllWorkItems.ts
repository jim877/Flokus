import { useEffect, useState, useMemo } from 'react'
import { USE_MOCK, seedWorkItems } from '@/lib/mockData'
import { supabase } from '@/lib/supabase'
import type { WorkItem, WorkItemInsert, WorkItemUpdate } from '@/lib/supabase'
import { SECTION_ORDER } from '@/lib/sections'
import type { Section } from '@/lib/supabase'

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
const now = () => new Date().toISOString()

function groupBySection(items: WorkItem[]): Record<Section, WorkItem[]> {
  const out: Record<Section, WorkItem[]> = {
    this_week: [],
    primary: [],
    icebox: [],
  }
  items
    .filter((i) => !i.parent_id)
    .forEach((i) => {
      out[i.section].push(i)
    })
  SECTION_ORDER.forEach((s) => {
    out[s].sort((a, b) => a.position - b.position)
  })
  return out
}

export function useAllWorkItems() {
  const [items, setItems] = useState<WorkItem[]>(() =>
    USE_MOCK ? seedWorkItems() : []
  )
  const [loading, setLoading] = useState(!USE_MOCK)
  const [error, setError] = useState<Error | null>(null)

  const sections = useMemo(() => groupBySection(items), [items])

  const getProjectChildren = (parentId: string): WorkItem[] =>
    items.filter((i) => i.parent_id === parentId).sort((a, b) => a.position - b.position)

  useEffect(() => {
    if (USE_MOCK) return
    const fetch = async () => {
      setLoading(true)
      const { data, error: e } = await supabase
        .from('work_items')
        .select('*')
        .is('parent_id', null)
        .order('section')
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
  }, [])

  useEffect(() => {
    if (USE_MOCK) return
    const channel = supabase
      .channel('work_items:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems((prev) => [...prev, payload.new as WorkItem].sort((a, b) => a.section.localeCompare(b.section) || a.position - b.position))
        } else if (payload.eventType === 'UPDATE') {
          setItems((prev) =>
            prev.map((i) => (i.id === (payload.new as WorkItem).id ? (payload.new as WorkItem) : i))
          )
        } else if (payload.eventType === 'DELETE') {
          setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id))
        }
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const addItem = async (section: Section, input: Omit<WorkItemInsert, 'section'>): Promise<WorkItem> => {
    const parentId = input.parent_id ?? null
    const list = parentId
      ? items.filter((i) => i.parent_id === parentId)
      : sections[section]
    const position = list.length
    if (USE_MOCK) {
      const newItem: WorkItem = {
        id: uuid(),
        type: input.type ?? 'task',
        title: input.title,
        description: input.description ?? null,
        parent_id: input.parent_id ?? null,
        position,
        section,
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
      setItems((prev) => [...prev, newItem].sort((a, b) => a.section.localeCompare(b.section) || a.position - b.position))
      return newItem
    }
    const { data, error: e } = await supabase
      .from('work_items')
      .insert({ ...input, section, position })
      .select()
      .single()
    if (e) throw e
    return data as WorkItem
  }

  const updateItem = async (id: string, update: WorkItemUpdate): Promise<WorkItem | undefined> => {
    if (USE_MOCK) {
      let updated: WorkItem | undefined
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? (updated = { ...i, ...update, updated_at: now() } as WorkItem) : i
        )
      )
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

  const reorderSection = async (section: Section, orderedItems: WorkItem[]): Promise<void> => {
    const orderedIds = new Set(orderedItems.map((o) => o.id))
    const mergeRest = (prev: WorkItem[]) => {
      const others = prev.filter((i) => i.section !== section)
      const inSection = prev.filter((i) => i.section === section)
      const rest = inSection.filter((i) => !orderedIds.has(i.id))
      const updated = orderedItems.map((item, i) => ({ ...item, section, position: i }))
      const restWithPosition = rest.map((item, i) => ({ ...item, position: updated.length + i }))
      return [...others, ...updated, ...restWithPosition].sort((a, b) => a.section.localeCompare(b.section) || a.position - b.position)
    }
    if (USE_MOCK) {
      setItems(mergeRest)
      return
    }
    for (let i = 0; i < orderedItems.length; i++) {
      await supabase
        .from('work_items')
        .update({ section, position: i, updated_at: new Date().toISOString() })
        .eq('id', orderedItems[i].id)
    }
    setItems(mergeRest)
  }

  const moveToSection = async (id: string, targetSection: Section): Promise<void> => {
    const targetList = sections[targetSection]
    const newPosition = targetList.length
    await updateItem(id, { section: targetSection, position: newPosition })
    if (!USE_MOCK) {
      setItems((prev) => {
        const item = prev.find((i) => i.id === id)
        if (!item) return prev
        const without = prev.filter((i) => i.id !== id)
        const updated = { ...item, section: targetSection, position: newPosition }
        return [...without, updated].sort((a, b) => a.section.localeCompare(b.section) || a.position - b.position)
      })
    }
  }

  return {
    items,
    sections,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    reorderSection,
    moveToSection,
    getProjectChildren,
    setItems,
  }
}
