import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
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
import { ResumeDraftBanner } from '@/components/workout/ResumeDraftBanner'
import { useAuth } from '@/hooks/useAuth'
import { useWorkouts } from '@/hooks/useWorkouts'
import { formatWorkoutDate } from '@/lib/dates'
import { useWorkoutStore } from '@/stores/workout'

export function WorkoutsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWorkouts(user?.id)

  const workouts = useMemo(
    () => data?.pages.flat() ?? [],
    [data?.pages],
  )

  const startWorkout = () => {
    useWorkoutStore.getState().reset()
    useWorkoutStore.getState().startNew()
    navigate('/workouts/active')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workouts"
        description="Log sessions and review history."
        actions={<Button onClick={startWorkout}>Start workout</Button>}
      />

      {user?.id && <ResumeDraftBanner userId={user.id} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
          <CardDescription>Past sessions newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <PageSkeleton rows={4} />}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error instanceof Error ? error.message : 'Failed to load workouts'}
            </p>
          )}
          {!isLoading && !error && workouts.length === 0 && (
            <EmptyState
              title="No workouts yet"
              description="Log your first session to build history."
              action={<Button onClick={startWorkout}>Start workout</Button>}
            />
          )}
          {workouts.length > 0 && (
            <ul className="divide-y divide-border/60">
              {workouts.map((workout) => (
                <li key={workout.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/workouts/${workout.id}`)}
                    className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <div>
                      <p className="text-sm font-medium tabular-nums">
                        {formatWorkoutDate(workout.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {workout.exercise_count} exercise
                        {workout.exercise_count === 1 ? '' : 's'}
                        {workout.duration_minutes != null
                          ? ` · ${workout.duration_minutes} min`
                          : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {hasNextPage && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void fetchNextPage()}
                loading={isFetchingNextPage}
              >
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
