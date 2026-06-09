import { memo, useCallback, useMemo } from 'react'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import type { Exercise } from '@/hooks/useExercises'
import type { DisplayUnit } from '@/lib/units'
import type { SetRow } from '@/lib/workout/types'
import { useWorkoutStore } from '@/stores/workout'

type WorkoutExerciseCardProps = {
  clientId: string
  exerciseMap: Map<string, Exercise>
  displayUnit: DisplayUnit
  lastSessionLabels?: Record<string, string>
  onWorkingSetComplete?: () => void
}

export const WorkoutExerciseCard = memo(function WorkoutExerciseCard({
  clientId,
  exerciseMap,
  displayUnit,
  lastSessionLabels = {},
  onWorkingSetComplete,
}: WorkoutExerciseCardProps) {
  const exercise = useWorkoutStore((state) =>
    state.exercises.find((row) => row.clientId === clientId),
  )

  const meta = exercise ? exerciseMap.get(exercise.exerciseId) : undefined

  const validationErrors = useWorkoutStore((state) => {
    const prefix = `${clientId}:`
    let hasAny = false
    const scoped: Record<string, (typeof state.validationErrors)[string]> = {}
    for (const [key, value] of Object.entries(state.validationErrors)) {
      if (!key.startsWith(prefix)) continue
      scoped[key] = value
      hasAny = true
    }
    return hasAny ? scoped : null
  })

  const errors = useMemo(
    () => validationErrors ?? {},
    [validationErrors],
  )

  const onUpdateSet = useCallback(
    (setClientId: string, patch: Partial<SetRow>) => {
      const store = useWorkoutStore.getState()
      store.clearValidation()
      store.updateSet(clientId, setClientId, patch)
    },
    [clientId],
  )

  const onRemoveSet = useCallback(
    (setClientId: string) => {
      useWorkoutStore.getState().removeSet(clientId, setClientId)
    },
    [clientId],
  )

  const onAddSet = useCallback(() => {
    useWorkoutStore.getState().addSet(clientId)
  }, [clientId])

  const onCompleteSet = useCallback(
    (setClientId: string) => {
      const store = useWorkoutStore.getState()
      const exercise = store.exercises.find((row) => row.clientId === clientId)
      const set = exercise?.sets.find((row) => row.clientId === setClientId)
      if (!set) return
      const markingComplete = !set.completed
      store.updateSet(clientId, setClientId, { completed: markingComplete })
      if (
        markingComplete &&
        set.setType === 'working' &&
        set.reps.trim() &&
        set.weightDisplay.trim() &&
        set.rpe.trim() &&
        onWorkingSetComplete
      ) {
        onWorkingSetComplete()
      }
    },
    [clientId, onWorkingSetComplete],
  )

  const onRemoveExercise = useCallback(() => {
    useWorkoutStore.getState().removeExercise(clientId)
  }, [clientId])

  if (!exercise) return null

  return (
    <ExerciseCard
      exercise={exercise}
      meta={meta}
      displayUnit={displayUnit}
      lastSessionLabel={meta ? lastSessionLabels[meta.id] : null}
      validationErrors={errors}
      onUpdateSet={onUpdateSet}
      onRemoveSet={onRemoveSet}
      onAddSet={onAddSet}
      onCompleteSet={onCompleteSet}
      onRemoveExercise={onRemoveExercise}
    />
  )
})
