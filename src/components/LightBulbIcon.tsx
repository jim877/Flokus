/** Lightbulb for idea drop only: terracotta outline, teal-dark filament/base (no rays) */
export default function LightBulbIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* Bulb glass – terracotta outline */}
      <path
        d="M12 3.5c-2.4 0-4.2 1.9-4.2 4.3 0 1.3.5 2.5 1.2 3.5v.1c0 .4.2.6.6.6h5.2c.4 0 .6-.2.6-.6v-.1c.7-1 1.2-2.2 1.2-3.5 0-2.4-1.8-4.3-4.2-4.3z"
        stroke="#B8956E"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Base – teal-dark */}
      <path d="M9.5 12.5v1.2h5v-1.2" stroke="#3D6B6B" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path
        d="M9 13.7h6v1.2c0 .6-.5 1.2-1.2 1.2h-3.6c-.7 0-1.2-.6-1.2-1.2v-1.2z"
        stroke="#3D6B6B"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Filament – teal-dark */}
      <path
        d="M12 8.8v1.5M10.8 10.2c.3.3.9.3 1.2 0M12 10.5c.3.3.9.3 1.2 0"
        stroke="#3D6B6B"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
