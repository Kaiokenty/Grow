import { Outlet, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { formatWorkoutDateShort } from '@/lib/dates'
import { useWorkoutStore } from '@/stores/workout'

export function LoggerShell() {
  const navigate = useNavigate()
  const { date, mode } = useWorkoutStore(
    useShallow((state) => ({ date: state.date, mode: state.mode })),
  )

  const title =
    mode === 'edit'
      ? `Editing ${formatWorkoutDateShort(date)}`
      : formatWorkoutDateShort(date)

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workouts')}>
            ← Workouts
          </Button>
          <span className="text-sm font-medium tracking-tight">{title}</span>
          <div className="w-20" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <Outlet />
      </main>
    </div>
  )
}
