import { useQuery } from '@tanstack/react-query'
import {
  dashboardSummaryQueryKey,
  fetchDashboardSummary,
  type DashboardSummaryRpc,
} from '@/lib/api/workouts'

export type WeeklySummary = {
  workoutsThisWeek: number
  weeklyTonnageKg: number
  rolling7dAvgRpe: number | null
  totalWorkouts: number
}

function mapSummary(data: DashboardSummaryRpc): WeeklySummary {
  return {
    workoutsThisWeek: data.workouts_this_week,
    weeklyTonnageKg: data.weekly_tonnage_kg,
    rolling7dAvgRpe: data.rolling_7d_avg_rpe,
    totalWorkouts: data.total_workouts,
  }
}

export function useWeeklySummary(
  userId: string | undefined,
  weekStartDay: number,
) {
  return useQuery({
    queryKey: dashboardSummaryQueryKey(userId ?? '', weekStartDay),
    enabled: Boolean(userId),
    queryFn: async () => mapSummary(await fetchDashboardSummary(weekStartDay)),
  })
}
