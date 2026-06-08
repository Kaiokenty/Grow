import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { clearWorkoutDraft, loadWorkoutDraft } from '@/lib/workout-draft'
import { useWorkoutStore } from '@/stores/workout'

type ResumeDraftBannerProps = {
  userId: string
}

export function ResumeDraftBanner({ userId }: ResumeDraftBannerProps) {
  const navigate = useNavigate()
  const draft = loadWorkoutDraft(userId)
  if (!draft) return null

  const handleResume = () => {
    useWorkoutStore.getState().hydrateDraft(draft)
    navigate('/workouts/active')
  }

  const handleDiscard = () => {
    clearWorkoutDraft(userId)
    useWorkoutStore.getState().reset()
    window.location.reload()
  }

  return (
    <Card className="rounded-xl border-amber-500/30 bg-amber-500/5 shadow-sm">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Unfinished workout</p>
          <p className="text-sm text-muted-foreground">
            {draft.exercises.length} exercise
            {draft.exercises.length === 1 ? '' : 's'} from{' '}
            {draft.date}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDiscard}>
            Discard
          </Button>
          <Button size="sm" onClick={handleResume}>
            Resume
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
