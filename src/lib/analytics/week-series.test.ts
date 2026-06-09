import { describe, expect, it } from 'vitest'
import { weekRangeForPreset, zeroFillWeekSeries } from '@/lib/analytics/week-series'

describe('zeroFillWeekSeries', () => {
  it('fills gaps with zero tonnage', () => {
    const filled = zeroFillWeekSeries(
      [{ week_start: '2026-06-08', tonnage: 1000 }],
      '2026-05-18',
      '2026-06-08',
      1,
      { tonnage: 0 },
    )

    expect(filled).toHaveLength(4)
    expect(filled[0]).toEqual({ week_start: '2026-05-18', tonnage: 0 })
    expect(filled[3]).toEqual({ week_start: '2026-06-08', tonnage: 1000 })
  })
})

describe('weekRangeForPreset', () => {
  it('returns N calendar weeks ending on current week start', () => {
    const today = new Date(2026, 5, 8)
    const range = weekRangeForPreset(4, 1, today)
    expect(range.end).toBe('2026-06-08')
    expect(range.start).toBe('2026-05-18')
  })
})
