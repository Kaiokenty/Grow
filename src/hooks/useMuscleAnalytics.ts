import { useQuery } from '@tanstack/react-query'
import {
  fetchMuscleHeatmap,
  fetchMuscleVolumeHistory,
  fetchMuscleWeekStats,
  fetchFatigueSummary,
  fetchWeeklySummaryNlg,
  fetchWeeklyVolumeHistory,
  fetchExercisePerformanceHistory,
  muscleHeatmapQueryKey,
  muscleWeekStatsQueryKey,
  fatigueSummaryQueryKey,
  weeklyNlgQueryKey,
} from '@/lib/api/analytics'
import { queryKeys } from '@/lib/query-keys'
import type { GrowMuscleGroup } from '@/lib/body-map'

export function useMuscleHeatmap(
  userId: string | undefined,
  weekStartDay: number,
  rangeWeeks = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: muscleHeatmapQueryKey(userId ?? '', weekStartDay, rangeWeeks),
    enabled: Boolean(userId) && enabled,
    queryFn: () => fetchMuscleHeatmap(weekStartDay, rangeWeeks),
  })
}

export function useMuscleWeekStats(
  userId: string | undefined,
  muscle: GrowMuscleGroup | null,
  weekStartDay: number,
  rangeWeeks = 1,
) {
  return useQuery({
    queryKey: muscleWeekStatsQueryKey(
      userId ?? '',
      muscle ?? '',
      weekStartDay,
      rangeWeeks,
    ),
    enabled: Boolean(userId) && Boolean(muscle),
    queryFn: () => fetchMuscleWeekStats(muscle!, weekStartDay, rangeWeeks),
  })
}

export function useMuscleVolumeHistory(
  userId: string | undefined,
  muscle: GrowMuscleGroup | null,
  weeks: number,
) {
  return useQuery({
    queryKey: queryKeys.muscleVolumeHistory(userId ?? '', muscle ?? '', weeks),
    enabled: Boolean(userId) && Boolean(muscle),
    queryFn: () => fetchMuscleVolumeHistory(muscle!, weeks),
  })
}

export function useFatigueSummary(userId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: fatigueSummaryQueryKey(userId ?? ''),
    enabled: Boolean(userId) && enabled,
    queryFn: fetchFatigueSummary,
  })
}

export function useWeeklySummaryNlg(
  userId: string | undefined,
  weekStartDay: number,
  enabled = true,
) {
  return useQuery({
    queryKey: weeklyNlgQueryKey(userId ?? '', weekStartDay),
    enabled: Boolean(userId) && enabled,
    queryFn: () => fetchWeeklySummaryNlg(weekStartDay),
  })
}

export function useWeeklyVolumeHistory(
  userId: string | undefined,
  weeks: number,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.weeklyVolumeHistory(userId ?? '', weeks),
    enabled: Boolean(userId) && enabled,
    queryFn: () => fetchWeeklyVolumeHistory(userId!, weeks),
  })
}

export function useExercisePerformanceHistory(
  userId: string | undefined,
  weeks: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['exercisePerformanceHistory', userId, weeks],
    enabled: Boolean(userId) && enabled,
    queryFn: () => fetchExercisePerformanceHistory(userId!, weeks),
  })
}
