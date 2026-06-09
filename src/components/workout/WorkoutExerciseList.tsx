import { memo } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useShallow } from 'zustand/react/shallow'
import { WorkoutExerciseCard } from '@/components/workout/WorkoutExerciseCard'
import type { Exercise } from '@/hooks/useExercises'
import type { DisplayUnit } from '@/lib/units'
import { useWorkoutStore } from '@/stores/workout'

type WorkoutExerciseListProps = {
  exerciseMap: Map<string, Exercise>
  displayUnit: DisplayUnit
  lastSessionLabels?: Record<string, string>
  onWorkingSetComplete?: () => void
}

export const WorkoutExerciseList = memo(function WorkoutExerciseList({
  exerciseMap,
  displayUnit,
  lastSessionLabels = {},
  onWorkingSetComplete,
}: WorkoutExerciseListProps) {
  const exerciseClientIds = useWorkoutStore(
    useShallow((state) => state.exercises.map((exercise) => exercise.clientId)),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const sortableIds = exerciseClientIds

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromIndex = sortableIds.indexOf(String(active.id))
    const toIndex = sortableIds.indexOf(String(over.id))
    if (fromIndex < 0 || toIndex < 0) return

    useWorkoutStore.getState().reorderExercises(fromIndex, toIndex)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {exerciseClientIds.map((clientId) => (
            <WorkoutExerciseCard
              key={clientId}
              clientId={clientId}
              exerciseMap={exerciseMap}
              displayUnit={displayUnit}
              lastSessionLabels={lastSessionLabels}
              onWorkingSetComplete={onWorkingSetComplete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
})
