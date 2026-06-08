import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { DisplayUnit } from '@/lib/units'
import {
  fetchWorkoutsPage,
  WORKOUTS_PAGE_SIZE,
  workoutsQueryKey,
} from '@/lib/api/workouts'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import { displayWeightToKg, kgToDisplayWeight } from '@/lib/workout/validation'
import {
  emptySetRow,
  newClientId,
  type SessionExercise,
  type WorkoutDraft,
} from '@/lib/workout/types'
import type { Database } from '@/lib/database.types'

export type Workout = Database['public']['Tables']['workouts']['Row']
export type WorkoutSet = Database['public']['Tables']['sets']['Row']

export type WorkoutListItem = Workout & {
  exercise_count: number
}

export type SaveWorkoutInput = {
  userId: string
  draft: WorkoutDraft
  displayUnit: DisplayUnit
}

export function useWorkouts(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: workoutsQueryKey(userId ?? ''),
    enabled: Boolean(userId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => fetchWorkoutsPage(pageParam),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length < WORKOUTS_PAGE_SIZE
        ? undefined
        : lastPageParam + WORKOUTS_PAGE_SIZE,
  })
}

export function useWorkoutDetail(workoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workout(workoutId ?? ''),
    enabled: Boolean(workoutId),
    queryFn: async () => {
      const { data: workout, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId!)
        .single()

      if (error) throw error
      return workout as Workout
    },
  })
}

export function useWorkoutSets(workoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workoutSets(workoutId ?? ''),
    enabled: Boolean(workoutId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sets')
        .select('*')
        .eq('workout_id', workoutId!)
        .order('set_number')

      if (error) throw error
      return data as WorkoutSet[]
    },
  })
}

export function workoutSetsToSessionExercises(
  sets: WorkoutSet[],
  displayUnit: DisplayUnit,
): SessionExercise[] {
  const byExercise = new Map<string, WorkoutSet[]>()
  for (const set of sets) {
    if (!byExercise.has(set.exercise_id)) byExercise.set(set.exercise_id, [])
    byExercise.get(set.exercise_id)!.push(set)
  }

  const exerciseIds = [...byExercise.keys()].sort((a, b) => {
    const aTime = Math.min(
      ...byExercise.get(a)!.map((s) => new Date(s.created_at).getTime()),
    )
    const bTime = Math.min(
      ...byExercise.get(b)!.map((s) => new Date(s.created_at).getTime()),
    )
    return aTime - bTime
  })

  return exerciseIds.map((exerciseId) => {
    const exerciseSets = [...byExercise.get(exerciseId)!].sort(
      (a, b) => a.set_number - b.set_number,
    )

    return {
      clientId: newClientId(),
      exerciseId,
      sets: exerciseSets.map((set) =>
        emptySetRow(set.set_number, {
          setType: set.set_type,
          reps: String(set.reps),
          weightDisplay: kgToDisplayWeight(Number(set.weight_kg), displayUnit),
          rpe: set.rpe != null ? String(set.rpe) : '',
        }),
      ),
    }
  })
}

async function saveWorkoutToDb({ userId, draft, displayUnit }: SaveWorkoutInput) {
  const duration = draft.durationMinutes.trim()
    ? Number(draft.durationMinutes)
    : null

  const workoutPayload = {
    date: draft.date,
    notes: draft.notes.trim() || null,
    duration_minutes:
      duration != null && Number.isFinite(duration) ? Math.round(duration) : null,
    program_id: draft.programId,
  }

  let workoutId = draft.workoutId

  if (draft.mode === 'edit' && workoutId) {
    const { error } = await supabase
      .from('workouts')
      .update(workoutPayload)
      .eq('id', workoutId)
      .eq('user_id', userId)

    if (error) throw error

    const { error: deleteError } = await supabase
      .from('sets')
      .delete()
      .eq('workout_id', workoutId)

    if (deleteError) throw deleteError
  } else {
    const { data, error } = await supabase
      .from('workouts')
      .insert({ ...workoutPayload, user_id: userId })
      .select('id')
      .single()

    if (error) throw error
    workoutId = data.id
  }

  const setRows = draft.exercises.flatMap((exercise) =>
    exercise.sets.map((set) => ({
      workout_id: workoutId!,
      exercise_id: exercise.exerciseId,
      set_number: set.setNumber,
      set_type: set.setType,
      reps: Number(set.reps),
      weight_kg: displayWeightToKg(set.weightDisplay, displayUnit),
      rpe: set.rpe.trim() ? Number(set.rpe) : null,
    })),
  )

  if (setRows.length > 0) {
    const { error: insertError } = await supabase.from('sets').insert(setRows)
    if (insertError) throw insertError
  }

  return workoutId!
}

export function useSaveWorkout(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Omit<SaveWorkoutInput, 'userId'>) => {
      if (!userId) throw new Error('Not signed in')
      return saveWorkoutToDb({ ...input, userId })
    },
    onSuccess: () => {
      if (!userId) return
      void queryClient.invalidateQueries({ queryKey: workoutsQueryKey(userId) })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recentExercises(userId),
      })
      void queryClient.invalidateQueries({
        queryKey: ['weeklySummary', userId],
      })
    },
  })
}

export function useDeleteWorkout(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workoutId: string) => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)

      if (error) throw error
    },
    onSuccess: () => {
      if (!userId) return
      void queryClient.invalidateQueries({ queryKey: workoutsQueryKey(userId) })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recentExercises(userId),
      })
      void queryClient.invalidateQueries({
        queryKey: ['weeklySummary', userId],
      })
    },
  })
}
