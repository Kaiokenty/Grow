import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { clearWorkoutDraft, saveWorkoutDraft } from '@/lib/workout-draft'
import { validateWorkoutSession } from '@/lib/workout/validation'
import {
  emptySetRow,
  newClientId,
  todayIsoDate,
  type SessionExercise,
  type SetRow,
  type ValidationErrors,
  type WorkoutDraft,
  type WorkoutMode,
} from '@/lib/workout/types'

type WorkoutStore = {
  userId: string | null
  mode: WorkoutMode
  workoutId?: string
  date: string
  notes: string
  durationMinutes: string
  programId: string | null
  exercises: SessionExercise[]
  validationErrors: ValidationErrors
  validationMessages: string[]
  isDirty: boolean

  bindUser: (userId: string | null) => void
  startNew: (opts?: { programId?: string | null; date?: string }) => void
  loadEdit: (draft: WorkoutDraft) => void
  hydrateDraft: (draft: WorkoutDraft) => void
  setDate: (date: string) => void
  setNotes: (notes: string) => void
  setDurationMinutes: (value: string) => void
  addExercise: (exerciseId: string, initialSet?: Partial<SetRow>) => void
  addExercisesBatch: (
    items: { exerciseId: string; initialSet?: Partial<SetRow> }[],
  ) => void
  removeExercise: (clientId: string) => void
  reorderExercises: (fromIndex: number, toIndex: number) => void
  addSet: (exerciseClientId: string, fromSet?: SetRow) => void
  removeSet: (exerciseClientId: string, setClientId: string) => void
  updateSet: (
    exerciseClientId: string,
    setClientId: string,
    patch: Partial<SetRow>,
  ) => void
  validate: () => boolean
  clearValidation: () => void
  getDraft: () => WorkoutDraft
  reset: () => void
  persistDraft: () => void
  clearDraft: () => void
}

const initialState = {
  userId: null as string | null,
  mode: 'new' as WorkoutMode,
  workoutId: undefined as string | undefined,
  date: todayIsoDate(),
  notes: '',
  durationMinutes: '',
  programId: null as string | null,
  exercises: [] as SessionExercise[],
  validationErrors: {} as ValidationErrors,
  validationMessages: [] as string[],
  isDirty: false,
}

function renumberSets(sets: SetRow[]) {
  return sets.map((set, index) => ({ ...set, setNumber: index + 1 }))
}

function markDirty<T extends Partial<WorkoutStore>>(patch: T): T & { isDirty: true } {
  return { ...patch, isDirty: true }
}

export const useWorkoutStore = create<WorkoutStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    bindUser: (userId) => set({ userId }),

    startNew: (opts) =>
      set({
        ...initialState,
        userId: get().userId,
        mode: 'new',
        date: opts?.date ?? todayIsoDate(),
        programId: opts?.programId ?? null,
        isDirty: false,
      }),

    loadEdit: (draft) =>
      set({
        ...initialState,
        userId: get().userId,
        mode: draft.mode,
        workoutId: draft.workoutId,
        date: draft.date,
        notes: draft.notes,
        durationMinutes: draft.durationMinutes,
        programId: draft.programId,
        exercises: draft.exercises,
        isDirty: false,
        validationErrors: {},
        validationMessages: [],
      }),

    hydrateDraft: (draft) => get().loadEdit(draft),

    setDate: (date) => set(markDirty({ date })),
    setNotes: (notes) => set(markDirty({ notes })),
    setDurationMinutes: (durationMinutes) => set(markDirty({ durationMinutes })),

    addExercise: (exerciseId, initialSet) =>
      set((state) => {
        const sets = [
          emptySetRow(1, {
            reps: initialSet?.reps,
            weightDisplay: initialSet?.weightDisplay,
            rpe: initialSet?.rpe,
            setType: initialSet?.setType,
          }),
        ]

        return markDirty({
          exercises: [
            ...state.exercises,
            { clientId: newClientId(), exerciseId, sets },
          ],
        })
      }),

    addExercisesBatch: (items) =>
      set((state) =>
        markDirty({
          exercises: [
            ...state.exercises,
            ...items.map(({ exerciseId, initialSet }) => ({
              clientId: newClientId(),
              exerciseId,
              sets: [
                emptySetRow(1, {
                  reps: initialSet?.reps,
                  weightDisplay: initialSet?.weightDisplay,
                  rpe: initialSet?.rpe,
                  setType: initialSet?.setType,
                }),
              ],
            })),
          ],
        }),
      ),

    removeExercise: (clientId) =>
      set((state) =>
        markDirty({
          exercises: state.exercises.filter((e) => e.clientId !== clientId),
        }),
      ),

    reorderExercises: (fromIndex, toIndex) =>
      set((state) => {
        const next = [...state.exercises]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return markDirty({ exercises: next })
      }),

    addSet: (exerciseClientId, fromSet) =>
      set((state) =>
        markDirty({
          exercises: state.exercises.map((exercise) => {
            if (exercise.clientId !== exerciseClientId) return exercise
            const last = exercise.sets[exercise.sets.length - 1]
            const source = fromSet ?? last
            const nextSet = emptySetRow(exercise.sets.length + 1, {
              reps: source?.reps,
              weightDisplay: source?.weightDisplay,
              rpe: source?.rpe,
              setType: source?.setType,
            })
            return {
              ...exercise,
              sets: renumberSets([...exercise.sets, nextSet]),
            }
          }),
        }),
      ),

    removeSet: (exerciseClientId, setClientId) =>
      set((state) =>
        markDirty({
          exercises: state.exercises.map((exercise) => {
            if (exercise.clientId !== exerciseClientId) return exercise
            const sets = renumberSets(
              exercise.sets.filter((s) => s.clientId !== setClientId),
            )
            return { ...exercise, sets }
          }),
        }),
      ),

    updateSet: (exerciseClientId, setClientId, patch) =>
      set((state) =>
        markDirty({
          exercises: state.exercises.map((exercise) => {
            if (exercise.clientId !== exerciseClientId) return exercise
            return {
              ...exercise,
              sets: exercise.sets.map((row) =>
                row.clientId === setClientId ? { ...row, ...patch } : row,
              ),
            }
          }),
        }),
      ),

    validate: () => {
      const { exercises } = get()
      const result = validateWorkoutSession(exercises)
      set({
        validationErrors: result.errors,
        validationMessages: result.messages,
      })
      return result.errorCount === 0
    },

    clearValidation: () =>
      set({ validationErrors: {}, validationMessages: [] }),

    getDraft: () => {
      const state = get()
      return {
        mode: state.mode,
        workoutId: state.workoutId,
        date: state.date,
        notes: state.notes,
        durationMinutes: state.durationMinutes,
        programId: state.programId,
        exercises: state.exercises,
      }
    },

    reset: () =>
      set({
        ...initialState,
        userId: get().userId,
      }),

    persistDraft: () => {
      const { userId } = get()
      if (!userId || get().exercises.length === 0) return
      saveWorkoutDraft(userId, get().getDraft())
    },

    clearDraft: () => {
      const { userId } = get()
      if (userId) clearWorkoutDraft(userId)
    },
  })),
)

let draftTimer: ReturnType<typeof setTimeout> | null = null

useWorkoutStore.subscribe(
  (state) => ({
    userId: state.userId,
    exercises: state.exercises,
    date: state.date,
    notes: state.notes,
    durationMinutes: state.durationMinutes,
    mode: state.mode,
    workoutId: state.workoutId,
    programId: state.programId,
    isDirty: state.isDirty,
  }),
  (snapshot) => {
    if (!snapshot.userId || !snapshot.isDirty || snapshot.exercises.length === 0) {
      return
    }
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(() => {
      const persist = () => useWorkoutStore.getState().persistDraft()
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(persist)
      } else {
        persist()
      }
    }, 1500)
  },
)
