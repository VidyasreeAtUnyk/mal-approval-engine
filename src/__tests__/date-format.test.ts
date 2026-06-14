/**
 * Tests for formatDateRange (src/lib/format.ts)
 *
 * GAP THIS TESTS CLOSES:
 * - Date range was displayed as raw JSON: {"from":"...","to":"..."} because
 *   the display logic was duplicated inline in two page components with no tests.
 *   Now the logic lives in one place (format.ts) and is verified here.
 */
import { formatDateRange } from '@/lib/format'

describe('formatDateRange', () => {
  test('formats a multi-day range as "MMM d, yyyy → MMM d, yyyy"', () => {
    const result = formatDateRange({ from: '2026-06-15T00:00:00.000Z', to: '2026-06-20T00:00:00.000Z' })
    expect(result).toMatch(/Jun \d+, 2026 → Jun \d+, 2026/)
  })

  test('single day (from === to) shows one date, not an arrow', () => {
    const result = formatDateRange({ from: '2026-06-15T00:00:00.000Z', to: '2026-06-15T00:00:00.000Z' })
    expect(result).not.toContain('→')
    expect(result).toContain('2026')
  })

  test('only from date present shows that date', () => {
    const result = formatDateRange({ from: '2026-06-15T00:00:00.000Z' })
    expect(result).toContain('2026')
    expect(result).not.toContain('→')
  })

  test('non-daterange object falls back to JSON.stringify', () => {
    const result = formatDateRange({ foo: 'bar' })
    expect(result).toBe(JSON.stringify({ foo: 'bar' }))
  })

  test('null/undefined does not throw', () => {
    expect(() => formatDateRange(null)).not.toThrow()
    expect(() => formatDateRange(undefined)).not.toThrow()
  })

  test('never returns raw ISO string with T and Z', () => {
    const result = formatDateRange({ from: '2026-06-15T18:30:00.000Z', to: '2026-06-20T18:30:00.000Z' })
    expect(result).not.toContain('T')
    expect(result).not.toContain('.000Z')
  })
})
