import { useState, useRef, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAllWorkItems } from '@/hooks/useAllWorkItems'
import { useProfiles } from '@/hooks/useProfiles'
import { SECTION_ORDER } from '@/lib/sections'
import type { Section } from '@/lib/supabase'
import type { WorkItem } from '@/lib/supabase'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import WorkspaceList from './WorkspaceList'
import MountainView from './MountainView'
import FocusView from './FocusView'
import FloatingAdd from './FloatingAdd'
import SettingsModal, { BACKGROUND_OPTIONS } from './SettingsModal'

function filterActiveSections(sections: Record<Section, WorkItem[]>): Record<Section, WorkItem[]> {
  return {
    this_week: sections.this_week.filter((i) => i.status !== 'done'),
    primary: sections.primary.filter((i) => i.status !== 'done'),
    icebox: sections.icebox.filter((i) => i.status !== 'done'),
  }
}

export default function Workspace() {
  const { user, signOut } = useAuth()
  const { sections, addItem, updateItem, deleteItem, reorderSection, moveToSection, getProjectChildren } = useAllWorkItems()
  const { profiles, addProfile, updateProfile } = useProfiles()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [backgroundId, setBackgroundId] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem('flokus-bg') || 'zen'
      } catch (_) {}
    }
    return 'zen'
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [logoSpinning, setLogoSpinning] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'mountain'>('mountain')
  const [completingId, setCompletingId] = useState<string | null>(null)
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ideaPillOpen, setIdeaPillOpen] = useState(false)
  const [addToMountainSlotIndex, setAddToMountainSlotIndex] = useState<number | null>(null)
  const [mountainOrder, setMountainOrder] = useState<string[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const s = localStorage.getItem('flokus-mountain-order')
        if (s) return JSON.parse(s) as string[]
      } catch (_) {}
    }
    return []
  })
  const [mountainPrefs, setMountainPrefs] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const s = localStorage.getItem('flokus-mountain-prefs')
        if (s) return JSON.parse(s) as { layers?: number; showFuture?: boolean; showHelp?: boolean }
      } catch (_) {}
    }
    return { layers: 3, showFuture: true, showHelp: true }
  })

  const allItems = SECTION_ORDER.flatMap((s) => sections[s])
  const activeSections = filterActiveSections(sections)
  const searchLower = searchQuery.trim().toLowerCase()
  const filteredSections = useMemo(() => {
    if (!searchLower) return activeSections
    const match = (i: WorkItem) =>
      i.title.toLowerCase().includes(searchLower) ||
      (i.description ?? '').toLowerCase().includes(searchLower)
    return {
      this_week: activeSections.this_week.filter(match),
      primary: activeSections.primary.filter(match),
      icebox: activeSections.icebox.filter(match),
    }
  }, [activeSections, searchLower])
  const selectedItem = selectedId ? allItems.find((i) => i.id === selectedId) ?? null : null
  const allActiveItems = SECTION_ORDER.flatMap((s) => activeSections[s])
  const searchFilteredActive = useMemo(() => {
    if (!searchLower) return allActiveItems
    const match = (i: WorkItem) =>
      i.title.toLowerCase().includes(searchLower) || (i.description ?? '').toLowerCase().includes(searchLower)
    return allActiveItems.filter(match)
  }, [allActiveItems, searchLower])
  const validMountainOrder = useMemo(
    () => mountainOrder.filter((id) => allItems.some((i) => i.id === id)),
    [mountainOrder, allItems]
  )

  const setMountainOrderAndPersist = (order: string[]) => {
    const next = order.slice(0, 16)
    setMountainOrder(next)
    try {
      localStorage.setItem('flokus-mountain-order', JSON.stringify(next))
    } catch (_) {}
  }

  const handleAdd = async (title: string, type: 'task' | 'project', opts?: { select?: boolean; addToMountainSlot?: number }): Promise<string | void> => {
    const newItem = await addItem('primary', {
      type,
      title,
      owner_id: user?.id ?? null,
    })
    if (opts?.addToMountainSlot != null) {
      setMountainOrder((prev) => {
        const next = [...prev]
        next.splice(Math.min(opts!.addToMountainSlot!, next.length), 0, newItem.id)
        const out = next.slice(0, 16)
        try { localStorage.setItem('flokus-mountain-order', JSON.stringify(out)) } catch (_) {}
        return out
      })
      setAddToMountainSlotIndex(null)
      setIdeaPillOpen(false)
    }
    if (opts?.select !== false) {
      setSelectedId(newItem.id)
    }
    setHighlightedId(newItem.id)
    setTimeout(() => setHighlightedId(null), 5000)
    return newItem.id
  }

  const handleMarkDone = (itemId: string) => {
    setSelectedId(null)
    setLogoSpinning(true)
    setTimeout(() => setLogoSpinning(false), 1000)
    setCompletingId(itemId)
    if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current)
    doneTimeoutRef.current = setTimeout(() => {
      doneTimeoutRef.current = null
      setCompletingId(null)
      void updateItem(itemId, { status: 'done' })
    }, 5000)
  }

  const handleUndoDone = () => {
    if (doneTimeoutRef.current) {
      clearTimeout(doneTimeoutRef.current)
      doneTimeoutRef.current = null
    }
    setCompletingId(null)
  }

  const bgClass = BACKGROUND_OPTIONS.find((o) => o.id === backgroundId)?.className ?? 'zen-bg'
  return (
    <div className={`h-screen flex flex-col ${bgClass}`}>
      <TopBar
        userEmail={user?.email ?? ''}
        onSignOut={signOut}
        logoSpinning={logoSpinning}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSectionClick={(sectionId) => {
            setViewMode('list')
            setTimeout(() => document.getElementById('section-' + sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
          }}
          profiles={profiles}
          onAddTeammate={addProfile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchOpen={searchOpen}
          onSearchOpenChange={setSearchOpen}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <main className="flex-1 min-w-0 flex relative">
          {selectedItem ? (
            <FocusView
              item={selectedItem}
              profiles={profiles}
              onClose={() => setSelectedId(null)}
              onUpdate={updateItem}
              onDelete={deleteItem}
              onMarkDone={handleMarkDone}
              getProjectChildren={getProjectChildren}
              onAddSubTask={(title, ownerId) => addItem(selectedItem.section, { type: 'task', title, parent_id: selectedItem.id, owner_id: ownerId })}
            />
          ) : viewMode === 'mountain' ? (
            <div className="flex-1 min-w-0 flex flex-col">
              <MountainView
                mountainOrder={validMountainOrder}
                onMountainOrderChange={setMountainOrderAndPersist}
                allActiveItems={searchFilteredActive}
                allItems={allItems}
                profiles={profiles}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMarkDone={handleMarkDone}
                completingId={completingId}
                getProjectChildren={getProjectChildren}
                onEmptySlotClick={(slotIndex) => { setAddToMountainSlotIndex(slotIndex); setIdeaPillOpen(true) }}
                layers={mountainPrefs.layers ?? 3}
                onLayersChange={(layers) => {
                  setMountainPrefs((p) => {
                    const next = { ...p, layers }
                    try { localStorage.setItem('flokus-mountain-prefs', JSON.stringify(next)) } catch (_) {}
                    return next
                  })
                }}
                showFuture={mountainPrefs.showFuture ?? true}
                onShowFutureChange={(showFuture) => {
                  setMountainPrefs((p) => {
                    const next = { ...p, showFuture }
                    try { localStorage.setItem('flokus-mountain-prefs', JSON.stringify(next)) } catch (_) {}
                    return next
                  })
                }}
                showHelp={mountainPrefs.showHelp ?? true}
                onShowHelpChange={(showHelp) => {
                  setMountainPrefs((p) => {
                    const next = { ...p, showHelp }
                    try { localStorage.setItem('flokus-mountain-prefs', JSON.stringify(next)) } catch (_) {}
                    return next
                  })
                }}
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex flex-col">
              <WorkspaceList
                sections={filteredSections}
                profiles={profiles}
                selectedId={selectedId}
                highlightedId={highlightedId}
                onSelect={setSelectedId}
                onReorderSection={reorderSection}
                onMoveToSection={moveToSection}
                onMarkDone={handleMarkDone}
                completingId={completingId}
              />
            </div>
          )}
        </main>
      </div>
      <FloatingAdd
        onAdd={handleAdd}
        open={ideaPillOpen}
        onOpenChange={(open) => { setIdeaPillOpen(open); if (!open) setAddToMountainSlotIndex(null) }}
        initialAddToMountainSlot={addToMountainSlotIndex}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profiles={profiles}
        onAddTeammate={addProfile}
        onUpdateProfile={updateProfile}
        backgroundId={backgroundId}
        onBackgroundChange={(id) => {
          setBackgroundId(id)
          try { localStorage.setItem('flokus-bg', id) } catch (_) {}
        }}
      />
      {completingId && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-white/95 dark:bg-white/10 backdrop-blur-md border border-[var(--border)] shadow-lg flex items-center gap-3 animate-fade-in"
          role="status"
          style={{ animationDuration: '0.3s' }}
        >
          <span className="text-sm text-[var(--text)]">Done.</span>
          <button
            type="button"
            onClick={handleUndoDone}
            className="px-3 py-1.5 rounded-lg bg-teal-light/20 text-teal-dark text-sm font-medium hover:bg-teal-light/30"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
