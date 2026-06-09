import { queryKeys } from '@/lib/query-keys'
import { supabase } from '@/lib/supabase'
import type { GrowMuscleGroup } from '@/lib/body-map'

export type MuscleHeatmapRow = {
  muscle: GrowMuscleGroup
  weighted_tonnage_kg: number
  sets: number
  avg_rpe: number | null
}

export type MuscleWeekStats = {
  muscle: GrowMuscleGroup
  week_start: string
  range_end?: string
  period_weeks?: number
  weighted_tonnage_kg: number
  weighted_tonnage_kg_total?: number
  sets: number
  sets_total?: number
  session_count?: number
  avg_rpe: number | null
  prior_week_delta_pct: number | null
  rolling_7d_avg_rpe: number | null
  current_week_in_progress?: boolean
  top_exercises: {
    exercise_id: string
    name: string
    weighted_tonnage_kg: number
    sets: number
  }[]
}

export type MuscleVolumeHistoryPoint = {
  week_start: string
  weighted_tonnage_kg: number
}

export type FatigueSummary = {
  deload_score: number
  deload_tier: 'lean' | 'moderate' | 'strong'
  deload_reason: string
  rolling_7d_avg_rpe: number | null
  rpe_trend: number | null
  performance_drop_detected: boolean
  stalled_exercises: string[]
}

export type WeeklySummaryNlg = {
  lines: string[]
  text: string
}

export async function fetchMuscleHeatmap(
  weekStartDay: number,
  rangeWeeks = 1,
): Promise<MuscleHeatmapRow[]> {
  const { data, error } = await supabase.rpc('get_dashboard_muscle_heatmap', {
    p_week_start_day: weekStartDay,
    p_weeks: rangeWeeks,
  })
  if (error) throw error
  return (data ?? []) as MuscleHeatmapRow[]
}

export async function fetchMuscleWeekStats(
  muscle: GrowMuscleGroup,
  weekStartDay: number,
  rangeWeeks = 1,
): Promise<MuscleWeekStats> {
  const { data, error } = await supabase.rpc('get_muscle_week_stats', {
    p_muscle: muscle,
    p_week_start_day: weekStartDay,
    p_weeks: rangeWeeks,
  })
  if (error) throw error
  return data as MuscleWeekStats
}

export async function fetchMuscleVolumeHistory(
  muscle: GrowMuscleGroup,
  weeks: number,
): Promise<MuscleVolumeHistoryPoint[]> {
  const { data, error } = await supabase.rpc('get_muscle_volume_history', {
    p_muscle: muscle,
    p_weeks: weeks,
  })
  if (error) throw error
  return (data ?? []) as MuscleVolumeHistoryPoint[]
}

export async function fetchFatigueSummary(): Promise<FatigueSummary> {
  const { data, error } = await supabase.rpc('get_fatigue_summary')
  if (error) throw error
  const summary = data as FatigueSummary
  return {
    ...summary,
    stalled_exercises: summary.stalled_exercises ?? [],
  }
}

export async function fetchWeeklySummaryNlg(
  weekStartDay: number,
): Promise<WeeklySummaryNlg> {
  const { data, error } = await supabase.rpc('get_weekly_summary_nlg', {
    p_week_start_day: weekStartDay,
  })
  if (error) throw error
  return data as WeeklySummaryNlg
}

export async function fetchWeeklyVolumeHistory(
  userId: string,
  weeks: number,
) {
  let query = supabase
    .from('weekly_volume')
    .select('week_start, tonnage, total_sets, compound_volume, avg_rpe')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })

  if (weeks > 0) {
    query = query.limit(weeks)
  } else {
    query = query.limit(200)
  }

  const { data, error } = await query
  if (error) throw error
  return [...(data ?? [])].reverse()
}

export async function fetchExercisePerformanceHistory(
  userId: string,
  weeks: number,
) {
  const limit = weeks > 0 ? weeks * 20 : 2000
  const { data, error } = await supabase
    .from('exercise_performance')
    .select('week_start, exercise_id, e1rm, weekly_volume, exercises(name, is_tracked)')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export const muscleHeatmapQueryKey = (
  userId: string,
  weekStartDay: number,
  rangeWeeks: number,
) => queryKeys.muscleHeatmap(userId, weekStartDay, rangeWeeks)

export const muscleWeekStatsQueryKey = (
  userId: string,
  muscle: string,
  weekStartDay: number,
  rangeWeeks: number,
) => queryKeys.muscleWeekStats(userId, muscle, weekStartDay, rangeWeeks)

export const fatigueSummaryQueryKey = (userId: string) =>
  queryKeys.fatigueSummary(userId)

export const weeklyNlgQueryKey = (userId: string, weekStartDay: number) =>
  queryKeys.weeklyNlg(userId, weekStartDay)
