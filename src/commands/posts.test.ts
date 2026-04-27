// Tests the scheduling input parser used by the posts command.
import { describe, expect, test } from 'vitest'
import { parseScheduledAt } from '../scheduling.ts'

const now = new Date('2026-04-27T12:00:00.000Z')

describe('parseScheduledAt', () => {
  test('keeps ISO input as normalized ISO', () => {
    expect(parseScheduledAt('2026-04-27T12:30:00Z', now)).toMatchInlineSnapshot(
      `"2026-04-27T12:30:00.000Z"`,
    )
  })

  test('parses compact relative times', () => {
    expect([
      parseScheduledAt('30m', now),
      parseScheduledAt('2h', now),
      parseScheduledAt('3d', now),
      parseScheduledAt('1w', now),
    ]).toMatchInlineSnapshot(`
      [
        "2026-04-27T12:30:00.000Z",
        "2026-04-27T14:00:00.000Z",
        "2026-04-30T12:00:00.000Z",
        "2026-05-04T12:00:00.000Z",
      ]
    `)
  })

  test('rejects invalid and past inputs', () => {
    expect(() => parseScheduledAt('tomorrow', now)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid scheduled time. Use an ISO date or a relative value like 30m, 2h, 3d, or 1w.]`,
    )
    expect(() =>
      parseScheduledAt('2026-04-27T11:59:00Z', now),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Scheduled time must be in the future.]`,
    )
  })
})
