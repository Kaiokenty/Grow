import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SetTable } from '@/components/workout/SetTable'
import { movementTypeLabel } from '@/lib/movement-type'
import type { Exercise } from '@/hooks/useExercises'
import type { SessionExercise, SetRow, ValidationErrors } from '@/lib/workout/types'
import type { DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

type ExerciseCardProps = {
  exercise: SessionExercise
  meta?: Exercise
  displayUnit: DisplayUnit
  validationErrors: ValidationErrors
  onUpdateSet: (setClientId: string, patch: Partial<SetRow>) => void
  onRemoveSet: (setClientId: string) => void
  onAddSet: () => void
  onRemoveExercise: () => void
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  meta,
  displayUnit,
  validationErrors,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.clientId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn('rounded-xl', isDragging && 'opacity-60')}
    >
      <CardHeader className="flex flex-row items-start gap-2 space-y-0 pb-3">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label="Reorder exercise"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{meta?.name ?? 'Exercise'}</CardTitle>
          {meta && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {movementTypeLabel(meta.movement_type)}
              {meta.muscle_groups.length > 0
                ? ` · ${meta.muscle_groups.join(', ')}`
                : ''}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemoveExercise}
        >
          Remove
        </Button>
      </CardHeader>
      <CardContent>
        <SetTable
          exerciseClientId={exercise.clientId}
          sets={exercise.sets}
          displayUnit={displayUnit}
          validationErrors={validationErrors}
          onUpdateSet={onUpdateSet}
          onRemoveSet={onRemoveSet}
          onAddSet={onAddSet}
        />
      </CardContent>
    </Card>
  )
})
