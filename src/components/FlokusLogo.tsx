/** Flökus brand: concentric squircles only (no outer circle overlay) – teal, sage, terracotta */
export default function FlokusLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      {/* Outermost squircle: dark teal */}
      <rect x="6" y="6" width="28" height="28" rx="7" stroke="#3D6B6B" strokeWidth="1.5" fill="none" />
      {/* Squircle 2: sage */}
      <rect x="10" y="10" width="20" height="20" rx="4" stroke="#8B9F82" strokeWidth="1.3" fill="none" />
      {/* Squircle 3: terracotta */}
      <rect x="14" y="14" width="12" height="12" rx="3" stroke="#B8956E" strokeWidth="1.2" fill="none" />
      {/* Innermost: small circle terracotta/beige */}
      <circle cx="20" cy="20" r="2.5" fill="#E8E4DC" />
    </svg>
  )
}
