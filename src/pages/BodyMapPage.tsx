import { useMemo, useState } from 'react'
import type { Slug } from '@mjcdev/react-body-highlighter'
import { BodyHeatmap } from '@/components/body-map/BodyHeatmap'
import { BodyHeatmapLegend } from '@/components/body-map/BodyHeatmapLegend'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  GROW_MUSCLE_GROUPS,
  MOCK_WEEKLY_VOLUME,
  mockTonnageByMuscle,
  muscleVolumeToBodyParts,
  volumeToIntensity,
  maxVolume,
  type GrowMuscleGroup,
} from '@/lib/body-map'
import { MUSCLE_TO_SLUGS } from '@/lib/body-map/muscle-slugs'

function slugToMuscles(slug: Slug): GrowMuscleGroup[] {
  return GROW_MUSCLE_GROUPS.filter((muscle) =>
    MUSCLE_TO_SLUGS[muscle].includes(slug),
  )
}

function formatMuscleLabel(muscle: GrowMuscleGroup): string {
  return muscle.replace(/_/g, ' ')
}

export function BodyMapPage() {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [selectedSlug, setSelectedSlug] = useState<Slug | null>(null)

  const tonnageByMuscle = useMemo(() => mockTonnageByMuscle(), [])
  const bodyParts = useMemo(
    () => muscleVolumeToBodyParts(tonnageByMuscle),
    [tonnageByMuscle],
  )
  const maxKg = useMemo(() => maxVolume(tonnageByMuscle), [tonnageByMuscle])

  const selectedMuscles = selectedSlug ? slugToMuscles(selectedSlug) : []
  const selectedStats = selectedMuscles.map((muscle) => ({
    muscle,
    ...MOCK_WEEKLY_VOLUME[muscle],
    intensity: volumeToIntensity(
      MOCK_WEEKLY_VOLUME[muscle].tonnage_kg,
      maxKg,
    ),
  }))

  const muscleRows = useMemo(
    () =>
      [...GROW_MUSCLE_GROUPS]
        .map((muscle) => ({
          muscle,
          ...MOCK_WEEKLY_VOLUME[muscle],
          intensity: volumeToIntensity(
            MOCK_WEEKLY_VOLUME[muscle].tonnage_kg,
            maxKg,
          ),
        }))
        .sort((a, b) => b.tonnage_kg - a.tonnage_kg),
    [maxKg],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-balance">
          Body map
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sample weekly volume — real data in Phase 2.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={side === 'front' ? 'primary' : 'tertiary'}
          size="sm"
          onClick={() => setSide('front')}
        >
          Front
        </Button>
        <Button
          variant={side === 'back' ? 'primary' : 'tertiary'}
          size="sm"
          onClick={() => setSide('back')}
        >
          Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="rounded-xl">
          <CardContent className="space-y-4 pt-6">
            <BodyHeatmap
              data={bodyParts}
              side={side}
              scale={1.2}
              onMuscleClick={setSelectedSlug}
            />
            <BodyHeatmapLegend />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedSlug ? selectedSlug.replace(/-/g, ' ') : 'Select muscle'}
            </CardTitle>
            <CardDescription>
              {selectedSlug
                ? 'Sample stats for mapped muscle groups.'
                : 'Click a region on the body map.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {selectedStats.length > 0 ? (
              selectedStats.map((row) => (
                <div
                  key={row.muscle}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <p className="font-medium capitalize">
                    {formatMuscleLabel(row.muscle)}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <dt className="text-xs">Sets</dt>
                      <dd className="tabular-nums text-foreground">{row.sets}</dd>
                    </div>
                    <div>
                      <dt className="text-xs">Tonnage</dt>
                      <dd className="tabular-nums text-foreground">
                        {row.tonnage_kg.toLocaleString()} kg
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs">Intensity</dt>
                      <dd className="tabular-nums text-foreground">
                        {row.intensity === 0 ? 'Untrained' : `${row.intensity}/4`}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                Front and back views share the same sample volume data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Volume by muscle group</CardTitle>
          <CardDescription>
            Text list for accessibility — matches heatmap buckets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60 text-sm">
            {muscleRows.map((row) => (
              <li
                key={row.muscle}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <span className="capitalize">{formatMuscleLabel(row.muscle)}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.tonnage_kg > 0
                    ? `${row.tonnage_kg.toLocaleString()} kg · ${row.intensity}/4`
                    : 'Untrained'}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
