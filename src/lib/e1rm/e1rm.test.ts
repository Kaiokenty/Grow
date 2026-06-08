import { describe, expect, it } from 'vitest'
import { bestSetE1RM, calculateE1RM } from '@/lib/e1rm'
import { brzycki, epley, lombardi, mayhew, wathen } from '@/lib/e1rm/formulas'

describe('e1RM formulas', () => {
  it('epley', () => {
    expect(epley(100, 5)).toBeCloseTo(116.667, 2)
  })

  it('mayhew', () => {
    expect(mayhew(100, 5)).toBeCloseTo(119.01, 1)
  })

  it('lombardi', () => {
    expect(lombardi(100, 5)).toBeCloseTo(117.46, 1)
  })

  it('brzycki', () => {
    expect(brzycki(100, 5)).toBeCloseTo(112.5, 1)
  })

  it('wathen', () => {
    expect(wathen(50, 8)).toBeCloseTo(63.84, 1)
  })
})

describe('calculateE1RM', () => {
  it('returns null when reps > 10', () => {
    expect(calculateE1RM({ reps: 11, weight_kg: 100 }, 'upper_pull')).toBeNull()
  })

  it('dispatches by movement_type', () => {
    expect(calculateE1RM({ reps: 5, weight_kg: 100 }, 'upper_push')).toBeCloseTo(
      mayhew(100, 5),
      4,
    )
    expect(calculateE1RM({ reps: 5, weight_kg: 100 }, 'lower_hinge')).toBeCloseTo(
      brzycki(100, 5),
      4,
    )
  })

  it('falls back to epley when movement_type unset', () => {
    expect(calculateE1RM({ reps: 5, weight_kg: 100 }, null)).toBeCloseTo(
      epley(100, 5),
      4,
    )
  })
})

describe('bestSetE1RM', () => {
  it('ignores warmups and picks highest e1RM working set', () => {
    const best = bestSetE1RM(
      [
        { set_type: 'warmup', reps: 10, weight_kg: 60 },
        { set_type: 'working', reps: 5, weight_kg: 100 },
        { set_type: 'working', reps: 8, weight_kg: 90 },
      ],
      'upper_pull',
    )
    expect(best).toBeCloseTo(epley(100, 5), 4)
  })
})
