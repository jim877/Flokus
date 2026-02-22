import type { Profile } from '@/lib/supabase'

const COLOR_PREFIX = 'color:'

export const AVATAR_COLORS = [
  { id: 'teal', bg: 'bg-teal-600', text: 'text-white' },
  { id: 'sage', bg: 'bg-[#7a9f7a]', text: 'text-white' },
  { id: 'blue', bg: 'bg-blue-600', text: 'text-white' },
  { id: 'indigo', bg: 'bg-indigo-600', text: 'text-white' },
  { id: 'violet', bg: 'bg-violet-600', text: 'text-white' },
  { id: 'amber', bg: 'bg-amber-500', text: 'text-amber-950' },
  { id: 'rose', bg: 'bg-rose-500', text: 'text-white' },
  { id: 'emerald', bg: 'bg-emerald-600', text: 'text-white' },
  { id: 'slate', bg: 'bg-slate-600', text: 'text-white' },
  { id: 'stone', bg: 'bg-stone-500', text: 'text-white' },
] as const

/** Prefer profile.initials; else first letter of first + first letter of last word, or first two of single word / email */
function getInitials(p: Profile): string {
  if (p.initials && p.initials.trim()) return p.initials.trim().slice(0, 2).toUpperCase()
  const name = (p.name || '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return (p.email || '').slice(0, 2).toUpperCase()
}

function getAvatarColorId(avatarUrl: string | null): string | null {
  if (!avatarUrl || !avatarUrl.startsWith(COLOR_PREFIX)) return null
  return avatarUrl.slice(COLOR_PREFIX.length)
}

export function TeamAvatar({
  profile,
  size = 'md',
  className = '',
}: {
  profile: Profile
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const initials = getInitials(profile)
  const colorId = getAvatarColorId(profile.avatar_url)
  const color = colorId ? AVATAR_COLORS.find((c) => c.id === colorId) : AVATAR_COLORS[0]
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'

  if (profile.avatar_url && !profile.avatar_url.startsWith(COLOR_PREFIX) && !profile.avatar_url.startsWith('emoji:')) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        className={`rounded-full object-cover flex-shrink-0 object-center ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 leading-none select-none ${sizeClass} ${color?.bg ?? 'bg-teal-600'} ${color?.text ?? 'text-white'} ${className}`}
    >
      <span className="leading-none">{initials}</span>
    </div>
  )
}

export { COLOR_PREFIX }
