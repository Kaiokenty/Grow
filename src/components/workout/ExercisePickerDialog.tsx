import { memo, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { movementTypeLabel } from '@/lib/movement-type'
import type { Exercise } from '@/hooks/useExercises'
import { cn } from '@/lib/utils'

type ExercisePickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: Exercise[]
  recentExercises: Exercise[]
  selectedIds: Set<string>
  onSelect: (exerciseId: string) => void
}

const ExercisePickerRow = memo(function ExercisePickerRow({
  exercise,
  disabled,
  onSelect,
}: {
  exercise: Exercise
  disabled: boolean
  onSelect: (exerciseId: string) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(exercise.id)}
      className={cn(
        'flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span>
        <span className="block text-sm font-medium">{exercise.name}</span>
        <span className="block text-xs text-muted-foreground">
          {movementTypeLabel(exercise.movement_type)}
          {exercise.muscle_groups.length > 0
            ? ` · ${exercise.muscle_groups.join(', ')}`
            : ''}
        </span>
      </span>
      {disabled && (
        <span className="text-xs text-muted-foreground">Added</span>
      )}
    </button>
  )
})

export const ExercisePickerDialog = memo(function ExercisePickerDialog({
  open,
  onOpenChange,
  exercises,
  recentExercises,
  selectedIds,
  onSelect,
}: ExercisePickerDialogProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return exercises
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_groups.some((m) => m.toLowerCase().includes(q)),
    )
  }, [exercises, query])

  const handleSelect = (exerciseId: string) => {
    onSelect(exerciseId)
  }

  const handleClose = () => {
    onOpenChange(false)
    setQuery('')
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          autoFocus
        />
        <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
          {recentExercises.length > 0 && !query.trim() && (
            <section>
              <h3 className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent
              </h3>
              <div className="space-y-1">
                {recentExercises.map((exercise) => (
                  <ExercisePickerRow
                    key={exercise.id}
                    exercise={exercise}
                    disabled={selectedIds.has(exercise.id)}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </section>
          )}
          <section>
            {!query.trim() && recentExercises.length > 0 && (
              <h3 className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                All
              </h3>
            )}
            <div className="space-y-1">
              {filtered.length > 0 ? (
                filtered.map((exercise) => (
                  <ExercisePickerRow
                    key={exercise.id}
                    exercise={exercise}
                    disabled={selectedIds.has(exercise.id)}
                    onSelect={handleSelect}
                  />
                ))
              ) : (
                <p className="px-3 py-6 text-sm text-muted-foreground">
                  No exercises match your search.
                </p>
              )}
            </div>
          </section>
        </div>
        <Button variant="secondary" onClick={handleClose}>
          Done
        </Button>
      </DialogContent>
    </Dialog>
  )
})
