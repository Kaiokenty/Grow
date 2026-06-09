import { useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ThemeMenu } from '@/components/ThemeMenu'
import { PageTransition } from '@/components/layout/PageTransition'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useUserSettings } from '@/hooks/useUserSettings'
import { exercisesQueryKey, fetchExercises } from '@/lib/api/exercises'
import { fetchWeeklySummary } from '@/hooks/useWeeklySummary'
import {
  dashboardSummaryQueryKey,
  fetchWorkoutsPage,
  workoutsQueryKey,
} from '@/lib/api/workouts'
import { useWorkoutStore } from '@/stores/workout'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', to: '/', end: true },
  { label: 'Body map', to: '/body-map', end: false },
  { label: 'Workouts', to: '/workouts', end: false },
  { label: 'Exercises', to: '/exercises', end: false },
  { label: 'Programs', to: '/programs', end: false },
  { label: 'Blocks', to: '/blocks', end: false },
  { label: 'Settings', to: '/settings', end: false },
] as const

export function AppShell() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const weekStartDay = settings?.week_start_day ?? 1

  const startWorkout = () => {
    useWorkoutStore.getState().reset()
    useWorkoutStore.getState().startNew()
    navigate('/workouts/active')
  }

  const prefetchRoute = useCallback(
    (to: string) => {
      if (!user?.id) return

      if (to === '/') {
        void queryClient.prefetchQuery({
          queryKey: dashboardSummaryQueryKey(user.id, weekStartDay),
          queryFn: () => fetchWeeklySummary(weekStartDay),
        })
        return
      }

      if (to === '/workouts') {
        void queryClient.prefetchInfiniteQuery({
          queryKey: workoutsQueryKey(user.id),
          queryFn: () => fetchWorkoutsPage(0),
          initialPageParam: 0,
        })
        return
      }

      if (to === '/exercises') {
        void queryClient.prefetchQuery({
          queryKey: exercisesQueryKey(user.id),
          queryFn: () => fetchExercises(user.id),
        })
      }
    },
    [queryClient, user?.id, weekStartDay],
  )

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium tracking-tight text-foreground">
              Grow
            </span>
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onMouseEnter={() => prefetchRoute(item.to)}
                  className={({ isActive }) =>
                    cn(
                      'relative rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
                      isActive &&
                        'font-medium text-foreground after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={startWorkout}>
              Log workout
            </Button>
            <ThemeMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <PageTransition />
      </main>
    </div>
  )
}
