import { useMemo, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  useCreateExercise,
  useExercises,
  useUpdateExercise,
  type Exercise,
} from '@/hooks/useExercises'
import { useAuth } from '@/hooks/useAuth'
import {
  MOVEMENT_TYPE_OPTIONS,
  movementTypeLabel,
} from '@/lib/movement-type'
import type { MovementType } from '@/lib/workout/types'

type ExerciseFormState = {
  name: string
  movement_type: MovementType
  category: string
  muscle_groups: string
  is_compound: boolean
  is_tracked: boolean
}

const emptyForm = (): ExerciseFormState => ({
  name: '',
  movement_type: 'upper_push',
  category: '',
  muscle_groups: '',
  is_compound: false,
  is_tracked: false,
})

function exerciseToForm(exercise: Exercise): ExerciseFormState {
  return {
    name: exercise.name,
    movement_type: exercise.movement_type,
    category: exercise.category ?? '',
    muscle_groups: exercise.muscle_groups.join(', '),
    is_compound: exercise.is_compound,
    is_tracked: exercise.is_tracked,
  }
}

export function ExercisesPage() {
  const { user } = useAuth()
  const { data: exercises = [], isLoading, error } = useExercises(user?.id)
  const createExercise = useCreateExercise(user?.id)
  const updateExercise = useUpdateExercise(user?.id)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [form, setForm] = useState<ExerciseFormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return exercises
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_groups.some((m) => m.toLowerCase().includes(q)),
    )
  }, [exercises, query])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setFormError(null)
    setOpen(true)
  }

  const openEdit = (exercise: Exercise) => {
    setEditing(exercise)
    setForm(exerciseToForm(exercise))
    setFormError(null)
    setOpen(true)
  }

  const parseMuscleGroups = (value: string) =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

  const handleSubmit = async () => {
    setFormError(null)
    if (!form.name.trim()) {
      setFormError('Name is required')
      return
    }

    const payload = {
      name: form.name.trim(),
      movement_type: form.movement_type,
      category: form.category.trim() || null,
      muscle_groups: parseMuscleGroups(form.muscle_groups),
      is_compound: form.is_compound,
      is_tracked: form.is_tracked,
    }

    try {
      if (editing) {
        await updateExercise.mutateAsync({ id: editing.id, patch: payload })
      } else {
        await createExercise.mutateAsync(payload)
      }
      setOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercises"
        description="Your library. Movement type drives e1RM formula."
        actions={<Button onClick={openCreate}>New exercise</Button>}
      />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Library</CardTitle>
          <CardDescription>{exercises.length} exercises</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <PageSkeleton rows={4} />}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error instanceof Error ? error.message : 'Failed to load'}
            </p>
          )}
          {!isLoading && filtered.length === 0 && (
            <EmptyState
              title="No exercises found"
              description={
                exercises.length === 0
                  ? 'Your seed library loads on first sign-in.'
                  : 'Try a different search term.'
              }
              action={
                exercises.length === 0 ? (
                  <Button onClick={openCreate}>New exercise</Button>
                ) : undefined
              }
            />
          )}
          <ul className="divide-y divide-border/60">
            {filtered.map((exercise) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => openEdit(exercise)}
                  className="flex w-full items-start justify-between gap-4 py-3 text-left hover:bg-accent/50"
                >
                  <div>
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {movementTypeLabel(exercise.movement_type)}
                      {exercise.muscle_groups.length > 0
                        ? ` · ${exercise.muscle_groups.join(', ')}`
                        : ''}
                    </p>
                  </div>
                  {exercise.is_tracked && (
                    <span className="text-xs text-muted-foreground">Tracked</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit exercise' : 'New exercise'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Name</Label>
              <Input
                id="exercise-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="movement-type">Movement type</Label>
              <select
                id="movement-type"
                value={form.movement_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    movement_type: e.target.value as MovementType,
                  }))
                }
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscle-groups">Muscle groups</Label>
              <Input
                id="muscle-groups"
                value={form.muscle_groups}
                onChange={(e) =>
                  setForm((f) => ({ ...f, muscle_groups: e.target.value }))
                }
                placeholder="chest, triceps"
              />
            </div>
            <Switch
              label="Compound"
              checked={form.is_compound}
              onToggle={() =>
                setForm((f) => ({ ...f, is_compound: !f.is_compound }))
              }
            />
            <Switch
              label="Tracked for progression"
              checked={form.is_tracked}
              onToggle={() =>
                setForm((f) => ({ ...f, is_tracked: !f.is_tracked }))
              }
            />
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => void handleSubmit()}
              loading={createExercise.isPending || updateExercise.isPending}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
