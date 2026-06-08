import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useDeleteProgram, usePrograms } from '@/hooks/usePrograms'
import { useWorkoutStore } from '@/stores/workout'

export function ProgramsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: programs = [], isLoading, error } = usePrograms(user?.id)
  const deleteProgram = useDeleteProgram(user?.id)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        description="Named exercise lists. No prescribed sets yet."
        actions={<Button onClick={() => navigate('/programs/new')}>New program</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved programs</CardTitle>
          <CardDescription>Start a workout from any program.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <PageSkeleton rows={3} />}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error instanceof Error ? error.message : 'Failed to load'}
            </p>
          )}
          {!isLoading && programs.length === 0 && (
            <EmptyState
              title="No programs yet"
              description="Create a program to pre-fill exercises when you start a workout."
              action={
                <Button onClick={() => navigate('/programs/new')}>New program</Button>
              }
            />
          )}
          <ul className="divide-y divide-border/60">
            {programs.map((program) => (
              <li key={program.id} className="flex items-center justify-between gap-4 py-3">
                <button
                  type="button"
                  onClick={() => navigate(`/programs/${program.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium">{program.name}</p>
                  {program.notes && (
                    <p className="truncate text-xs text-muted-foreground">
                      {program.notes}
                    </p>
                  )}
                </button>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      useWorkoutStore.getState().reset()
                      useWorkoutStore.getState().startNew({ programId: program.id })
                      navigate(`/workouts/active?programId=${program.id}`)
                    }}
                  >
                    Start
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (window.confirm('Delete this program?')) {
                        void deleteProgram.mutateAsync(program.id)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
