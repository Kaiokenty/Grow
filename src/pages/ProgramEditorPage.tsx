import { memo, useMemo, useState } from 'react'
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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExercisePickerDialog } from '@/components/workout/ExercisePickerDialog'
import { useAuth } from '@/hooks/useAuth'
import { useExercises, useRecentExercises } from '@/hooks/useExercises'
import {
  useProgramExercises,
  usePrograms,
  useSaveProgram,
} from '@/hooks/usePrograms'

const SortableExerciseRow = memo(function SortableExerciseRow({
  id,
  name,
  onRemove,
}: {
  id: string
  name: string
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground"
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">{name}</span>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  )
})

export function ProgramEditorPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const programId = isNew ? undefined : id

  const { user } = useAuth()
  const { data: programs = [], isLoading: programsLoading } = usePrograms(user?.id)
  const { data: programExercises, isLoading: exercisesLoading } =
    useProgramExercises(programId)

  const program = programs.find((p) => p.id === programId)

  if (!isNew && (programsLoading || exercisesLoading)) {
    return <p className="text-sm text-muted-foreground">Loading program…</p>
  }

  if (!isNew && !program) {
    return <p className="text-sm text-destructive">Program not found.</p>
  }

  return (
    <ProgramEditorForm
      key={programId ?? 'new'}
      programId={programId}
      isNew={isNew}
      initialName={program?.name ?? ''}
      initialNotes={program?.notes ?? ''}
      initialExerciseIds={(programExercises ?? []).map((row) => row.exercise_id)}
    />
  )
}

function ProgramEditorForm({
  programId,
  isNew,
  initialName,
  initialNotes,
  initialExerciseIds,
}: {
  programId?: string
  isNew: boolean
  initialName: string
  initialNotes: string
  initialExerciseIds: string[]
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: exercises = [] } = useExercises(user?.id)
  const [pickerOpen, setPickerOpen] = useState(false)
  const { data: recentExercises = [] } = useRecentExercises(
    user?.id,
    pickerOpen,
  )
  const saveProgram = useSaveProgram(user?.id)

  const [name, setName] = useState(initialName)
  const [notes, setNotes] = useState(initialNotes)
  const [exerciseIds, setExerciseIds] = useState(initialExerciseIds)
  const [error, setError] = useState<string | null>(null)

  const exerciseMap = useMemo(
    () => new Map(exercises.map((e) => [e.id, e])),
    [exercises],
  )

  const selectedIds = useMemo(() => new Set(exerciseIds), [exerciseIds])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setExerciseIds((ids) => {
      const from = ids.indexOf(String(active.id))
      const to = ids.indexOf(String(over.id))
      if (from < 0 || to < 0) return ids
      return arrayMove(ids, from, to)
    })
  }

  const handleSave = async () => {
    setError(null)
    if (!name.trim()) {
      setError('Program name is required')
      return
    }

    try {
      const savedId = await saveProgram.mutateAsync({
        id: programId,
        name: name.trim(),
        notes,
        exerciseIds,
      })
      navigate(`/programs/${savedId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">
            {isNew ? 'New program' : 'Edit program'}
          </h1>
        </div>
        <Button onClick={() => void handleSave()} loading={saveProgram.isPending}>
          Save
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="program-name">Name</Label>
          <Input
            id="program-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="program-notes">Notes</Label>
          <Input
            id="program-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {exerciseIds.map((exerciseId) => (
              <SortableExerciseRow
                key={exerciseId}
                id={exerciseId}
                name={exerciseMap.get(exerciseId)?.name ?? 'Exercise'}
                onRemove={() =>
                  setExerciseIds((ids) => ids.filter((id) => id !== exerciseId))
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="secondary" onClick={() => setPickerOpen(true)}>
        Add exercise
      </Button>

      {pickerOpen && (
        <ExercisePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          exercises={exercises}
          recentExercises={recentExercises}
          selectedIds={selectedIds}
          onSelect={(exerciseId) =>
            setExerciseIds((ids) =>
              ids.includes(exerciseId) ? ids : [...ids, exerciseId],
            )
          }
        />
      )}
    </div>
  )
}
