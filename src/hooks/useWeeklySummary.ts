import { useQuery } from '@tanstack/react-query'
import {
  dashboardSummaryQueryKey,
  fetchDashboardSummary,
  type DashboardSummaryRpc,
} from '@/lib/api/workouts'

export type WeeklySummary = {
  workoutsThisWeek: number
  weeklyTonnageKg: number
  priorWeekTonnageKg: number
  rolling7dAvgRpe: number | null
  totalWorkouts: number
  weekStart: string
}

function mapSummary(data: DashboardSummaryRpc): WeeklySummary {
  return {
    workoutsThisWeek: data.workouts_this_week,
    weeklyTonnageKg: data.weekly_tonnage_kg,
    priorWeekTonnageKg: data.prior_week_tonnage_kg ?? 0,
    rolling7dAvgRpe: data.rolling_7d_avg_rpe,
    totalWorkouts: Number(data.total_workouts),
    weekStart: data.week_start,
  }
}

export async function fetchWeeklySummary(
  weekStartDay: number,
): Promise<WeeklySummary> {
  return mapSummary(await fetchDashboardSummary(weekStartDay))
}

export function useWeeklySummary(
  userId: string | undefined,
  weekStartDay: number,
) {
  return useQuery({
    queryKey: dashboardSummaryQueryKey(userId ?? '', weekStartDay),
    enabled: Boolean(userId),
    queryFn: () => fetchWeeklySummary(weekStartDay),
  })
}
