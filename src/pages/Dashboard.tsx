import { useNavigate } from 'react-router-dom'
import { MuscleMapExplorer } from '@/components/body-map/MuscleMapExplorer'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DeloadCard } from '@/components/dashboard/DeloadCard'
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ResumeDraftBanner } from '@/components/workout/ResumeDraftBanner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useWeeklySummary } from '@/hooks/useWeeklySummary'
import { formatWeekLabel } from '@/lib/dates'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const weekStartDay = settings?.week_start_day ?? 1
  const displayUnit = settings?.display_unit ?? 'kg'
  const chartWeeks = settings?.chart_weeks ?? 6

  const { data: summary, isLoading, isError, error } = useWeeklySummary(
    user?.id,
    weekStartDay,
  )

  const hasWorkouts = (summary?.totalWorkouts ?? 0) > 0
  const weekLabel = summary?.weekStart
    ? formatWeekLabel(summary.weekStart)
    : 'This week'
  const showLoading = authLoading || !user?.id || isLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${weekLabel} · Progress and fatigue at a glance`}
        actions={<Button onClick={() => navigate('/workouts')}>Log workout</Button>}
      />

      {user?.id && <ResumeDraftBanner userId={user.id} />}

      {isError ? (
        <EmptyState
          title="Could not load dashboard"
          description={
            error instanceof Error
              ? error.message
              : 'Something went wrong loading your training summary.'
          }
          action={
            <Button onClick={() => window.location.reload()}>Retry</Button>
          }
        />
      ) : showLoading ? (
        <PageSkeleton rows={8} />
      ) : !hasWorkouts ? (
        <EmptyState
          title="No workouts logged yet"
          description="Start your first session to see volume, muscle balance, and RPE here."
          action={
            <Button onClick={() => navigate('/workouts')}>Start your first workout</Button>
          }
        />
      ) : (
        <>
          {user?.id && (
            <MuscleMapExplorer
              userId={user.id}
              weekStartDay={weekStartDay}
              displayUnit={displayUnit}
              variant="dashboard"
            />
          )}

          {user?.id && <DeloadCard userId={user.id} />}

          {user?.id && (
            <WeeklySummaryCard userId={user.id} weekStartDay={weekStartDay} />
          )}

          {user?.id && (
            <DashboardCharts
              userId={user.id}
              chartWeeks={chartWeeks}
              weekStartDay={weekStartDay}
              displayUnit={displayUnit}
            />
          )}
        </>
      )}
    </div>
  )
}
