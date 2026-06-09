import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useExercises } from '@/hooks/useExercises'
import { useUserSettings } from '@/hooks/useUserSettings'
import {
  useDeleteWorkout,
  useWorkoutDetail,
  useWorkoutSets,
  workoutSetsToSessionExercises,
  type WorkoutSet,
} from '@/hooks/useWorkouts'
import { formatWorkoutDate } from '@/lib/dates'
import type { DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'
import { kgToDisplayWeight } from '@/lib/workout/validation'

function ReadOnlySetRow({
  set,
  displayUnit,
}: {
  set: WorkoutSet
  displayUnit: DisplayUnit
}) {
  const isWarmup = set.set_type === 'warmup'
  const weightDisplay = kgToDisplayWeight(Number(set.weight_kg), displayUnit)

  return (
    <div className="grid grid-cols-[2.5rem_4.5rem_1fr_1fr_4rem] items-center gap-2 px-1 text-sm">
      <span className="font-medium tabular-nums text-muted-foreground">
        {set.set_number}
      </span>
      <div className="flex gap-1">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium',
            isWarmup
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground',
          )}
        >
          W
        </span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium',
            !isWarmup
              ? 'bg-accent/15 text-accent-foreground'
              : 'text-muted-foreground',
          )}
        >
          Work
        </span>
      </div>
      <span className="tabular-nums">
        {weightDisplay} {displayUnit}
      </span>
      <span className="tabular-nums">{set.reps}</span>
      <span className="tabular-nums text-muted-foreground">
        {set.rpe != null ? set.rpe : '—'}
      </span>
    </div>
  )
}

export function WorkoutDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const displayUnit = settings?.display_unit ?? 'kg'

  const { data: workout, isLoading: workoutLoading } = useWorkoutDetail(id)
  const { data: sets = [], isLoading: setsLoading } = useWorkoutSets(id)
  const { data: exercises = [] } = useExercises(user?.id)
  const deleteWorkout = useDeleteWorkout(user?.id)

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  )

  const sessionExercises = useMemo(
    () => workoutSetsToSessionExercises(sets, displayUnit),
    [sets, displayUnit],
  )

  const setsByExerciseId = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>()
    for (const set of sets) {
      if (!map.has(set.exercise_id)) map.set(set.exercise_id, [])
      map.get(set.exercise_id)!.push(set)
    }
    for (const exerciseSets of map.values()) {
      exerciseSets.sort((a, b) => a.set_number - b.set_number)
    }
    return map
  }, [sets])

  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this workout permanently?')) return

    try {
      await deleteWorkout.mutateAsync(id)
      navigate('/workouts')
    } catch {
      // mutation error surfaced via react-query if needed
    }
  }

  if (workoutLoading || setsLoading) {
    return <PageSkeleton rows={6} />
  }

  if (!workout) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Workout not found.</p>
        <Button onClick={() => navigate('/workouts')}>Back to workouts</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={formatWorkoutDate(workout.date)}
        description={
          [
            workout.duration_minutes != null
              ? `${workout.duration_minutes} min`
              : null,
            workout.notes?.trim() || null,
          ]
            .filter(Boolean)
            .join(' · ') || undefined
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate(`/workouts/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleDelete()}
              loading={deleteWorkout.isPending}
            >
              Delete
            </Button>
          </>
        }
      />

      {sessionExercises.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No sets logged for this workout.
          </CardContent>
        </Card>
      )}

      {sessionExercises.map((exercise) => {
        const exerciseSets = setsByExerciseId.get(exercise.exerciseId) ?? []
        const exerciseName =
          exerciseMap.get(exercise.exerciseId)?.name ?? 'Unknown exercise'

        return (
          <Card key={exercise.exerciseId}>
            <CardHeader>
              <CardTitle className="text-base">{exerciseName}</CardTitle>
              <CardDescription>
                {exerciseSets.length} set{exerciseSets.length === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="hidden grid-cols-[2.5rem_4.5rem_1fr_1fr_4rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
                <span>Set</span>
                <span>Type</span>
                <span>Weight ({displayUnit})</span>
                <span>Reps</span>
                <span>RPE</span>
              </div>
              {exerciseSets.map((set) => (
                <ReadOnlySetRow
                  key={set.id}
                  set={set}
                  displayUnit={displayUnit}
                />
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
