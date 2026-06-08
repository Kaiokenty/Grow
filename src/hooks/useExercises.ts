import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exercisesQueryKey, fetchExercises } from '@/lib/api/exercises'
import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

export type Exercise = Database['public']['Tables']['exercises']['Row']
type ExerciseInsert = Database['public']['Tables']['exercises']['Insert']
type ExerciseUpdate = Database['public']['Tables']['exercises']['Update']

type UseExercisesOptions = {
  enabled?: boolean
}

export function useExercises(
  userId: string | undefined,
  options?: UseExercisesOptions,
) {
  const enabled = options?.enabled ?? true

  return useQuery({
    queryKey: exercisesQueryKey(userId ?? ''),
    enabled: Boolean(userId) && enabled,
    queryFn: () => fetchExercises(userId!),
  })
}

export function useCreateExercise(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Omit<ExerciseInsert, 'user_id'>) => {
      if (!userId) throw new Error('Not signed in')

      const { data, error } = await supabase
        .from('exercises')
        .insert({ ...input, user_id: userId })
        .select('*')
        .single()

      if (error) throw error
      return data as Exercise
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.exercises(userId),
        })
      }
    },
  })
}

export function useUpdateExercise(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: ExerciseUpdate
    }) => {
      const { data, error } = await supabase
        .from('exercises')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data as Exercise
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.exercises(userId),
        })
      }
    },
  })
}

export type LastSessionSet = {
  reps: number
  weight_kg: number
  rpe: number | null
  set_type: Database['public']['Enums']['set_type']
}

let cachedWorkoutIds: {
  userId: string
  ids: string[]
  fetchedAt: number
} | null = null

const WORKOUT_IDS_CACHE_MS = 60_000

async function getRecentWorkoutIds(userId: string, excludeWorkoutId?: string) {
  const now = Date.now()
  if (
    cachedWorkoutIds?.userId === userId &&
    now - cachedWorkoutIds.fetchedAt < WORKOUT_IDS_CACHE_MS
  ) {
    return cachedWorkoutIds.ids.filter((id) => id !== excludeWorkoutId)
  }

  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('id')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30)

  if (error) throw error

  const ids = (workouts ?? []).map((w) => w.id)
  cachedWorkoutIds = { userId, ids, fetchedAt: now }
  return ids.filter((id) => id !== excludeWorkoutId)
}

export function useRecentExercises(
  userId: string | undefined,
  enabled = true,
  limit = 10,
) {
  return useQuery({
    queryKey: queryKeys.recentExercises(userId ?? ''),
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId!)
        .order('date', { ascending: false })
        .limit(20)

      if (workoutsError) throw workoutsError
      if (!workouts?.length) return [] as Exercise[]

      const workoutIds = workouts.map((w) => w.id)
      const { data: sets, error: setsError } = await supabase
        .from('sets')
        .select('exercise_id, created_at')
        .in('workout_id', workoutIds)
        .order('created_at', { ascending: false })

      if (setsError) throw setsError

      const seen = new Set<string>()
      const orderedIds: string[] = []
      for (const set of sets ?? []) {
        if (seen.has(set.exercise_id)) continue
        seen.add(set.exercise_id)
        orderedIds.push(set.exercise_id)
        if (orderedIds.length >= limit) break
      }

      if (orderedIds.length === 0) return [] as Exercise[]

      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .in('id', orderedIds)

      if (exercisesError) throw exercisesError

      const byId = new Map((exercises ?? []).map((e) => [e.id, e as Exercise]))
      return orderedIds
        .map((id) => byId.get(id))
        .filter((e): e is Exercise => Boolean(e))
    },
  })
}

export async function fetchLastSessionSet(
  userId: string,
  exerciseId: string,
  excludeWorkoutId?: string,
) {
  const map = await fetchLastSessionSetsBatch(
    userId,
    [exerciseId],
    excludeWorkoutId,
  )
  return map.get(exerciseId) ?? null
}

export async function fetchLastSessionSetsBatch(
  userId: string,
  exerciseIds: string[],
  excludeWorkoutId?: string,
) {
  const uniqueIds = [...new Set(exerciseIds)]
  if (uniqueIds.length === 0) return new Map<string, LastSessionSet>()

  const workoutIds = await getRecentWorkoutIds(userId, excludeWorkoutId)
  if (workoutIds.length === 0) return new Map<string, LastSessionSet>()

  const { data, error } = await supabase
    .from('sets')
    .select('exercise_id, reps, weight_kg, rpe, set_type, created_at')
    .in('exercise_id', uniqueIds)
    .in('workout_id', workoutIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  const map = new Map<string, LastSessionSet>()
  for (const row of data ?? []) {
    if (map.has(row.exercise_id)) continue
    map.set(row.exercise_id, {
      reps: row.reps,
      weight_kg: Number(row.weight_kg),
      rpe: row.rpe != null ? Number(row.rpe) : null,
      set_type: row.set_type,
    })
  }

  return map
}
