import type { DisplayUnit } from '@/lib/units'
import { lbsToKg } from '@/lib/units'
import {
  setErrorKey,
  type SessionExercise,
  type SetFieldErrors,
  type ValidationErrors,
} from '@/lib/workout/types'

export type ValidationSummary = {
  errors: ValidationErrors
  errorCount: number
  messages: string[]
}

function parsePositiveNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function parseNonNegativeNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function parseRpe(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 6 || n > 10) return null
  if (Math.round(n * 2) !== n * 2) return null
  return n
}

export function validateWorkoutSession(
  exercises: SessionExercise[],
): ValidationSummary {
  const errors: ValidationErrors = {}
  const messages: string[] = []
  let missingRpe = 0
  let invalidReps = 0
  let invalidWeight = 0

  if (exercises.length === 0) {
    messages.push('Add at least one exercise')
  }

  for (const exercise of exercises) {
    if (exercise.sets.length === 0) {
      messages.push('Each exercise needs at least one set')
      continue
    }

    for (const set of exercise.sets) {
      const key = setErrorKey(exercise.clientId, set.clientId)
      const fieldErrors: SetFieldErrors = {}

      if (!parsePositiveNumber(set.reps)) {
        fieldErrors.reps = 'Reps required'
        invalidReps += 1
      }

      if (parseNonNegativeNumber(set.weightDisplay) === null) {
        fieldErrors.weightDisplay = 'Weight required'
        invalidWeight += 1
      }

      if (set.setType === 'working') {
        if (!parseRpe(set.rpe)) {
          fieldErrors.rpe = 'RPE required (6–10)'
          missingRpe += 1
        }
      } else if (set.rpe.trim() && !parseRpe(set.rpe)) {
        fieldErrors.rpe = 'RPE must be 6–10'
      }

      if (Object.keys(fieldErrors).length > 0) {
        errors[key] = fieldErrors
      }
    }
  }

  if (missingRpe > 0) {
    messages.push(
      `${missingRpe} working set${missingRpe === 1 ? '' : 's'} missing RPE`,
    )
  }
  if (invalidReps > 0) {
    messages.push(`${invalidReps} set${invalidReps === 1 ? '' : 's'} with invalid reps`)
  }
  if (invalidWeight > 0) {
    messages.push(`${invalidWeight} set${invalidWeight === 1 ? '' : 's'} with invalid weight`)
  }

  return {
    errors,
    errorCount: Object.keys(errors).length + (exercises.length === 0 ? 1 : 0),
    messages,
  }
}

export function displayWeightToKg(
  value: string,
  unit: DisplayUnit,
): number {
  const n = parseNonNegativeNumber(value)
  if (n === null) throw new Error('Invalid weight')
  return unit === 'lbs' ? lbsToKg(n) : n
}

export function kgToDisplayWeight(kg: number, unit: DisplayUnit): string {
  const value = unit === 'lbs' ? kg * 2.2046226218 : kg
  const rounded = Math.round(value * 10) / 10
  return String(rounded)
}
