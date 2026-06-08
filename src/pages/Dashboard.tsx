import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ResumeDraftBanner } from '@/components/workout/ResumeDraftBanner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useWeeklySummary } from '@/hooks/useWeeklySummary'

const DashboardHeatmapCard = lazy(() =>
  import('@/components/dashboard/DashboardHeatmapCard').then((m) => ({
    default: m.DashboardHeatmapCard,
  })),
)

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const weekStartDay = settings?.week_start_day ?? 1
  const displayUnit = settings?.display_unit ?? 'kg'

  const { data: summary, isLoading } = useWeeklySummary(user?.id, weekStartDay)

  const hasWorkouts = (summary?.totalWorkouts ?? 0) > 0
  const tonnageDisplay =
    summary && displayUnit === 'lbs'
      ? Math.round(summary.weeklyTonnageKg * 2.2046226218)
      : summary?.weeklyTonnageKg

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Progress and fatigue signals appear here after logging."
        actions={<Button onClick={() => navigate('/workouts')}>Log workout</Button>}
      />

      {user?.id && <ResumeDraftBanner userId={user.id} />}

      {isLoading ? (
        <PageSkeleton rows={4} />
      ) : !hasWorkouts ? (
        <EmptyState
          title="No workouts logged yet"
          description="Start your first session to see weekly volume and RPE here."
          action={
            <Button onClick={() => navigate('/workouts')}>Start your first workout</Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This week</CardTitle>
            <CardDescription>Calendar week totals from working sets.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-4 text-center sm:max-w-md">
              <div>
                <dt className="text-xs text-muted-foreground">Workouts</dt>
                <dd className="mt-1 text-2xl font-medium tabular-nums">
                  {summary?.workoutsThisWeek ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Volume ({displayUnit})
                </dt>
                <dd className="mt-1 text-2xl font-medium tabular-nums">
                  {tonnageDisplay?.toLocaleString() ?? 0}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Avg RPE (last 7 days)</dt>
                <dd className="mt-1 text-2xl font-medium tabular-nums">
                  {summary?.rolling7dAvgRpe ?? '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {hasWorkouts && (
        <Suspense fallback={<PageSkeleton rows={6} />}>
          <DashboardHeatmapCard />
        </Suspense>
      )}
    </div>
  )
}
