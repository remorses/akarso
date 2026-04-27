// Parses user-friendly post scheduling times into ISO timestamps for Zernio.
export function parseScheduledAt(input: string, now = new Date()): string {
  const value = input.trim()
  const compact = /^(\d+)([mhdw])$/i.exec(value)

  let relativeMs: number | undefined
  if (compact?.[1] && compact[2]) {
    const amount = Number(compact[1])
    const unit = compact[2].toLowerCase()

    if (unit === 'm') relativeMs = amount * 60 * 1000
    if (unit === 'h') relativeMs = amount * 60 * 60 * 1000
    if (unit === 'd') relativeMs = amount * 24 * 60 * 60 * 1000
    if (unit === 'w') relativeMs = amount * 7 * 24 * 60 * 60 * 1000
  }

  const date = relativeMs !== undefined
    ? new Date(now.getTime() + relativeMs)
    : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'Invalid scheduled time. Use an ISO date or a relative value like 30m, 2h, 3d, or 1w.',
    )
  }

  if (date <= now) {
    throw new Error('Scheduled time must be in the future.')
  }

  return date.toISOString()
}
