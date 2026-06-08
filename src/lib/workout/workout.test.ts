import { describe, expect, it } from 'vitest'
import { clearWorkoutDraft, loadWorkoutDraft, saveWorkoutDraft } from '@/lib/workout-draft'
import { displayWeightToKg, kgToDisplayWeight, validateWorkoutSession } from '@/lib/workout/validation'
import { emptySetRow, newClientId, type SessionExercise } from '@/lib/workout/types'

describe('validateWorkoutSession', () => {
  it('requires RPE on working sets', () => {
    const exercise: SessionExercise = {
      clientId: newClientId(),
      exerciseId: 'ex-1',
      sets: [
        emptySetRow(1, {
          reps: '8',
          weightDisplay: '100',
          rpe: '',
          setType: 'working',
        }),
      ],
    }

    const result = validateWorkoutSession([exercise])
    expect(result.errorCount).toBeGreaterThan(0)
    expect(result.messages.some((m) => m.includes('RPE'))).toBe(true)
  })

  it('allows empty RPE on warmups', () => {
    const exercise: SessionExercise = {
      clientId: newClientId(),
      exerciseId: 'ex-1',
      sets: [
        emptySetRow(1, {
          reps: '8',
          weightDisplay: '60',
          rpe: '',
          setType: 'warmup',
        }),
      ],
    }

    const result = validateWorkoutSession([exercise])
    expect(result.errorCount).toBe(0)
  })
})

describe('weight conversion', () => {
  it('round-trips kg through display values', () => {
    const display = kgToDisplayWeight(100, 'kg')
    expect(displayWeightToKg(display, 'kg')).toBe(100)
  })

  it('converts lbs input to kg', () => {
    expect(displayWeightToKg('220', 'lbs')).toBeCloseTo(99.79, 1)
  })
})

describe('workout draft storage', () => {
  it('saves and loads draft by user id', () => {
    const userId = 'user-test-1'
    clearWorkoutDraft(userId)

    const draft = {
      mode: 'new' as const,
      date: '2026-06-07',
      notes: 'test',
      durationMinutes: '',
      programId: null,
      exercises: [],
    }

    saveWorkoutDraft(userId, draft)
    expect(loadWorkoutDraft(userId)).toEqual(draft)
    clearWorkoutDraft(userId)
  })
})
