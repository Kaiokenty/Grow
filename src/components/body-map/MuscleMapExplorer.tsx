import { useEffect, useMemo, useRef, useState } from 'react'
import type { Slug } from '@mjcdev/react-body-highlighter'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalyticsRangeSelector } from '@/components/analytics/AnalyticsRangeSelector'
import { BalanceSummaryBar } from '@/components/body-map/BalanceSummaryBar'
import { BodyHeatmap } from '@/components/body-map/BodyHeatmap'
import { BodyHeatmapLegend } from '@/components/body-map/BodyHeatmapLegend'
import { MuscleDetailPanel } from '@/components/body-map/MuscleDetailPanel'
import { MuscleOverviewPanel } from '@/components/body-map/MuscleOverviewPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  analyticsPresetLabel,
  type AnalyticsRangePreset,
} from '@/hooks/useAnalyticsRange'
import {
  useMuscleHeatmap,
  useMuscleVolumeHistory,
  useMuscleWeekStats,
  useWeeklySummaryNlg,
} from '@/hooks/useMuscleAnalytics'
import { useWeeklySummary } from '@/hooks/useWeeklySummary'
import {
  GROW_MUSCLE_GROUPS,
  formatMuscleLabel,
  isBackOnlySlug,
  muscleSetsToBodyParts,
  slugToMuscles,
  type BalanceView,
  type GrowMuscleGroup,
} from '@/lib/body-map'
import { formatWorkoutDateShort } from '@/lib/dates'
import { formatTonnage, type DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

type MuscleMapExplorerProps = {
  userId: string
  weekStartDay: number
  displayUnit: DisplayUnit
  rangeWeeks?: number
  analyticsPreset?: AnalyticsRangePreset
  onAnalyticsPresetChange?: (preset: AnalyticsRangePreset) => void
  variant?: 'dashboard' | 'explore'
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

function heatmapToSetsMap(
  rows: { muscle: GrowMuscleGroup; sets: number }[],
): Partial<Record<GrowMuscleGroup, number>> {
  const map: Partial<Record<GrowMuscleGroup, number>> = {}
  for (const row of rows) {
    map[row.muscle] = Number(row.sets)
  }
  return map
}

export function MuscleMapExplorer({
  userId,
  weekStartDay,
  displayUnit,
  rangeWeeks = 1,
  analyticsPreset = 1,
  onAnalyticsPresetChange,
  variant = 'dashboard',
  initialMuscle = null,
  className,
}: MuscleMapExplorerProps) {
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [selectedSlug, setSelectedSlug] = useState<Slug | null>(null)
  const [selectedMuscle, setSelectedMuscle] = useState<GrowMuscleGroup | null>(
    initialMuscle,
  )
  const isExplore = variant === 'explore'
  const effectiveRangeWeeks = isExplore ? rangeWeeks : 1
  const effectivePreset = isExplore ? analyticsPreset : 1

  const [balanceView, setBalanceView] = useState<BalanceView>('push_pull_legs')
  const [listingVisible, setListingVisible] = useState(false)
  const listingRef = useRef<HTMLDivElement>(null)

  const { data: heatmapRows = [], isLoading: heatmapLoading } = useMuscleHeatmap(
    userId,
    weekStartDay,
    effectiveRangeWeeks,
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
    effectiveRangeWeeks,
  )
  const { data: volumeHistory = [] } = useMuscleVolumeHistory(
    userId,
    isExplore ? selectedMuscle : null,
    effectiveRangeWeeks,
  )

  const volumeByMuscle = useMemo(
    () => heatmapToVolumeMap(heatmapRows),
    [heatmapRows],
  )

  const setsByMuscle = useMemo(
    () => heatmapToSetsMap(heatmapRows),
    [heatmapRows],
  )

  const bodyParts = useMemo(
    () => muscleSetsToBodyParts(setsByMuscle),
    [setsByMuscle],
  )

  useEffect(() => {
    if (variant !== 'explore') return
    const node = listingRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => setListingVisible(entry?.isIntersecting ?? false),
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [variant, heatmapRows.length])

  const rangeLabel = isExplore
    ? effectivePreset === 1
      ? 'This week'
      : `${analyticsPresetLabel(effectivePreset)} avg/week`
    : 'This week'

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
    <div className={cn('space-y-4', className)}>
      {isExplore ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Weighted volume · {rangeLabel}
              {muscleStats?.current_week_in_progress && effectivePreset === 1
                ? ' (in progress)'
                : ''}
            </p>
            {onAnalyticsPresetChange && (
              <AnalyticsRangeSelector
                preset={analyticsPreset}
                onPresetChange={onAnalyticsPresetChange}
              />
            )}
          </div>
          <BalanceSummaryBar
            volumeByMuscle={volumeByMuscle}
            displayUnit={displayUnit}
            view={balanceView}
            onViewChange={setBalanceView}
          />
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          This week · tap a muscle for a quick peek, or open body map for full
          analytics
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,2fr)_minmax(320px,3fr)]">
        <Card
          className={cn(
            'rounded-xl lg:self-start',
            isExplore && !listingVisible && 'lg:sticky lg:top-20',
          )}
        >
          <CardContent className="mx-auto max-w-xs space-y-4 pt-6">
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
              scale={isExplore ? 1.2 : 1}
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
                  displayUnit={displayUnit}
                  rangeLabel={rangeLabel}
                  isLoading={muscleStatsLoading || heatmapLoading}
                  compact={!isExplore}
                  showDeepDiveLink
                />
                {isExplore && volumeHistory.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {analyticsPresetLabel(effectivePreset)} weighted volume
                    </p>
                    <div className="mt-3 h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={volumeHistory}>
                          <XAxis
                            dataKey="week_start"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v: string) =>
                              formatWorkoutDateShort(v)
                            }
                          />
                          <YAxis tick={{ fontSize: 10 }} width={40} />
                          <Tooltip
                            formatter={(value) => [
                              formatTonnage(Number(value ?? 0), displayUnit),
                              'Weighted',
                            ]}
                            labelFormatter={(label) =>
                              formatWorkoutDateShort(String(label))
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="weighted_tonnage_kg"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            dot={volumeHistory.length < 2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {isExplore && (muscleStats?.top_exercises?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Exercises in range
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

        {isExplore && (
          <div ref={listingRef} className="lg:col-span-2">
          <Card className="rounded-xl">
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
                      <span className="capitalize">
                        {formatMuscleLabel(row.muscle)}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {row.tonnage > 0
                          ? formatTonnage(row.tonnage, displayUnit)
                          : 'Untrained'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          </div>
        )}
      </div>
    </div>
  )
}
