import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BodyHeatmap } from '@/components/body-map/BodyHeatmap'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { mockTonnageByMuscle, muscleVolumeToBodyParts } from '@/lib/body-map'

export function DashboardHeatmapCard() {
  const navigate = useNavigate()
  const bodyParts = useMemo(
    () => muscleVolumeToBodyParts(mockTonnageByMuscle()),
    [],
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Muscle volume</CardTitle>
          <CardDescription>
            Volume map coming in Phase 2. Preview below uses sample data.
          </CardDescription>
        </div>
        <Button
          variant="tertiary"
          size="sm"
          type="button"
          onClick={() => navigate('/body-map')}
        >
          Open body map
        </Button>
      </CardHeader>
      <CardContent>
        <BodyHeatmap data={bodyParts} side="front" scale={0.9} />
      </CardContent>
    </Card>
  )
}
