import type { Database } from '@/lib/database.types'

export const GROW_EXPORT_VERSION = 1 as const

export type GrowMovementType = Database['public']['Enums']['movement_type']
export type GrowSetType = Database['public']['Enums']['set_type']

export type GrowExportExercise = {
  name: string
  movement_type: GrowMovementType
  category: string | null
  muscle_groups: string[]
  primary_muscle: string | null
  secondary_muscles: string[]
  other_muscles: string[]
  is_compound: boolean
  is_tracked: boolean
}

export type GrowExportWorkout = {
  date: string
  duration_minutes: number | null
  notes: string | null
  sets: {
    exercise_key: { name: string; movement_type: GrowMovementType }
    set_number: number
    set_type: GrowSetType
    reps: number
    weight_kg: number
    rpe: number | null
    notes: string | null
  }[]
}

export type GrowExportProgram = {
  name: string
  notes: string | null
  exercise_keys: { name: string; movement_type: GrowMovementType }[]
}

export type GrowExportV1 = {
  grow_version: typeof GROW_EXPORT_VERSION
  exported_at: string
  display_unit_hint: 'kg' | 'lbs'
  exercises: GrowExportExercise[]
  workouts: GrowExportWorkout[]
  programs?: GrowExportProgram[]
}

export type ImportPreview = {
  exerciseCount: number
  workoutCount: number
  dateRange: { start: string; end: string } | null
  programCount: number
}

export type ImportMode = 'merge' | 'replace'
