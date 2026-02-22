/** Lightbulb: green/teal bulb + filament + circular arrow; orange/yellow rays and horizontal base lines */
export default function LightBulbIcon({ className = 'w-12 h-12' }: { className?: string }) {
  const teal = '#9CB6AA'
  const orange = '#E8BE81'
  const stroke = 0.9
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      {/* Circular refresh arrow – green/teal, from upper left over top to upper right, arrowhead at end */}
      <path
        d="M6.5 5.5 A5.5 5.5 0 0 0 17.5 5.5"
        stroke={teal}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M16.2 4.8l1.8 1.2-1 0.6" stroke={teal} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Light rays – orange/yellow, from upper portion of bulb */}
      <g stroke={orange} strokeWidth={stroke} strokeLinecap="round">
        <line x1="12" y1="4.5" x2="12" y2="1.5" />
        <line x1="13.5" y1="5" x2="15.5" y2="2.5" />
        <line x1="15" y1="6.5" x2="18" y2="5" />
        <line x1="10.5" y1="5" x2="8.5" y2="2.5" />
        <line x1="9" y1="6.5" x2="6" y2="5" />
      </g>
      {/* Bulb outline – smooth pear shape, green/teal */}
      <path
        d="M12 2.8c-2.6 0-4.8 2-4.8 4.6 0 1 .4 2 1 2.7.2.2.3.5.3.7 0 .2.1.4.3.5h5c.2 0 .3-.2.3-.4 0-.2.1-.4.2-.5.6-.8 1-1.7 1-2.7 0-2.6-2.2-4.6-4.8-4.6z"
        stroke={teal}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Neck */}
      <path d="M9.2 11.2h5.6" stroke={teal} strokeWidth={stroke} strokeLinecap="round" />
      {/* Base – horizontal parallel lines, orange/yellow */}
      <line x1="9" y1="11.8" x2="15" y2="11.8" stroke={orange} strokeWidth={stroke} strokeLinecap="round" />
      <line x1="9" y1="12.4" x2="15" y2="12.4" stroke={orange} strokeWidth={stroke} strokeLinecap="round" />
      <line x1="9" y1="13" x2="15" y2="13" stroke={orange} strokeWidth={stroke} strokeLinecap="round" />
      <line x1="9" y1="13.6" x2="15" y2="13.6" stroke={orange} strokeWidth={stroke} strokeLinecap="round" />
      {/* Filament – squiggly line, green/teal */}
      <path
        d="M10.5 6.8Q12 6 12 8Q12 10 13.5 9.2"
        stroke={teal}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
