import { useState, useRef, useMemo, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAllWorkItems } from '@/hooks/useAllWorkItems'
import { useProfiles } from '@/hooks/useProfiles'
import { SECTION_ORDER } from '@/lib/sections'
import type { Section } from '@/lib/supabase'
import type { WorkItem } from '@/lib/supabase'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import FlowListView from './FlowListView'
import FutureListView from './FutureListView'
import MountainView, { MOUNTAIN_LAYOUTS } from './MountainView'
import FocusView from './FocusView'
import DrawerItemView from './DrawerItemView'
import MeetingView from './MeetingView'
import FloatingAdd from './FloatingAdd'
import SettingsModal, { BACKGROUND_OPTIONS, type MeetingCadence } from './SettingsModal'
import CreateFlowModal from './CreateFlowModal'
import FlowEditModal from './FlowEditModal'
import type { Flow } from '@/lib/flows'
import { FLOWS_STORAGE_KEY, normalizeFlow } from '@/lib/flows'

function filterActiveSections(sections: Record<Section, WorkItem[]>): Record<Section, WorkItem[]> {
  return {
    this_week: sections.this_week.filter((i) => i.status !== 'done'),
    primary: sections.primary.filter((i) => i.status !== 'done'),
    icebox: sections.icebox.filter((i) => i.status !== 'done'),
  }
}

export default function Workspace() {
  const { user, signOut } = useAuth()
  const { sections, addItem, updateItem, deleteItem, getProjectChildren, reorderProjectSteps, removeStepFromProject, linkTaskToProject } = useAllWorkItems()
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
  const [backgroundOverlay, setBackgroundOverlay] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const v = localStorage.getItem('flokus-bg-overlay')
        if (v != null) {
          const n = Number(v)
          if (!Number.isNaN(n) && n >= 0 && n <= 100) return Math.round(n)
        }
      } catch (_) {}
    }
    return 75
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [logoSpinning, setLogoSpinning] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'mountain'>('mountain')
  const [activeSectionId, setActiveSectionId] = useState<Section | null>(null)
  const [, setMainView] = useState<'workspace' | 'meeting'>('workspace')
  const [meetingFlowId, setMeetingFlowId] = useState<string | null>(null)
  const [flows, setFlows] = useState<Flow[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const s = localStorage.getItem(FLOWS_STORAGE_KEY)
        if (s) {
          const raw = JSON.parse(s) as unknown[]
          if (Array.isArray(raw)) return raw.map((r) => normalizeFlow(r as { id: string; name: string; [k: string]: unknown }))
        }
      } catch (_) {}
    }
    return [{ id: 'default', name: 'Personal' }]
  })
  const [createFlowOpen, setCreateFlowOpen] = useState(false)

  const persistFlows = (next: Flow[]) => {
    setFlows(next)
    try { localStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(next)) } catch (_) {}
  }
  const addFlow = (flow: Flow) => {
    persistFlows([...flows, flow])
    setCurrentFlowId(flow.id)
    try { localStorage.setItem('flokus-current-flow', flow.id) } catch (_) {}
  }
  const updateFlow = (id: string, partial: Partial<Flow>) => {
    persistFlows(flows.map((f) => (f.id === id ? { ...f, ...partial } : f)))
  }

  const [currentFlowId, setCurrentFlowId] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem('flokus-current-flow') || 'default'
      } catch (_) {}
    }
    return 'default'
  })
  const [completingId, setCompletingId] = useState<string | null>(null)
  const doneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [futureSectionFlash, setFutureSectionFlash] = useState(false)
  const [justDepositedId, setJustDepositedId] = useState<string | null>(null)
  const [mountainFullPending, setMountainFullPending] = useState<{ itemId: string; slotIndex: number } | null>(null)
  const [lockUnlockModal, setLockUnlockModal] = useState<'lock' | 'unlock' | null>(null)
  const [flowEditOpen, setFlowEditOpen] = useState(false)
  const [flowToEdit, setFlowToEdit] = useState<Flow | null>(null)
  const [ideaPillOpen, setIdeaPillOpen] = useState(false)
  const [drawerExpanded, setDrawerExpanded] = useState(false)
  const [addToMountainSlotIndex, setAddToMountainSlotIndex] = useState<number | null>(null)
  const [mountainOrder, setMountainOrder] = useState<string[]>([])
  const [mountainPrefs, setMountainPrefs] = useState<{ layers?: number; showFuture?: boolean; showHelp?: boolean }>({ layers: 3, showFuture: true, showHelp: true })
  const [meetingTrackByProject, setMeetingTrackByProject] = useState<Record<string, 'on_track' | 'off_track' | null>>({})
  const [meetingStep, setMeetingStep] = useState<'review' | 'conclude'>('review')
  const [meetingLogged, setMeetingLogged] = useState(false)
  const [meetingLoggedScore, setMeetingLoggedScore] = useState<number | null>(null)
  const [meetingCadence, setMeetingCadence] = useState<MeetingCadence>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const v = localStorage.getItem('flokus-meeting-cadence')
        if (v === 'weekly' || v === 'biweekly') return v
      } catch (_) {}
    }
    return 'weekly'
  })

  const allItems = SECTION_ORDER.flatMap((s) => sections[s])
  const activeSections = filterActiveSections(sections)
  const searchLower = searchQuery.trim().toLowerCase()
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
  const currentFlow = useMemo(() => flows.find((f) => f.id === currentFlowId) ?? null, [flows, currentFlowId])
  const flowIsLocked = currentFlow?.isLocked ?? false
  const [lockedDropToast, setLockedDropToast] = useState(false)
  useEffect(() => {
    if (!lockedDropToast) return
    const t = setTimeout(() => setLockedDropToast(false), 3500)
    return () => clearTimeout(t)
  }, [lockedDropToast])
  const mountainProjectCount = useMemo(
    () => validMountainOrder.filter((id) => allItems.find((i) => i.id === id)?.type === 'project').length,
    [validMountainOrder, allItems]
  )
  const canLockFlow = (currentFlow?.status === 'new' || !currentFlow?.isLocked) && mountainProjectCount > 0
  const mountainLayers = mountainPrefs.layers ?? 3
  const mountainMaxSlots = useMemo(
    () => (MOUNTAIN_LAYOUTS[mountainLayers - 1] ?? MOUNTAIN_LAYOUTS[2]).reduce((a, n) => a + n, 0),
    [mountainLayers]
  )

  const mountainStorageKey = (suffix: string) => `flokus-mountain-${suffix}-${currentFlowId}`
  const futureOrderStorageKey = `flokus-future-order-${currentFlowId}`

  useEffect(() => {
    if (currentFlowId && flowIsLocked && mountainProjectCount === 0) {
      updateFlow(currentFlowId, { isLocked: false, status: 'new' })
    }
  }, [currentFlowId, flowIsLocked, mountainProjectCount])

  const futureItems = useMemo(
    () => searchFilteredActive.filter((i) => !validMountainOrder.includes(i.id)),
    [searchFilteredActive, validMountainOrder]
  )
  const mountainItemsForList = useMemo(
    () => validMountainOrder.map((id) => searchFilteredActive.find((i) => i.id === id)).filter(Boolean) as WorkItem[],
    [validMountainOrder, searchFilteredActive]
  )

  const [futureOrder, setFutureOrder] = useState<string[]>([])
  useEffect(() => {
    try {
      const s = localStorage.getItem(mountainStorageKey('order'))
      setMountainOrder(s ? (JSON.parse(s) as string[]) : [])
      const p = localStorage.getItem(mountainStorageKey('prefs'))
      setMountainPrefs(p ? JSON.parse(p) : { layers: 3, showFuture: true, showHelp: true })
      const f = localStorage.getItem(futureOrderStorageKey)
      setFutureOrder(f ? (JSON.parse(f) as string[]) : [])
    } catch (_) {}
  }, [currentFlowId])

  useEffect(() => {
    if (viewMode !== 'list' || !activeSectionId) return
    const t = setTimeout(() => {
      document.getElementById('section-' + activeSectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => clearTimeout(t)
  }, [viewMode, activeSectionId])

  const setMountainOrderAndPersist = (order: string[]) => {
    const next = order.slice(0, 16)
    setMountainOrder(next)
    try {
      localStorage.setItem(mountainStorageKey('order'), JSON.stringify(next))
    } catch (_) {}
  }

  const handleAdd = async (title: string, type: 'task' | 'project', opts?: { select?: boolean; addToMountainSlot?: number }): Promise<string | void> => {
    const newItem = await addItem('icebox', {
      type,
      title,
      owner_id: user?.id ?? null,
    })
    if (opts?.addToMountainSlot != null && !flowIsLocked) {
      if (validMountainOrder.length >= mountainMaxSlots) {
        setMountainFullPending({ itemId: newItem.id, slotIndex: opts.addToMountainSlot })
        setAddToMountainSlotIndex(null)
        setIdeaPillOpen(false)
        if (opts?.select !== false) setSelectedId(newItem.id)
        setHighlightedId(newItem.id)
        setTimeout(() => setHighlightedId(null), 5000)
        return newItem.id
      }
      setMountainOrder((prev) => {
        const next = [...prev]
        next.splice(Math.min(opts!.addToMountainSlot!, next.length), 0, newItem.id)
        const out = next.slice(0, 16)
        try { localStorage.setItem(mountainStorageKey('order'), JSON.stringify(out)) } catch (_) {}
        return out
      })
      const nextSlot = validMountainOrder.length + 1
      setAddToMountainSlotIndex(nextSlot < mountainMaxSlots ? nextSlot : null)
      if (viewMode !== 'mountain') setIdeaPillOpen(false)
    } else {
      setFutureSectionFlash(true)
      setJustDepositedId(newItem.id)
      setTimeout(() => setFutureSectionFlash(false), 1500)
      setTimeout(() => setJustDepositedId(null), 3000)
    }
    if (opts?.select !== false) {
      setSelectedId(newItem.id)
    }
    setHighlightedId(newItem.id)
    setTimeout(() => setHighlightedId(null), 5000)
    return newItem.id
  }

  const handleMarkDone = (itemId: string) => {
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

  const effectiveBackgroundId = currentFlow?.backgroundId || backgroundId
  const bgClass = BACKGROUND_OPTIONS.find((o) => o.id === effectiveBackgroundId)?.className ?? 'zen-bg'
  return (
    <div
      className={`h-screen flex flex-col ${bgClass}`}
      style={{ ['--bg-overlay-alpha' as string]: backgroundOverlay / 100 }}
    >
      <TopBar
        userEmail={user?.email ?? ''}
        onSignOut={signOut}
        logoSpinning={logoSpinning}
        onOpenSettings={() => setSettingsOpen(true)}
        flowName={currentFlow?.name ?? null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onSectionClick={(sectionId) => {
            setMainView('workspace')
            setSelectedId(null)
            setViewMode('list')
            setActiveSectionId(sectionId)
          }}
          flows={flows}
          currentFlowId={currentFlowId}
          onFlowChange={(id) => {
            setCurrentFlowId(id)
            setSelectedId(null)
            setViewMode('mountain')
            setActiveSectionId(null)
            try { localStorage.setItem('flokus-current-flow', id) } catch (_) {}
          }}
          onLockFlowClick={() => setLockUnlockModal('lock')}
          onUnlockFlowClick={() => setLockUnlockModal('unlock')}
          flowIsLocked={flowIsLocked}
          canLockFlow={canLockFlow}
          onEditFlowClick={(id) => { setFlowToEdit(flows.find((f) => f.id === id) ?? null); setFlowEditOpen(true) }}
          onAddFlowClick={() => setCreateFlowOpen(true)}
          onMeetingClick={() => {
            setMeetingFlowId(currentFlowId)
            setMeetingTrackByProject({})
            setMeetingStep('review')
            setMeetingLogged(false)
            setMeetingLoggedScore(null)
          }}
          activeSectionId={activeSectionId}
          futureSectionFlash={futureSectionFlash}
          profiles={profiles}
          onAddTeammate={addProfile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchOpen={searchOpen}
          onSearchOpenChange={setSearchOpen}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setMainView('workspace')
            setSelectedId(null)
            setDrawerExpanded(false)
            setViewMode(mode)
          }}
        />
        <div className="flex-1 min-w-0 flex min-h-0">
          <main className="flex-1 min-w-0 flex relative min-h-0">
          {viewMode === 'mountain' && selectedItem && drawerExpanded ? (
            <div className="flex-1 min-w-0 flex min-h-0">
              <DrawerItemView
                item={selectedItem}
                profiles={profiles}
                onClose={() => { setSelectedId(null); setDrawerExpanded(false) }}
                onExpand={() => setDrawerExpanded(true)}
                onCollapse={() => setDrawerExpanded(false)}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onMarkDone={handleMarkDone}
                getProjectChildren={getProjectChildren}
                onAddSubTask={selectedItem.type === 'project' ? (title, ownerId) => addItem(selectedItem.section, { type: 'task', title, parent_id: selectedItem.id, owner_id: ownerId }) : undefined}
                reorderProjectSteps={reorderProjectSteps}
                removeStepFromProject={removeStepFromProject}
                completingId={completingId}
                expanded
              />
            </div>
          ) : viewMode === 'mountain' ? (
            <div className="flex-1 min-w-0 flex min-h-0">
              <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
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
                onEmptySlotClick={flowIsLocked ? undefined : (slotIndex) => { setAddToMountainSlotIndex(slotIndex); setIdeaPillOpen(true) }}
                onMountainFullAttempt={flowIsLocked ? undefined : (itemId, slotIndex) => setMountainFullPending({ itemId, slotIndex })}
                activeAddSlotIndex={addToMountainSlotIndex}
                mountainLocked={flowIsLocked}
                canLockFlow={canLockFlow}
                onLockFlow={currentFlowId ? () => updateFlow(currentFlowId, { isLocked: true, status: 'active' }) : undefined}
                onUnlockFlow={currentFlowId ? () => updateFlow(currentFlowId, { isLocked: false, status: 'new' }) : undefined}
                flowStatus={currentFlow?.status}
                layers={mountainPrefs.layers ?? 3}
                onLayersChange={(layers) => {
                  setMountainPrefs((p) => {
                    const next = { ...p, layers }
                    try { localStorage.setItem(mountainStorageKey('prefs'), JSON.stringify(next)) } catch (_) {}
                    return next
                  })
                }}
                showFuture={mountainPrefs.showFuture ?? true}
                onShowFutureChange={(showFuture) => {
                  setMountainPrefs((p) => {
                    const next = { ...p, showFuture }
                    try { localStorage.setItem(mountainStorageKey('prefs'), JSON.stringify(next)) } catch (_) {}
                    return next
                  })
                }}
                showHelp={mountainPrefs.showHelp ?? true}
                onShowHelpChange={(showHelp) => {
                  setMountainPrefs((p) => {
                    const next = { ...p, showHelp }
                    try { localStorage.setItem(mountainStorageKey('prefs'), JSON.stringify(next)) } catch (_) {}
                    return next
                  })
                }}
                trackByProject={meetingTrackByProject}
                onLockedFlowDropAttempt={() => setLockedDropToast(true)}
              />
              </div>
              {selectedItem ? (
                <DrawerItemView
                  item={selectedItem}
                  profiles={profiles}
                  onClose={() => { setSelectedId(null); setDrawerExpanded(false) }}
                  onExpand={() => setDrawerExpanded(true)}
                  onCollapse={() => setDrawerExpanded(false)}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onMarkDone={handleMarkDone}
                  getProjectChildren={getProjectChildren}
                  onAddSubTask={selectedItem.type === 'project' ? (title, ownerId) => addItem(selectedItem.section, { type: 'task', title, parent_id: selectedItem.id, owner_id: ownerId }) : undefined}
                  reorderProjectSteps={reorderProjectSteps}
                  removeStepFromProject={removeStepFromProject}
                  completingId={completingId}
                  expanded={false}
                />
              ) : currentFlow?.status === 'new' ? (
                <aside className="w-64 flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-panel)] backdrop-blur-sm flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-[var(--border)]">
                    <h3 className="text-sm font-semibold text-teal-dark">Set up your 90-day flow</h3>
                  </div>
                  <div className="flex-1 overflow-auto p-3 space-y-3 text-sm text-[var(--text)]">
                    {canLockFlow && validMountainOrder.length >= mountainMaxSlots && (
                      <div className="p-3 rounded-xl bg-teal-light/15 border border-teal-light/40">
                        <p className="text-sm font-medium text-teal-dark">Ready to commit and lock your flow to create a Quarterly Focus.</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Use <strong>Lock for quarter</strong> in the left tray when you’re ready.</p>
                      </div>
                    )}
                    <p className="text-xs text-[var(--text-muted)]">Add and edit projects here or on the mountain.</p>
                    <button
                      type="button"
                      onClick={() => setIdeaPillOpen(true)}
                      className="w-full py-2 px-3 rounded-lg border border-teal-dark/30 bg-teal-light/10 text-teal-dark text-sm font-medium hover:bg-teal-light/20 transition-colors"
                    >
                      + Add project
                    </button>
                    <div>
                      <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">On your mountain</h4>
                      <ul className="space-y-0.5">
                        {validMountainOrder.map((id) => {
                          const item = allItems.find((i) => i.id === id)
                          if (!item) return null
                          return (
                            <li key={id}>
                              <button
                                type="button"
                                onClick={() => setSelectedId(selectedId === id ? null : id)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm truncate block transition-colors ${selectedId === id ? 'bg-teal-light/20 text-teal-dark' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                              >
                                {item.title || 'Untitled'}
                              </button>
                            </li>
                          )
                        })}
                        {validMountainOrder.length === 0 && (
                          <li className="text-xs text-[var(--text-muted)] px-2 py-1.5">No projects yet. Add one above or drag from Future.</li>
                        )}
                      </ul>
                    </div>
                    <ol className="space-y-1.5 list-decimal list-inside text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                      <li>Prioritize by dragging on the mountain (top = highest impact).</li>
                      <li>Add or remove elevations below the mountain.</li>
                      <li>Lock when ready to commit.</li>
                    </ol>
                  </div>
                </aside>
              ) : null}
            </div>
          ) : selectedItem ? (
            <>
              <div
                className="absolute inset-0 z-10 bg-black/10 dark:bg-black/20"
                onClick={() => setSelectedId(null)}
                aria-hidden
              />
              <div className="absolute inset-0 z-20 flex justify-center overflow-auto pointer-events-none">
                <div className="pointer-events-auto w-full max-w-2xl min-w-0 flex flex-col flex-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <FocusView
                  item={selectedItem}
                  profiles={profiles}
                  onClose={() => setSelectedId(null)}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onMarkDone={handleMarkDone}
                  getProjectChildren={getProjectChildren}
                  onAddSubTask={(title, ownerId) => addItem(selectedItem.section, { type: 'task', title, parent_id: selectedItem.id, owner_id: ownerId })}
                  reorderProjectSteps={reorderProjectSteps}
                  removeStepFromProject={removeStepFromProject}
                  linkTaskToProject={linkTaskToProject}
                  standaloneTasks={selectedItem.type === 'project' ? allItems.filter((i) => !i.parent_id && i.type === 'task' && i.id !== selectedItem.id) : []}
                />
                </div>
              </div>
            </>
          ) : activeSectionId === 'icebox' ? (
            <div className="flex-1 min-w-0 flex flex-col">
              <FutureListView
                items={futureItems}
                order={futureOrder.filter((id) => futureItems.some((i) => i.id === id)).concat(futureItems.filter((i) => !futureOrder.includes(i.id)).map((i) => i.id))}
                onReorder={(orderedIds) => {
                  const next = orderedIds.filter((id) => futureItems.some((i) => i.id === id))
                  setFutureOrder(next)
                  try { localStorage.setItem(futureOrderStorageKey, JSON.stringify(next)) } catch (_) {}
                }}
                profiles={profiles}
                selectedId={selectedId}
                highlightedId={highlightedId}
                onSelect={setSelectedId}
                onMarkDone={handleMarkDone}
                completingId={completingId}
                getProjectChildren={getProjectChildren}
                justDepositedId={justDepositedId}
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0 flex flex-col">
              <FlowListView
                mountainItems={mountainItemsForList}
                futureItems={futureItems}
                futureOrder={futureOrder.filter((id) => futureItems.some((i) => i.id === id)).concat(futureItems.filter((i) => !futureOrder.includes(i.id)).map((i) => i.id))}
                profiles={profiles}
                selectedId={selectedId}
                highlightedId={highlightedId}
                onSelect={setSelectedId}
                onMarkDone={handleMarkDone}
                completingId={completingId}
                getProjectChildren={getProjectChildren}
              />
            </div>
          )}
        </main>
          {meetingFlowId && (
            <aside className="w-96 min-w-[280px] max-w-[90vw] flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-panel)] backdrop-blur-sm flex flex-col overflow-hidden">
              <MeetingView
                flowId={meetingFlowId}
                flowName={flows.find((f) => f.id === meetingFlowId)?.name ?? 'Flow'}
                projectIds={validMountainOrder.filter((id) => allItems.find((i) => i.id === id)?.type === 'project')}
                allItems={allItems}
                getProjectChildren={getProjectChildren}
                profiles={profiles}
                onOpenProject={(id) => {
                  setSelectedId(id)
                  setMeetingFlowId(null)
                  setDrawerExpanded(true)
                  setViewMode('mountain')
                }}
                onClose={() => setMeetingFlowId(null)}
                trackByProject={meetingTrackByProject}
                setTrackByProject={setMeetingTrackByProject}
                step={meetingStep}
                setStep={setMeetingStep}
                logged={meetingLogged}
                setLogged={setMeetingLogged}
                loggedScore={meetingLoggedScore}
                setLoggedScore={setMeetingLoggedScore}
              />
            </aside>
          )}
        </div>
      </div>
      {lockedDropToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-amber-500/95 dark:bg-amber-600/90 text-amber-950 dark:text-amber-100 text-sm font-medium shadow-lg border border-amber-400/50 animate-fade-in" role="alert">
          Flow is locked — unlock in the left tray to change what’s on your mountain.
        </div>
      )}
      <FloatingAdd
        onAdd={handleAdd}
        open={ideaPillOpen}
        onOpenChange={(open) => { setIdeaPillOpen(open); if (!open) setAddToMountainSlotIndex(null) }}
        initialAddToMountainSlot={addToMountainSlotIndex}
        keepOpenAfterAdd={viewMode === 'mountain'}
        flowName={currentFlow?.name ?? null}
        hasMultipleFlows={flows.length >= 2}
      />
      <CreateFlowModal open={createFlowOpen} onClose={() => setCreateFlowOpen(false)} onCreate={addFlow} />
      <FlowEditModal
        open={flowEditOpen}
        flow={flowToEdit}
        onClose={() => { setFlowEditOpen(false); setFlowToEdit(null) }}
        onSave={(updates) => { if (flowToEdit) updateFlow(flowToEdit.id, updates); setFlowEditOpen(false); setFlowToEdit(null) }}
      />
      {lockUnlockModal === 'lock' && currentFlowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 dark:bg-black/65 backdrop-blur-sm" onClick={() => setLockUnlockModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--border)] shadow-2xl max-w-sm w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text)]">Confirm your 90-day commitment</h3>
            <p className="text-sm text-[var(--text-muted)]">By locking this flow, you’re agreeing to this 90-day focus. You can unlock later if you need to change direction.</p>
            <div className="flex flex-col gap-2 pt-2">
              {mountainProjectCount === 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">Add at least one project to your mountain before locking.</p>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (mountainProjectCount > 0) {
                      updateFlow(currentFlowId, { isLocked: true, status: 'active' })
                      setLockUnlockModal(null)
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-teal-dark text-white text-sm font-medium hover:opacity-90"
                >
                  Lock flow
                </button>
              )}
              <button type="button" onClick={() => setLockUnlockModal(null)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {lockUnlockModal === 'unlock' && currentFlowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 dark:bg-black/65 backdrop-blur-sm" onClick={() => setLockUnlockModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--border)] shadow-2xl max-w-sm w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text)]">Unlock this flow?</h3>
            <p className="text-sm text-[var(--text-muted)]">Best practices suggest waiting until the end of your 90-day commitment before changing focus. Unlock anyway to edit your project list.</p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  updateFlow(currentFlowId, { isLocked: false, status: 'new' })
                  setLockUnlockModal(null)
                }}
                className="w-full px-4 py-3 rounded-xl border border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200 text-sm font-medium hover:bg-amber-500/25"
              >
                Unlock
              </button>
              <button type="button" onClick={() => setLockUnlockModal(null)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {mountainFullPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40" onClick={() => setMountainFullPending(null)}>
          <div className="bg-[var(--bg-panel)] dark:bg-[var(--bg)] rounded-2xl border border-[var(--border)] shadow-xl max-w-md w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[var(--text)]">Mountain is full</h3>
            <p className="text-sm text-[var(--text-muted)]">Add this project by either removing one to make room or adding another elevation.</p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const { itemId, slotIndex } = mountainFullPending
                  setMountainOrder((prev) => {
                    const next = prev.filter((_, i) => i !== prev.length - 1)
                    next.splice(Math.min(slotIndex, next.length), 0, itemId)
                    const out = next.slice(0, mountainMaxSlots)
                    try { localStorage.setItem(mountainStorageKey('order'), JSON.stringify(out)) } catch (_) {}
                    return out
                  })
                  setMountainFullPending(null)
                }}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-white dark:bg-white/10 text-[var(--text)] text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
              >
                Remove one to make room
              </button>
              <button
                type="button"
                onClick={() => {
                  const { itemId, slotIndex } = mountainFullPending
                  const newLayers = Math.min(4, mountainLayers + 1)
                  setMountainPrefs((p) => {
                    const next = { ...p, layers: newLayers }
                    try { localStorage.setItem(mountainStorageKey('prefs'), JSON.stringify(next)) } catch (_) {}
                    return next
                  })
                  const newLayout = MOUNTAIN_LAYOUTS[newLayers - 1] ?? MOUNTAIN_LAYOUTS[3]
                  const newMaxSlots = newLayout.reduce((a, n) => a + n, 0)
                  setMountainOrder((prev) => {
                    const next = [...prev]
                    next.splice(Math.min(slotIndex, next.length), 0, itemId)
                    const out = next.slice(0, newMaxSlots)
                    try { localStorage.setItem(mountainStorageKey('order'), JSON.stringify(out)) } catch (_) {}
                    return out
                  })
                  setMountainFullPending(null)
                }}
                className="w-full px-4 py-3 rounded-xl bg-teal-dark/15 border border-teal-dark/30 text-teal-dark text-sm font-medium hover:bg-teal-dark/20"
              >
                Add another elevation
              </button>
              <p className="text-[10px] text-[var(--text-muted)] pt-1">Adding more elevations can lead to overcommitting. We recommend staying focused.</p>
              <button type="button" onClick={() => setMountainFullPending(null)} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] pt-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
        backgroundOverlay={backgroundOverlay}
        onBackgroundOverlayChange={(percent) => {
          setBackgroundOverlay(percent)
          try { localStorage.setItem('flokus-bg-overlay', String(percent)) } catch (_) {}
        }}
        meetingCadence={meetingCadence}
        onMeetingCadenceChange={(cadence) => {
          setMeetingCadence(cadence)
          try { localStorage.setItem('flokus-meeting-cadence', cadence) } catch (_) {}
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
