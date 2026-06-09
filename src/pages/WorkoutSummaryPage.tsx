import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BodyHeatmap } from '@/components/body-map/BodyHeatmap'
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
import { useWorkoutDetail, useWorkoutSets } from '@/hooks/useWorkouts'
import { formatMuscleLabel, muscleVolumeToBodyParts, type GrowMuscleGroup } from '@/lib/body-map'
import { MUSCLE_WEIGHT_OTHER, MUSCLE_WEIGHT_PRIMARY, MUSCLE_WEIGHT_SECONDARY } from '@/lib/body-map/attribution'
import { formatWorkoutDate } from '@/lib/dates'
export function WorkoutSummaryPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const displayUnit = settings?.display_unit ?? 'kg'

  const { data: workout, isLoading: workoutLoading } = useWorkoutDetail(id)
  const { data: sets = [], isLoading: setsLoading } = useWorkoutSets(id)
  const { data: exercises = [] } = useExercises(user?.id)

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  )

  const summary = useMemo(() => {
    const workingSets = sets.filter((s) => s.set_type === 'working')
    const rawVolume = workingSets.reduce(
      (sum, s) => sum + s.reps * Number(s.weight_kg),
      0,
    )
    const exerciseIds = new Set(workingSets.map((s) => s.exercise_id))
    const muscleVolume: Partial<Record<GrowMuscleGroup, number>> = {}

    for (const set of workingSets) {
      const exercise = exerciseMap.get(set.exercise_id)
      if (!exercise) continue
      const tonnage = set.reps * Number(set.weight_kg)
      const primary = exercise.primary_muscle as GrowMuscleGroup | undefined
      if (primary) {
        muscleVolume[primary] =
          (muscleVolume[primary] ?? 0) + tonnage * MUSCLE_WEIGHT_PRIMARY
      }
      for (const m of exercise.secondary_muscles ?? []) {
        const muscle = m as GrowMuscleGroup
        muscleVolume[muscle] =
          (muscleVolume[muscle] ?? 0) + tonnage * MUSCLE_WEIGHT_SECONDARY
      }
      for (const m of exercise.other_muscles ?? []) {
        const muscle = m as GrowMuscleGroup
        muscleVolume[muscle] =
          (muscleVolume[muscle] ?? 0) + tonnage * MUSCLE_WEIGHT_OTHER
      }
    }

    const musclesHit = Object.entries(muscleVolume)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([muscle]) => muscle as GrowMuscleGroup)

    return {
      rawVolume,
      workingSetCount: workingSets.length,
      exerciseCount: exerciseIds.size,
      musclesHit,
      bodyParts: muscleVolumeToBodyParts(muscleVolume),
    }
  }, [exerciseMap, sets])

  const volumeDisplay =
    displayUnit === 'lbs'
      ? Math.round(summary.rawVolume * 2.2046226218)
      : Math.round(summary.rawVolume)

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
      <div className="text-center">
        <h1 className="text-2xl font-medium tracking-tight">Workout complete</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatWorkoutDate(workout.date)}
          {workout.duration_minutes != null
            ? ` · ${workout.duration_minutes} min`
            : ''}
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Session stats</CardTitle>
          <CardDescription>Working sets only</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div>
              <dt className="text-xs text-muted-foreground">Exercises</dt>
              <dd className="stat-value mt-1 tabular-nums">{summary.exerciseCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sets</dt>
              <dd className="stat-value mt-1 tabular-nums">{summary.workingSetCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Volume ({displayUnit})</dt>
              <dd className="stat-value mt-1 tabular-nums">
                {volumeDisplay.toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {summary.bodyParts.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Muscles trained</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BodyHeatmap data={summary.bodyParts} side="front" scale={0.85} />
            <div className="flex flex-wrap gap-2">
              {summary.musclesHit.map((muscle) => (
                <span
                  key={muscle}
                  className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs capitalize"
                >
                  {formatMuscleLabel(muscle)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={() => navigate('/')}>
          Dashboard
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => navigate('/workouts')}>
          Workout history
        </Button>
      </div>
    </div>
  )
}
