import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { WorkoutDetailPage } from '@/pages/WorkoutDetailPage'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    loading: false,
    session: null,
    signOut: vi.fn(),
  }),
}))

vi.mock('@/hooks/useUserSettings', () => ({
  useUserSettings: () => ({
    data: { display_unit: 'kg', week_start_day: 1, chart_weeks: 6 },
  }),
}))

vi.mock('@/hooks/useExercises', () => ({
  useExercises: () => ({
    data: [{ id: 'ex-1', name: 'Bench Press' }],
  }),
}))

vi.mock('@/hooks/useWorkouts', () => ({
  useWorkoutDetail: () => ({
    data: {
      id: 'workout-1',
      date: '2026-06-08',
      duration_minutes: 45,
      notes: 'Good session',
      user_id: 'user-1',
    },
    isLoading: false,
  }),
  useWorkoutSets: () => ({
    data: [
      {
        id: 'set-1',
        workout_id: 'workout-1',
        exercise_id: 'ex-1',
        set_number: 1,
        set_type: 'working',
        reps: 8,
        weight_kg: 100,
        rpe: 8,
        created_at: '2026-06-08T10:00:00Z',
      },
    ],
    isLoading: false,
  }),
  useDeleteWorkout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  workoutSetsToSessionExercises: (sets: { exercise_id: string }[]) => [
  {
    clientId: 'client-1',
    exerciseId: sets[0]?.exercise_id ?? 'ex-1',
    sets: [],
  },
],
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workouts/workout-1']}>
        <Routes>
          <Route path="workouts/:id" element={<WorkoutDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('WorkoutDetailPage', () => {
  it('renders workout header and read-only sets', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: /jun/i })).toBeInTheDocument()
    expect(screen.getByText(/good session/i)).toBeInTheDocument()
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})
