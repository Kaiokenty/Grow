import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import type { WorkoutListItem } from '@/hooks/useWorkouts'

export const WORKOUTS_PAGE_SIZE = 25

export type DashboardSummaryRpc = {
  workouts_this_week: number
  weekly_tonnage_kg: number
  rolling_7d_avg_rpe: number | null
  total_workouts: number
}

export async function fetchDashboardSummary(
  weekStartDay: number,
): Promise<DashboardSummaryRpc> {
  const { data, error } = await supabase.rpc('get_dashboard_summary', {
    p_week_start_day: weekStartDay,
  })

  if (error) throw error
  return data as DashboardSummaryRpc
}

export async function fetchWorkoutsPage(
  offset: number,
): Promise<WorkoutListItem[]> {
  const { data, error } = await supabase.rpc('list_workouts', {
    p_limit: WORKOUTS_PAGE_SIZE,
    p_offset: offset,
  })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    date: row.date,
    duration_minutes: row.duration_minutes,
    notes: row.notes,
    program_id: row.program_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    exercise_count: Number(row.exercise_count),
  }))
}

export const dashboardSummaryQueryKey = (
  userId: string,
  weekStartDay: number,
) => queryKeys.weeklySummary(userId, weekStartDay)

export const workoutsQueryKey = (userId: string) =>
  queryKeys.workouts(userId)
