import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/hooks/useExercises'

const EXERCISE_COLUMNS =
  'id, name, movement_type, muscle_groups, primary_muscle, secondary_muscles, other_muscles, category, is_compound, is_tracked, user_id, created_at, updated_at, e1rm_formula'

export async function fetchExercises(userId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select(EXERCISE_COLUMNS)
    .eq('user_id', userId)
    .order('name')

  if (error) throw error
  return data as Exercise[]
}

export const exercisesQueryKey = (userId: string) =>
  queryKeys.exercises(userId)
