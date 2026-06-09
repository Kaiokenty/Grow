import { useMemo, useState } from 'react'
import type { Slug } from '@mjcdev/react-body-highlighter'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BodyHeatmap } from '@/components/body-map/BodyHeatmap'
import { BodyHeatmapLegend } from '@/components/body-map/BodyHeatmapLegend'
import { MuscleDetailPanel } from '@/components/body-map/MuscleDetailPanel'
import { MuscleOverviewPanel } from '@/components/body-map/MuscleOverviewPanel'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { useMuscleHeatmap, useMuscleVolumeHistory, useMuscleWeekStats, useWeeklySummaryNlg } from '@/hooks/useMuscleAnalytics'
import { useWeeklySummary } from '@/hooks/useWeeklySummary'
import {
  GROW_MUSCLE_GROUPS,
  formatMuscleLabel,
  isBackOnlySlug,
  muscleVolumeToBodyParts,
  slugToMuscles,
  type GrowMuscleGroup,
} from '@/lib/body-map'
import type { DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

type MuscleMapExplorerProps = {
  userId: string
  weekStartDay: number
  displayUnit: DisplayUnit
  variant?: 'dashboard' | 'explore'
  chartWeeks?: number
  initialMuscle?: GrowMuscleGroup | null
  className?: string
}

function heatmapToVolumeMap(
  rows: { muscle: GrowMuscleGroup; weighted_tonnage_kg: number }[],
): Partial<Record<GrowMuscleGroup, number>> {
  const map: Partial<Record<GrowMuscleGroup, number>> = {}
  for (const row of rows) {
    map[row.muscle] = row.weighted_tonnage_kg
  }
  return map
}

export function MuscleMapExplorer({
  userId,
  weekStartDay,
  displayUnit,
  variant = 'dashboard',
  chartWeeks = 6,
  initialMuscle = null,
  className,
}: MuscleMapExplorerProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [selectedSlug, setSelectedSlug] = useState<Slug | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<GrowMuscleGroup | null>(
    initialMuscle,
  )

  const { data: heatmapRows = [], isLoading: heatmapLoading } = useMuscleHeatmap(
    userId,
    weekStartDay,
  )
  const { data: summary, isLoading: summaryLoading } = useWeeklySummary(
    userId,
    weekStartDay,
  )
  const { data: nlg } = useWeeklySummaryNlg(userId, weekStartDay)
  const { data: muscleStats, isLoading: muscleStatsLoading } = useMuscleWeekStats(
    userId,
    selectedMuscle,
    weekStartDay,
  )
  const { data: volumeHistory = [] } = useMuscleVolumeHistory(
    userId,
    variant === 'explore' ? selectedMuscle : null,
    chartWeeks,
  )

  const volumeByMuscle = useMemo(
    () => heatmapToVolumeMap(heatmapRows),
    [heatmapRows],
  )

  const bodyParts = useMemo(
    () => muscleVolumeToBodyParts(volumeByMuscle),
    [volumeByMuscle],
  )

  const handleMuscleClick = (slug: Slug) => {
    if (selectedSlug === slug) {
      setSelectedSlug(null)
      setSelectedMuscle(null)
      return
    }
    setSelectedSlug(slug)
    const muscles = slugToMuscles(slug)
    setSelectedMuscle(muscles[0] ?? null)
    if (isBackOnlySlug(slug)) setSide('back')
  }

  const muscleRows = useMemo(
    () =>
      [...GROW_MUSCLE_GROUPS]
        .map((muscle) => ({
          muscle,
          tonnage: volumeByMuscle[muscle] ?? 0,
        }))
        .sort((a, b) => b.tonnage - a.tonnage),
    [volumeByMuscle],
  )

  return (
    <div className={cn('grid gap-6 lg:grid-cols-[minmax(280px,2fr)_minmax(320px,3fr)]', className)}>
      <Card className="rounded-xl lg:sticky lg:top-20 lg:self-start">
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Button
              variant={side === 'front' ? 'primary' : 'tertiary'}
              size="sm"
              type="button"
              onClick={() => setSide('front')}
            >
              Front
            </Button>
            <Button
              variant={side === 'back' ? 'primary' : 'tertiary'}
              size="sm"
              type="button"
              onClick={() => setSide('back')}
            >
              Back
            </Button>
          </div>
          <BodyHeatmap
            data={bodyParts}
            side={side}
            scale={variant === 'explore' ? 1.2 : 1}
            selectedSlug={selectedSlug}
            onMuscleClick={handleMuscleClick}
          />
          <BodyHeatmapLegend />
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="pt-6">
          {selectedMuscle ? (
            <div className="space-y-6">
              <MuscleDetailPanel
                muscle={selectedMuscle}
                stats={muscleStats}
                volumeByMuscle={volumeByMuscle}
                displayUnit={displayUnit}
                isLoading={muscleStatsLoading || heatmapLoading}
                showDeepDiveLink={variant === 'dashboard'}
              />
              {variant === 'explore' && volumeHistory.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {chartWeeks}-week weighted volume
                  </p>
                  <div className="mt-3 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={volumeHistory}>
                        <XAxis
                          dataKey="week_start"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(v: string) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 10 }} width={40} />
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value ?? 0).toLocaleString()} kg`,
                            'Weighted',
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="weighted_tonnage_kg"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {variant === 'explore' && (muscleStats?.top_exercises?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    All exercises this week
                  </p>
                  <ul className="mt-2 divide-y divide-border/60 text-sm">
                    {muscleStats!.top_exercises.map((ex) => (
                      <li
                        key={ex.exercise_id}
                        className="flex justify-between py-2"
                      >
                        <span>{ex.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {ex.sets} sets
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <MuscleOverviewPanel
              summary={summary}
              nlg={nlg}
              displayUnit={displayUnit}
              isLoading={summaryLoading || heatmapLoading}
            />
          )}
        </CardContent>
      </Card>

      {variant === 'explore' && (
        <Card className="rounded-xl lg:col-span-2">
          <CardContent className="pt-6">
            <p className="text-sm font-medium">Volume by muscle</p>
            <ul className="mt-3 divide-y divide-border/60 text-sm">
              {muscleRows.map((row) => (
                <li key={row.muscle}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-2.5 text-left hover:bg-accent/50"
                    onClick={() => {
                      setSelectedMuscle(row.muscle)
                      setSelectedSlug(null)
                    }}
                  >
                    <span className="capitalize">{formatMuscleLabel(row.muscle)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.tonnage > 0
                        ? `${Math.round(row.tonnage).toLocaleString()} kg`
                        : 'Untrained'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
