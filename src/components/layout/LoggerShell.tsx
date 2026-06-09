import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { formatWorkoutDateShort } from '@/lib/dates'
import { useWorkoutStore } from '@/stores/workout'

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function LoggerShell() {
  const navigate = useNavigate()
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const { date, mode } = useWorkoutStore(
    useShallow((state) => ({ date: state.date, mode: state.mode })),
  )

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt)
    }, 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

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
          <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
            {formatElapsed(elapsed)}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        <Outlet />
      </main>
    </div>
  )
}
