import { describe, expect, it } from 'vitest'
import { computeBalanceSummary } from '@/lib/body-map/balance'

describe('computeBalanceSummary', () => {
  it('sums push bucket volume', () => {
    const summary = computeBalanceSummary(
      { chest: 1000, back: 500, quads: 800 },
      'push_pull_legs',
    )
    expect(summary.find((b) => b.key === 'push')?.volume).toBe(1000)
    expect(summary.find((b) => b.key === 'pull')?.volume).toBe(500)
    expect(summary.find((b) => b.key === 'legs')?.volume).toBe(800)
  })
})
