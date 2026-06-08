import type { Database } from '@/lib/database.types'

export type SetType = Database['public']['Enums']['set_type']
export type MovementType = Database['public']['Enums']['movement_type']

export type SetRow = {
  clientId: string
  setNumber: number
  setType: SetType
  reps: string
  weightDisplay: string
  rpe: string
}

export type SessionExercise = {
  clientId: string
  exerciseId: string
  sets: SetRow[]
}

export type WorkoutMode = 'new' | 'edit'

export type WorkoutDraft = {
  mode: WorkoutMode
  workoutId?: string
  date: string
  notes: string
  durationMinutes: string
  programId: string | null
  exercises: SessionExercise[]
}

export type SetFieldErrors = {
  reps?: string
  weightDisplay?: string
  rpe?: string
}

export type ValidationErrors = Record<string, SetFieldErrors>

export function setErrorKey(exerciseClientId: string, setClientId: string) {
  return `${exerciseClientId}:${setClientId}`
}

export function newClientId() {
  return crypto.randomUUID()
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function emptySetRow(
  setNumber: number,
  partial?: Partial<Pick<SetRow, 'reps' | 'weightDisplay' | 'rpe' | 'setType'>>,
): SetRow {
  return {
    clientId: newClientId(),
    setNumber,
    setType: partial?.setType ?? 'working',
    reps: partial?.reps ?? '',
    weightDisplay: partial?.weightDisplay ?? '',
    rpe: partial?.rpe ?? '',
  }
}
