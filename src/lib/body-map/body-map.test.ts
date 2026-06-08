import { describe, expect, it } from 'vitest'
import {
  GROW_MUSCLE_GROUPS,
  MUSCLE_TO_SLUGS,
  volumeToIntensity,
  muscleVolumeToBodyParts,
} from '@/lib/body-map'

const SEED_MUSCLE_GROUPS = [
  'quads',
  'glutes',
  'hamstrings',
  'back',
  'chest',
  'triceps',
  'shoulders',
  'biceps',
  'calves',
  'core',
  'rear_delts',
  'upper_back',
  'forearms',
] as const

describe('MUSCLE_TO_SLUGS', () => {
  it('covers every seed muscle_groups tag', () => {
    for (const tag of SEED_MUSCLE_GROUPS) {
      expect(MUSCLE_TO_SLUGS[tag as keyof typeof MUSCLE_TO_SLUGS]).toBeDefined()
      expect(MUSCLE_TO_SLUGS[tag as keyof typeof MUSCLE_TO_SLUGS].length).toBeGreaterThan(0)
    }
  })

  it('maps every GrowMuscleGroup', () => {
    for (const muscle of GROW_MUSCLE_GROUPS) {
      expect(MUSCLE_TO_SLUGS[muscle].length).toBeGreaterThan(0)
    }
  })
})

describe('volumeToIntensity', () => {
  it('returns 0 for zero or negative volume', () => {
    expect(volumeToIntensity(0, 100)).toBe(0)
    expect(volumeToIntensity(-5, 100)).toBe(0)
    expect(volumeToIntensity(50, 0)).toBe(0)
  })

  it('buckets into 1-4 by ratio of max', () => {
    expect(volumeToIntensity(100, 100)).toBe(4)
    expect(volumeToIntensity(80, 100)).toBe(4)
    expect(volumeToIntensity(60, 100)).toBe(3)
    expect(volumeToIntensity(40, 100)).toBe(2)
    expect(volumeToIntensity(10, 100)).toBe(1)
  })
})

describe('muscleVolumeToBodyParts', () => {
  it('maps chest to chest slug', () => {
    const parts = muscleVolumeToBodyParts({ chest: 5000 }, 4)
    expect(parts).toEqual([{ slug: 'chest', intensity: 4 }])
  })

  it('maps core to abs and obliques with same intensity', () => {
    const parts = muscleVolumeToBodyParts({ core: 3000 }, 4)
    expect(parts).toHaveLength(2)
    expect(parts).toContainEqual({ slug: 'abs', intensity: 4 })
    expect(parts).toContainEqual({ slug: 'obliques', intensity: 4 })
  })

  it('merges overlapping slugs using max intensity', () => {
    const parts = muscleVolumeToBodyParts(
      { back: 1000, upper_back: 9000 },
      4,
    )
    const upperBack = parts.find((p) => p.slug === 'upper-back')
    expect(upperBack?.intensity).toBe(4)
    expect(parts.filter((p) => p.slug === 'upper-back')).toHaveLength(1)
  })

  it('omits untrained muscles', () => {
    const parts = muscleVolumeToBodyParts({ core: 0, chest: 5000 }, 4)
    expect(parts.some((p) => p.slug === 'abs')).toBe(false)
    expect(parts.some((p) => p.slug === 'obliques')).toBe(false)
  })
})
