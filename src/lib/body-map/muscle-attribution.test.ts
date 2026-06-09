import { describe, expect, it } from 'vitest'
import {
  backfillMuscleAttribution,
  buildMuscleGroups,
  expandMuscleContributions,
  MUSCLE_WEIGHT_OTHER,
  MUSCLE_WEIGHT_PRIMARY,
  MUSCLE_WEIGHT_SECONDARY,
  validateMuscleAttribution,
  weightedSetTonnage,
} from '@/lib/body-map/attribution'

describe('muscle attribution weights', () => {
  it('uses primary 1.0, secondary 0.5, other 0.3', () => {
    expect(MUSCLE_WEIGHT_PRIMARY).toBe(1)
    expect(MUSCLE_WEIGHT_SECONDARY).toBe(0.5)
    expect(MUSCLE_WEIGHT_OTHER).toBe(0.3)
  })

  it('weights tonnage by role', () => {
    expect(weightedSetTonnage(10, 80, 'primary')).toBe(800)
    expect(weightedSetTonnage(10, 80, 'secondary')).toBe(400)
    expect(weightedSetTonnage(10, 80, 'other')).toBe(240)
  })
})

describe('backfillMuscleAttribution', () => {
  it('maps bench press tags', () => {
    expect(backfillMuscleAttribution(['chest', 'triceps', 'shoulders'])).toEqual({
      primary_muscle: 'chest',
      secondary_muscles: ['triceps', 'shoulders'],
      other_muscles: [],
    })
  })

  it('maps deadlift with four tags', () => {
    expect(
      backfillMuscleAttribution(['hamstrings', 'glutes', 'back', 'core']),
    ).toEqual({
      primary_muscle: 'hamstrings',
      secondary_muscles: ['glutes', 'back'],
      other_muscles: ['core'],
    })
  })

  it('maps single-muscle isolation', () => {
    expect(backfillMuscleAttribution(['biceps'])).toEqual({
      primary_muscle: 'biceps',
      secondary_muscles: [],
      other_muscles: [],
    })
  })
})

describe('expandMuscleContributions', () => {
  it('expands all tiers with weights', () => {
    const rows = expandMuscleContributions({
      primary_muscle: 'chest',
      secondary_muscles: ['triceps'],
      other_muscles: ['shoulders'],
    })
    expect(rows).toHaveLength(3)
    expect(rows.map((r) => r.weight)).toEqual([1, 0.5, 0.3])
  })
})

describe('validateMuscleAttribution', () => {
  it('rejects duplicate muscles across tiers', () => {
    const err = validateMuscleAttribution({
      primary_muscle: 'chest',
      secondary_muscles: ['chest'],
      other_muscles: [],
    })
    expect(err).toBeTruthy()
  })

  it('buildMuscleGroups round-trips backfill order', () => {
    const attr = backfillMuscleAttribution(['chest', 'triceps', 'shoulders', 'core'])
    expect(buildMuscleGroups(attr)).toEqual([
      'chest',
      'triceps',
      'shoulders',
      'core',
    ])
  })
})
