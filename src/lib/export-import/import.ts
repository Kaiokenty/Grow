import { refreshAnalytics } from '@/hooks/useWorkouts'
import { supabase } from '@/lib/supabase'
import type {
  GrowExportExercise,
  GrowExportV1,
  ImportMode,
  ImportPreview,
} from '@/lib/export-import/types'
import { GROW_EXPORT_VERSION } from '@/lib/export-import/types'

function exerciseKey(name: string, movementType: string) {
  return `${name}::${movementType}`
}

export function parseGrowExport(raw: unknown): GrowExportV1 {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid export file')
  }

  const data = raw as GrowExportV1
  if (data.grow_version !== GROW_EXPORT_VERSION) {
    throw new Error(`Unsupported export version: ${String(data.grow_version)}`)
  }
  if (!Array.isArray(data.exercises) || !Array.isArray(data.workouts)) {
    throw new Error('Export missing exercises or workouts')
  }

  return data
}

export function previewImport(data: GrowExportV1): ImportPreview {
  const dates = data.workouts.map((w) => w.date).sort()
  return {
    exerciseCount: data.exercises.length,
    workoutCount: data.workouts.length,
    dateRange:
      dates.length > 0
        ? { start: dates[0]!, end: dates[dates.length - 1]! }
        : null,
    programCount: data.programs?.length ?? 0,
  }
}

function backfillMuscles(exercise: GrowExportExercise) {
  if (exercise.primary_muscle) {
    return {
      primary_muscle: exercise.primary_muscle,
      secondary_muscles: exercise.secondary_muscles,
      other_muscles: exercise.other_muscles,
      muscle_groups: exercise.muscle_groups,
    }
  }

  const groups = exercise.muscle_groups ?? []
  return {
    primary_muscle: groups[0] ?? 'chest',
    secondary_muscles: groups.slice(1, 3),
    other_muscles: groups.slice(3, 6),
    muscle_groups: groups,
  }
}

async function resolveExerciseId(
  userId: string,
  exercise: GrowExportExercise,
  cache: Map<string, string>,
): Promise<string> {
  const key = exerciseKey(exercise.name, exercise.movement_type)
  const cached = cache.get(key)
  if (cached) return cached

  const { data: existing } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', userId)
    .eq('name', exercise.name)
    .eq('movement_type', exercise.movement_type)
    .maybeSingle()

  if (existing?.id) {
    cache.set(key, existing.id)
    return existing.id
  }

  const muscles = backfillMuscles(exercise)
  const { data: created, error } = await supabase
    .from('exercises')
    .insert({
      user_id: userId,
      name: exercise.name,
      movement_type: exercise.movement_type,
      category: exercise.category,
      muscle_groups: muscles.muscle_groups,
      primary_muscle: muscles.primary_muscle,
      secondary_muscles: muscles.secondary_muscles,
      other_muscles: muscles.other_muscles,
      is_compound: exercise.is_compound,
      is_tracked: exercise.is_tracked,
    })
    .select('id')
    .single()

  if (error) throw error
  cache.set(key, created.id)
  return created.id
}

export async function importUserData(
  userId: string,
  data: GrowExportV1,
  mode: ImportMode,
): Promise<void> {
  if (mode === 'replace') {
    const { error: workoutDeleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', userId)
    if (workoutDeleteError) throw workoutDeleteError

    if (data.programs?.length) {
      const { error: programDeleteError } = await supabase
        .from('programs')
        .delete()
        .eq('user_id', userId)
      if (programDeleteError) throw programDeleteError
    }
  }

  const exerciseCache = new Map<string, string>()
  for (const exercise of data.exercises) {
    await resolveExerciseId(userId, exercise, exerciseCache)
  }

  for (const workout of data.workouts) {
    const { data: createdWorkout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: userId,
        date: workout.date,
        duration_minutes: workout.duration_minutes,
        notes: workout.notes,
      })
      .select('id')
      .single()

    if (workoutError) throw workoutError

    if (workout.sets.length > 0) {
      const setRows = []
      for (const set of workout.sets) {
        const exercise =
          data.exercises.find(
            (row) =>
              row.name === set.exercise_key.name &&
              row.movement_type === set.exercise_key.movement_type,
          ) ??
          ({
            name: set.exercise_key.name,
            movement_type: set.exercise_key.movement_type,
            category: null,
            muscle_groups: [],
            primary_muscle: null,
            secondary_muscles: [],
            other_muscles: [],
            is_compound: false,
            is_tracked: false,
          } satisfies GrowExportExercise)

        const exerciseId = await resolveExerciseId(userId, exercise, exerciseCache)
        setRows.push({
          workout_id: createdWorkout.id,
          exercise_id: exerciseId,
          set_number: set.set_number,
          set_type: set.set_type,
          reps: set.reps,
          weight_kg: set.weight_kg,
          rpe: set.rpe,
          notes: set.notes,
        })
      }

      const { error: setsError } = await supabase.from('sets').insert(setRows)
      if (setsError) throw setsError
    }
  }

  if (data.programs?.length) {
    for (const program of data.programs) {
      const { data: createdProgram, error: programError } = await supabase
        .from('programs')
        .insert({
          user_id: userId,
          name: program.name,
          notes: program.notes,
        })
        .select('id')
        .single()

      if (programError) throw programError

      const rows = []
      for (let i = 0; i < program.exercise_keys.length; i++) {
        const key = program.exercise_keys[i]!
        const exercise =
          data.exercises.find(
            (row) =>
              row.name === key.name && row.movement_type === key.movement_type,
          ) ??
          ({
            name: key.name,
            movement_type: key.movement_type,
            category: null,
            muscle_groups: [],
            primary_muscle: null,
            secondary_muscles: [],
            other_muscles: [],
            is_compound: false,
            is_tracked: false,
          } satisfies GrowExportExercise)

        const exerciseId = await resolveExerciseId(userId, exercise, exerciseCache)
        rows.push({
          program_id: createdProgram.id,
          exercise_id: exerciseId,
          sort_order: i,
        })
      }

      if (rows.length > 0) {
        const { error: peError } = await supabase
          .from('program_exercises')
          .insert(rows)
        if (peError) throw peError
      }
    }
  }

  await refreshAnalytics(userId)
}
