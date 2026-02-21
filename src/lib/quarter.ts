/** Quarter boundaries: end of Mar, Jun, Sep, Dec */
function getQuarterEnd(date: Date): Date {
  const y = date.getFullYear()
  const m = date.getMonth()
  if (m < 3) return new Date(y, 2, 31)   // Mar 31
  if (m < 6) return new Date(y, 5, 30)   // Jun 30
  if (m < 9) return new Date(y, 8, 30)  // Sep 30
  return new Date(y, 11, 31)             // Dec 31
}

export function getDaysUntilNextQuarter(): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const end = getQuarterEnd(now)
  if (now >= end) {
    const next = new Date(end)
    next.setMonth(next.getMonth() + 3)
    return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getNextQuarterLabel(): string {
  const now = new Date()
  const end = getQuarterEnd(now)
  const m = end.getMonth()
  const y = end.getFullYear()
  if (m === 2) return `Q1 ${y} (Mar 31)`
  if (m === 5) return `Q2 ${y} (Jun 30)`
  if (m === 8) return `Q3 ${y} (Sep 30)`
  return `Q4 ${y} (Dec 31)`
}
