import type { WorkItem, Profile } from '@/lib/supabase'

const MEETING_LOG_KEY = 'flokus-meeting-log'

export interface MeetingLogEntry {
  flowId: string
  date: string
  score: number
  onTrack: number
  offTrack: number
  total: number
}

type TrackStatus = 'on_track' | 'off_track' | null

interface MeetingViewProps {
  flowId: string
  flowName: string
  projectIds: string[]
  allItems: WorkItem[]
  getProjectChildren: (parentId: string) => WorkItem[]
  profiles: Profile[]
  onOpenProject: (id: string) => void
  onClose: () => void
  trackByProject: Record<string, TrackStatus>
  setTrackByProject: (v: Record<string, TrackStatus> | ((prev: Record<string, TrackStatus>) => Record<string, TrackStatus>)) => void
  step: 'review' | 'conclude'
  setStep: (s: 'review' | 'conclude') => void
  logged: boolean
  setLogged: (v: boolean) => void
  loggedScore: number | null
  setLoggedScore: (v: number | null) => void
}

export default function MeetingView({
  flowId,
  flowName,
  projectIds,
  allItems,
  getProjectChildren,
  onOpenProject,
  onClose,
  trackByProject,
  setTrackByProject,
  step,
  setStep,
  logged,
  setLogged,
  loggedScore,
  setLoggedScore,
}: MeetingViewProps) {

  const projects = projectIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is WorkItem => Boolean(i && i.type === 'project'))

  const setTrack = (projectId: string, status: TrackStatus) => {
    setTrackByProject((prev: Record<string, TrackStatus>) => ({ ...prev, [projectId]: status }))
  }

  const onTrackCount = projects.filter((p) => trackByProject[p.id] === 'on_track').length
  const offTrackCount = projects.filter((p) => trackByProject[p.id] === 'off_track').length
  const total = projects.length
  const score = total > 0 ? Math.round((onTrackCount / total) * 100) : 100

  const logMeeting = () => {
    const entry: MeetingLogEntry = {
      flowId,
      date: new Date().toISOString().slice(0, 10),
      score,
      onTrack: onTrackCount,
      offTrack: offTrackCount,
      total,
    }
    try {
      const raw = localStorage.getItem(MEETING_LOG_KEY)
      const list: MeetingLogEntry[] = raw ? JSON.parse(raw) : []
      list.unshift(entry)
      localStorage.setItem(MEETING_LOG_KEY, JSON.stringify(list.slice(0, 100)))
    } catch (_) {}
    setLogged(true)
    setLoggedScore(score)
  }

  if (step === 'conclude') {
    return (
      <div className="flex-1 min-w-0 flex flex-col p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-[var(--text)]">Conclusion</h1>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white dark:bg-white/5 p-6 space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Flow: <span className="font-medium text-[var(--text)]">{flowName}</span>
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-teal-dark">{loggedScore ?? score}</span>
            <span className="text-[var(--text-muted)]">/ 100</span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {onTrackCount} on track, {offTrackCount} off track{total > 0 ? ` of ${total} projects` : ''}.
          </p>
          {!logged ? (
            <button
              type="button"
              onClick={logMeeting}
              className="px-4 py-2.5 rounded-lg bg-teal-dark text-white font-medium hover:opacity-90"
            >
              Log meeting
            </button>
          ) : (
            <p className="text-sm text-teal-dark font-medium">Meeting logged.</p>
          )}
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setStep('review')}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5"
          >
            Back to review
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-teal-dark text-white font-medium hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text)]">Weekly review</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{flowName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Open each project, update as needed, then mark On track or Off track. When done, go to Conclusion to log the meeting and get a score.
      </p>
      <ul className="space-y-2">
        {projects.length === 0 ? (
          <li className="text-sm text-[var(--text-muted)] py-4">No projects on this flow’s 90-day mountain yet.</li>
        ) : (
          projects.map((p) => {
            const steps = getProjectChildren(p.id)
            const status = trackByProject[p.id]
            return (
              <li
                key={p.id}
                className="rounded-xl border border-[var(--border)] bg-white dark:bg-white/5 p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--text)] truncate">{p.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenProject(p.id)}
                      className="px-2.5 py-1.5 rounded-lg text-sm border border-[var(--border)] text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrack(p.id, status === 'on_track' ? null : 'on_track')}
                      className={`px-2.5 py-1.5 rounded-lg text-sm ${status === 'on_track' ? 'bg-teal-light/30 text-teal-dark border border-teal-light' : 'border border-[var(--border)] text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      On track
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrack(p.id, status === 'off_track' ? null : 'off_track')}
                      className={`px-2.5 py-1.5 rounded-lg text-sm ${status === 'off_track' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' : 'border border-[var(--border)] text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      Off track
                    </button>
                  </div>
                </div>
                {steps.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)]">{steps.length} step{steps.length !== 1 ? 's' : ''}</p>
                )}
              </li>
            )
          })
        )}
      </ul>
      {projects.length > 0 && (
        <div className="mt-8 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setStep('conclude')}
            className="px-4 py-2.5 rounded-lg bg-teal-dark text-white font-medium hover:opacity-90"
          >
            Go to conclusion
          </button>
        </div>
      )}
    </div>
  )
}
