import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkoutExerciseList } from '@/components/workout/WorkoutExerciseList'
import {
  fetchLastSessionSet,
  fetchLastSessionSetsBatch,
  useExercises,
  useRecentExercises,
} from '@/hooks/useExercises'
import { useProgramExercises } from '@/hooks/usePrograms'
import { useAuth } from '@/hooks/useAuth'
import { useUserSettings } from '@/hooks/useUserSettings'
import {
  useDeleteWorkout,
  useSaveWorkout,
  useWorkoutDetail,
  useWorkoutSets,
  workoutSetsToSessionExercises,
} from '@/hooks/useWorkouts'
import { formatLastSessionLabel, lastSessionToInitialSet } from '@/lib/workout/autofill'
import { cn } from '@/lib/utils'
import { useWorkoutStore } from '@/stores/workout'

const ExercisePickerDialog = lazy(() =>
  import('@/components/workout/ExercisePickerDialog').then((m) => ({
    default: m.ExercisePickerDialog,
  })),
)

export function WorkoutLoggerPage() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const [searchParams] = useSearchParams()
  const programId = searchParams.get('programId')
  const isEdit = Boolean(editId)

  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const displayUnit = settings?.display_unit ?? 'kg'

  const [pickerOpen, setPickerOpen] = useState(false)
  const { data: exercises = [] } = useExercises(user?.id, { enabled: pickerOpen })
  const { data: recentExercises = [] } = useRecentExercises(
    user?.id,
    pickerOpen,
  )
  const { data: workout } = useWorkoutDetail(isEdit ? editId : undefined)
  const { data: workoutSets } = useWorkoutSets(isEdit ? editId : undefined)
  const { data: programExercises } = useProgramExercises(
    !isEdit && programId ? programId : undefined,
  )

  const saveWorkout = useSaveWorkout(user?.id)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const [lastSessionLabels, setLastSessionLabels] = useState<
    Record<string, string>
  >({})
  const restEnabled = settings?.rest_timer_enabled ?? false
  const restSeconds = settings?.rest_timer_seconds ?? 90
  const initializedRef = useRef(false)
  const programLoadedRef = useRef(false)

  const {
    date,
    notes,
    durationMinutes,
    exerciseCount,
    isDirty,
    validationMessages,
  } = useWorkoutStore(
    useShallow((state) => ({
      date: state.date,
      notes: state.notes,
      durationMinutes: state.durationMinutes,
      exerciseCount: state.exercises.length,
      isDirty: state.isDirty,
      validationMessages: state.validationMessages,
    })),
  )

  const selectedExerciseIds = useWorkoutStore(
    useShallow((state) => state.exercises.map((e) => e.exerciseId)),
  )

  const selectedIds = useMemo(
    () => new Set(selectedExerciseIds),
    [selectedExerciseIds],
  )

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  )

  useEffect(() => {
    useWorkoutStore.getState().bindUser(user?.id ?? null)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || initializedRef.current) return

    const store = useWorkoutStore.getState()

    if (isEdit) {
      if (!workout || !workoutSets) return
      initializedRef.current = true
      store.loadEdit({
        mode: 'edit',
        workoutId: workout.id,
        date: workout.date,
        notes: workout.notes ?? '',
        durationMinutes:
          workout.duration_minutes != null
            ? String(workout.duration_minutes)
            : '',
        programId: workout.program_id,
        exercises: workoutSetsToSessionExercises(workoutSets, displayUnit),
      })
      return
    }

    if (store.exercises.length > 0) {
      initializedRef.current = true
      return
    }

    initializedRef.current = true
    store.startNew({ programId })
  }, [
    displayUnit,
    isEdit,
    programId,
    user?.id,
    workout,
    workoutSets,
  ])

  useEffect(() => {
    if (
      !user?.id ||
      isEdit ||
      !programId ||
      !programExercises?.length ||
      !initializedRef.current ||
      programLoadedRef.current ||
      useWorkoutStore.getState().exercises.length > 0
    ) {
      return
    }

    programLoadedRef.current = true

    void (async () => {
      const exerciseIds = programExercises.map((row) => row.exercise_id)
      try {
        const lastSets = await fetchLastSessionSetsBatch(user.id, exerciseIds)
        const labels: Record<string, string> = {}
        for (const [exerciseId, last] of lastSets) {
          labels[exerciseId] = formatLastSessionLabel(last, displayUnit)
        }
        setLastSessionLabels((prev) => ({ ...prev, ...labels }))
        useWorkoutStore.getState().addExercisesBatch(
          exerciseIds.map((exerciseId) => {
            const last = lastSets.get(exerciseId)
            return {
              exerciseId,
              initialSet: last
                ? lastSessionToInitialSet(last, displayUnit)
                : undefined,
            }
          }),
        )
      } catch {
        // ignore autofill failure
      }
    })()
  }, [displayUnit, isEdit, programExercises, programId, user?.id])

  const handleAddExercise = useCallback(
    async (exerciseId: string) => {
      if (!user?.id) return

      const last = await fetchLastSessionSet(
        user.id,
        exerciseId,
        isEdit ? editId : undefined,
      )

      useWorkoutStore.getState().addExercise(
        exerciseId,
        last ? lastSessionToInitialSet(last, displayUnit) : undefined,
      )
      if (last) {
        setLastSessionLabels((prev) => ({
          ...prev,
          [exerciseId]: formatLastSessionLabel(last, displayUnit),
        }))
      }
    },
    [displayUnit, editId, isEdit, user?.id],
  )

  const handleSave = async () => {
    setSaveError(null)
    useWorkoutStore.getState().clearValidation()

    const store = useWorkoutStore.getState()
    if (!store.validate()) {
      return
    }

    try {
      const workoutId = await saveWorkout.mutateAsync({
        draft: store.getDraft(),
        displayUnit,
      })
      store.clearDraft()
      store.reset()
      if (isEdit) {
        navigate('/workouts')
      } else {
        navigate(`/workouts/${workoutId}/summary`)
      }
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : error &&
              typeof error === 'object' &&
              'message' in error &&
              typeof error.message === 'string'
            ? error.message
            : 'Save failed',
      )
    }
  }

  const handleDiscard = () => {
    if (!window.confirm('Discard this workout? Unsaved changes will be lost.')) {
      return
    }
    const store = useWorkoutStore.getState()
    store.clearDraft()
    store.reset()
    navigate('/workouts')
  }

  const clearFieldValidation = () => {
    useWorkoutStore.getState().clearValidation()
  }

  useEffect(() => {
    if (restRemaining == null || restRemaining <= 0) return
    const id = window.setInterval(() => {
      setRestRemaining((prev) => {
        if (prev == null || prev <= 1) return null
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [restRemaining])

  const startRestTimer = useCallback(() => {
    if (!restEnabled) return
    setRestRemaining(restSeconds)
  }, [restEnabled, restSeconds])

  const formatRest = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight">
              {isEdit ? 'Edit workout' : 'Active workout'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Working sets need RPE. Weights save as kg.
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <Button variant="secondary" onClick={handleDiscard}>
              Discard
            </Button>
            <Button onClick={() => void handleSave()} loading={saveWorkout.isPending}>
              Save
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="workout-date">Date</Label>
            <Input
              id="workout-date"
              type="date"
              value={date}
              onChange={(e) => {
                clearFieldValidation()
                useWorkoutStore.getState().setDate(e.target.value)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-duration">Duration (min)</Label>
            <Input
              id="workout-duration"
              type="number"
              min={0}
              value={durationMinutes}
              onChange={(e) => {
                clearFieldValidation()
                useWorkoutStore.getState().setDurationMinutes(e.target.value)
              }}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="workout-notes">Notes</Label>
            <textarea
              id="workout-notes"
              rows={2}
              value={notes}
              onChange={(e) => {
                clearFieldValidation()
                useWorkoutStore.getState().setNotes(e.target.value)
              }}
              placeholder="Optional"
              className={cn(
                'w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30',
              )}
            />
          </div>
        </div>

        {(validationMessages.length > 0 || saveError) && (
          <div className="space-y-1" role="alert">
            {validationMessages.map((message) => (
              <p key={message} className="text-sm text-destructive">
                {message}
              </p>
            ))}
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
        )}

        {exerciseCount === 0 ? (
          <EmptyState
            title="No exercises yet"
            description="Add your first exercise to start logging sets."
            action={
              <Button onClick={() => setPickerOpen(true)}>Add exercise</Button>
            }
          />
        ) : (
          <WorkoutExerciseList
            exerciseMap={exerciseMap}
            displayUnit={displayUnit}
            lastSessionLabels={lastSessionLabels}
            onWorkingSetComplete={startRestTimer}
          />
        )}

        {exerciseCount > 0 && (
          <Button variant="secondary" onClick={() => setPickerOpen(true)}>
            Add exercise
          </Button>
        )}

        {pickerOpen && (
          <Suspense fallback={null}>
            <ExercisePickerDialog
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              exercises={exercises}
              recentExercises={recentExercises}
              selectedIds={selectedIds}
              onSelect={(exerciseId) => void handleAddExercise(exerciseId)}
            />
          </Suspense>
        )}

        {isEdit && editId && (
          <DeleteWorkoutSection
            workoutId={editId}
            onDeleted={() => navigate('/workouts')}
          />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          {restRemaining != null && restRemaining > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tabular-nums">
                Rest {formatRest(restRemaining)}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRestRemaining((prev) => (prev != null ? prev + 30 : null))}
              >
                +30s
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRestRemaining(null)}>
                Skip
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isDirty && exerciseCount > 0 ? 'Unsaved changes · draft autosaved' : '\u00a0'}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDiscard}>
              Discard
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              loading={saveWorkout.isPending}
            >
              Save workout
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function DeleteWorkoutSection({
  workoutId,
  onDeleted,
}: {
  workoutId: string
  onDeleted: () => void
}) {
  const { user } = useAuth()
  const deleteWorkout = useDeleteWorkout(user?.id)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!window.confirm('Delete this workout permanently?')) return
    setError(null)
    try {
      await deleteWorkout.mutateAsync(workoutId)
      useWorkoutStore.getState().clearDraft()
      useWorkoutStore.getState().reset()
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="rounded-xl border border-destructive/30 p-4">
      <p className="text-sm font-medium text-destructive">Danger zone</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Delete removes all sets for this workout.
      </p>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        variant="secondary"
        className="mt-3"
        onClick={() => void handleDelete()}
        loading={deleteWorkout.isPending}
      >
        Delete workout
      </Button>
    </div>
  )
}
