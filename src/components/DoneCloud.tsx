import { forwardRef, useState, useEffect } from 'react'

interface DoneCloudProps {
  count: number
  isIngesting: boolean
}

const DoneCloud = forwardRef<HTMLDivElement, DoneCloudProps>(function DoneCloud(
  { count, isIngesting },
  ref
) {
  const [showGrow, setShowGrow] = useState(false)

  useEffect(() => {
    if (!isIngesting) return
    setShowGrow(true)
    const t = setTimeout(() => setShowGrow(false), 500)
    return () => clearTimeout(t)
  }, [isIngesting, count])

  return (
    <div
      ref={ref}
      className={`relative flex items-center justify-center w-12 h-9 transition-transform ${showGrow ? 'animate-cloud-grow' : ''}`}
    >
      <svg
        width="48"
        height="28"
        viewBox="0 0 56 36"
        fill="none"
        className="text-teal-dark/90 drop-shadow-sm"
        aria-hidden
      >
        <path
          d="M44 26c0-2 1.5-4 4-4 2-2 2-5 2-6 0-4-3-7-7-7-2 0-4 1-5 2-1-3-4-5-7-5-4 0-7 3-7 7 0 1 0 4 2 6 2.5 0 4 2 4 4 0 2.5-2 4.5-4.5 4.5H12c-3 0-5.5-2.5-5.5-5.5S9 19 12 19h2c0-4 3.5-7 7.5-7s7.5 3 7.5 7h2c2.5 0 4.5 2 4.5 4.5S44 26 41.5 26H44z"
          fill="currentColor"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-teal-dark text-sm font-medium tabular-nums"
        aria-label={`${count} done today`}
      >
        {count}
      </span>
    </div>
  )
})

export default DoneCloud
