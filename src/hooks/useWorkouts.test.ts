import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSaveWorkout } from '@/hooks/useWorkouts'
import { emptySetRow, newClientId, type WorkoutDraft } from '@/lib/workout/types'

const { rpcMock, setsInsertMock, workoutInsertMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  setsInsertMock: vi.fn(),
  workoutInsertMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'workouts') {
        return {
          insert: workoutInsertMock,
          update: vi.fn(),
        }
      }
      if (table === 'sets') {
        return {
          insert: setsInsertMock,
          delete: vi.fn(),
        }
      }
      return {}
    },
    rpc: rpcMock,
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useSaveWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    workoutInsertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'workout-1' },
          error: null,
        }),
      }),
    })
    setsInsertMock.mockResolvedValue({ error: null })
    rpcMock.mockResolvedValue({ error: null })
  })

  it('calls refresh_analytics_for_user after sets insert', async () => {
    const draft: WorkoutDraft = {
      mode: 'new',
      date: '2026-06-08',
      notes: '',
      durationMinutes: '',
      programId: null,
      exercises: [
        {
          clientId: newClientId(),
          exerciseId: 'ex-1',
          sets: [
            emptySetRow(1, {
              reps: '8',
              weightDisplay: '100',
              rpe: '8',
              setType: 'working',
            }),
          ],
        },
      ],
    }

    const { result } = renderHook(() => useSaveWorkout('user-1'), {
      wrapper: createWrapper(),
    })

    await result.current.mutateAsync({ draft, displayUnit: 'kg' })

    await waitFor(() => {
      expect(setsInsertMock).toHaveBeenCalled()
      expect(rpcMock).toHaveBeenCalledWith('refresh_analytics_for_user', {
        p_user_id: 'user-1',
        p_workout_date: '2026-06-08',
      })
    })
  })
})
