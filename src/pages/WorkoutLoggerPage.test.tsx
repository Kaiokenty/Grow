import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LoggerShell } from '@/components/layout/LoggerShell'
import { WorkoutLoggerPage } from '@/pages/WorkoutLoggerPage'
import { useWorkoutStore } from '@/stores/workout'

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
  useExercises: () => ({ data: [] }),
  useRecentExercises: () => ({ data: [] }),
  fetchLastSessionSet: vi.fn(),
  fetchLastSessionSetsBatch: vi.fn(),
}))

vi.mock('@/hooks/usePrograms', () => ({
  useProgramExercises: () => ({ data: undefined }),
}))

vi.mock('@/hooks/useWorkouts', () => ({
  useWorkoutDetail: () => ({ data: undefined }),
  useWorkoutSets: () => ({ data: undefined }),
  useSaveWorkout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteWorkout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  workoutSetsToSessionExercises: vi.fn(),
}))

function renderAppRoute(initialPath = '/workouts/active') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<LoggerShell />}>
            <Route path="workouts/active" element={<WorkoutLoggerPage />} />
            <Route path="workouts/:id/edit" element={<WorkoutLoggerPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('WorkoutLoggerPage', () => {
  beforeEach(() => {
    useWorkoutStore.getState().reset()
  })

  it('renders active workout inside logger shell', async () => {
    renderAppRoute()
    expect(await screen.findByRole('button', { name: /← workouts/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /active workout/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add exercise/i })).toBeInTheDocument()
  })
})
