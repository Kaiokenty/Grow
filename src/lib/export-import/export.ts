import { supabase } from '@/lib/supabase'
import type {
  GrowExportV1,
  GrowMovementType,
} from '@/lib/export-import/types'
import { GROW_EXPORT_VERSION } from '@/lib/export-import/types'

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function exportUserData(userId: string): Promise<GrowExportV1> {
  const [{ data: settings }, { data: exercises }, { data: workouts }] =
    await Promise.all([
      supabase
        .from('users_settings')
        .select('display_unit')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('exercises')
        .select(
          'name, movement_type, category, muscle_groups, primary_muscle, secondary_muscles, other_muscles, is_compound, is_tracked',
        )
        .eq('user_id', userId)
        .order('name'),
      supabase
        .from('workouts')
        .select('id, date, duration_minutes, notes')
        .eq('user_id', userId)
        .order('date'),
    ])

  const workoutIds = (workouts ?? []).map((w) => w.id)
  const { data: sets } =
    workoutIds.length > 0
      ? await supabase
          .from('sets')
          .select(
            'workout_id, set_number, set_type, reps, weight_kg, rpe, notes, exercises(name, movement_type)',
          )
          .in('workout_id', workoutIds)
          .order('set_number')
      : { data: [] as never[] }

  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, notes')
    .eq('user_id', userId)
    .order('name')

  const programRows = programs ?? []
  const { data: programExercises } =
    programRows.length > 0
      ? await supabase
          .from('program_exercises')
          .select('program_id, sort_order, exercises(name, movement_type)')
          .in(
            'program_id',
            programRows.map((p) => p.id),
          )
          .order('sort_order')
      : { data: [] as never[] }

  type ExportSetRow = {
    workout_id: string
    set_number: number
    set_type: 'working' | 'warmup'
    reps: number
    weight_kg: number
    rpe: number | null
    notes: string | null
    exercises: { name: string; movement_type: GrowMovementType }
  }

  const setsByWorkout = new Map<string, ExportSetRow[]>()
  for (const set of (sets ?? []) as ExportSetRow[]) {
    const list = setsByWorkout.get(set.workout_id) ?? []
    list.push(set)
    setsByWorkout.set(set.workout_id, list)
  }

  const exportData: GrowExportV1 = {
    grow_version: GROW_EXPORT_VERSION,
    exported_at: new Date().toISOString(),
    display_unit_hint: settings?.display_unit ?? 'kg',
    exercises: (exercises ?? []).map((ex) => ({
      name: ex.name,
      movement_type: ex.movement_type,
      category: ex.category,
      muscle_groups: ex.muscle_groups ?? [],
      primary_muscle: ex.primary_muscle,
      secondary_muscles: ex.secondary_muscles ?? [],
      other_muscles: ex.other_muscles ?? [],
      is_compound: ex.is_compound,
      is_tracked: ex.is_tracked,
    })),
    workouts: (workouts ?? []).map((workout) => ({
      date: workout.date,
      duration_minutes: workout.duration_minutes,
      notes: workout.notes,
      sets: (setsByWorkout.get(workout.id) ?? []).map((set) => {
        return {
          exercise_key: {
            name: set.exercises.name,
            movement_type: set.exercises.movement_type,
          },
          set_number: set.set_number,
          set_type: set.set_type,
          reps: set.reps,
          weight_kg: Number(set.weight_kg),
          rpe: set.rpe != null ? Number(set.rpe) : null,
          notes: set.notes,
        }
      }),
    })),
    programs: programRows.map((program) => ({
      name: program.name,
      notes: program.notes,
      exercise_keys: (programExercises ?? [])
        .filter((row) => row.program_id === program.id)
        .map((row) => {
          const exercise = row.exercises as {
            name: string
            movement_type: GrowMovementType
          }
          return {
            name: exercise.name,
            movement_type: exercise.movement_type,
          }
        }),
    })),
  }

  return exportData
}

export async function downloadUserExport(userId: string) {
  const data = await exportUserData(userId)
  const date = new Date().toISOString().slice(0, 10)
  downloadJson(`grow-export-${date}.json`, data)
}
