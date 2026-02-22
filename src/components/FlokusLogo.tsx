/** Fókusz brand: three concentric circles (teal, sage, cream) with tilted slash */
export default function FlokusLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      {/* Outermost circle: dark teal */}
      <circle cx="20" cy="20" r="17" stroke="#2d5a5a" strokeWidth="1.8" fill="none" />
      {/* Middle circle: sage green */}
      <circle cx="20" cy="20" r="12.5" stroke="#8B9F82" strokeWidth="1.4" fill="none" />
      {/* Innermost circle: cream fill */}
      <circle cx="20" cy="20" r="7.5" fill="#E8E4DC" stroke="none" />
      {/* Tilted forward slash: light brown / tan */}
      <line
        x1="15.2"
        y1="24.2"
        x2="24.8"
        y2="15.8"
        stroke="#B8956E"
        strokeWidth="1.6"
        strokeLinecap="round"
        transform="rotate(-12 20 20)"
      />
    </svg>
  )
}
