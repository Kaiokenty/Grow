import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  useExercisePerformanceHistory,
  useFatigueSummary,
  useWeeklyVolumeHistory,
} from '@/hooks/useMuscleAnalytics'
import {
  weekRangeAllTime,
  weekRangeForPreset,
  zeroFillWeekSeries,
} from '@/lib/analytics/week-series'
import { formatWeekLabel, formatWorkoutDateShort } from '@/lib/dates'
import { formatE1rmValue, formatTonnageValue, type DisplayUnit } from '@/lib/units'

type DashboardChartsProps = {
  userId: string
  chartWeeks: number
  weekStartDay: number
  displayUnit: DisplayUnit
  allTime?: boolean
}

export function DashboardCharts({
  userId,
  chartWeeks,
  weekStartDay,
  displayUnit,
  allTime = false,
}: DashboardChartsProps) {
  const [volumeMetric, setVolumeMetric] = useState<'tonnage' | 'sets'>('tonnage')
  const [volumeScope, setVolumeScope] = useState<'total' | 'compound'>('total')
  const historyWeeks = allTime ? 0 : chartWeeks
  const { data: weeklyVolume = [], isLoading: volumeLoading } =
    useWeeklyVolumeHistory(userId, historyWeeks)
  const { data: exercisePerf = [], isLoading: perfLoading } =
    useExercisePerformanceHistory(userId, allTime ? 200 : chartWeeks)
  const { data: fatigue } = useFatigueSummary(userId)

  const stalledNames = useMemo(
    () => new Set(fatigue?.stalled_exercises ?? []),
    [fatigue?.stalled_exercises],
  )

  const volumeChartData = useMemo(() => {
    const range = allTime
      ? weekRangeAllTime(weeklyVolume[0]?.week_start, weekStartDay)
      : weekRangeForPreset(chartWeeks, weekStartDay)
    const filled = zeroFillWeekSeries(
      weeklyVolume.map((row) => ({
        week_start: row.week_start,
        tonnage: Number(row.tonnage),
        sets: row.total_sets,
        compound: Number(row.compound_volume),
        avg_rpe: row.avg_rpe != null ? Number(row.avg_rpe) : null,
      })),
      range.start,
      range.end,
      weekStartDay,
      { tonnage: 0, sets: 0, compound: 0, avg_rpe: null as number | null },
    )
    return filled.map((row) => ({
      week: formatWorkoutDateShort(row.week_start),
      weekStart: row.week_start,
      tonnage: formatTonnageValue(row.tonnage, displayUnit),
      sets: row.sets,
      compound: formatTonnageValue(row.compound, displayUnit),
      avg_rpe: row.avg_rpe,
    }))
  }, [allTime, chartWeeks, displayUnit, weekStartDay, weeklyVolume])

  const liftChartData = useMemo(() => {
    const tracked = exercisePerf.filter(
      (row) =>
        row.exercises &&
        typeof row.exercises === 'object' &&
        'is_tracked' in row.exercises &&
        (row.exercises as { is_tracked: boolean }).is_tracked &&
        row.e1rm != null,
    )
    const byExercise = new Map<
      string,
      { name: string; points: { week: string; weekStart: string; e1rm: number }[] }
    >()
    for (const row of tracked) {
      const name =
        row.exercises && typeof row.exercises === 'object' && 'name' in row.exercises
          ? (row.exercises as { name: string }).name
          : 'Lift'
      if (!byExercise.has(row.exercise_id)) {
        byExercise.set(row.exercise_id, { name, points: [] })
      }
      byExercise.get(row.exercise_id)!.points.push({
        week: formatWorkoutDateShort(row.week_start),
        weekStart: row.week_start,
        e1rm: formatE1rmValue(Number(row.e1rm), displayUnit),
      })
    }
    return [...byExercise.values()]
      .map((lift) => ({
        ...lift,
        points: [...lift.points].sort((a, b) =>
          a.weekStart.localeCompare(b.weekStart),
        ),
      }))
      .slice(0, 4)
  }, [displayUnit, exercisePerf])

  const hasTrackedLifts = useMemo(
    () =>
      exercisePerf.some(
        (row) =>
          row.exercises &&
          typeof row.exercises === 'object' &&
          'is_tracked' in row.exercises &&
          (row.exercises as { is_tracked: boolean }).is_tracked,
      ),
    [exercisePerf],
  )

  const stalledLiftNames = useMemo(
    () => liftChartData.filter((lift) => stalledNames.has(lift.name)).map((l) => l.name),
    [liftChartData, stalledNames],
  )

  const volumeBarKey =
    volumeMetric === 'sets' ? 'sets' : volumeScope === 'compound' ? 'compound' : 'tonnage'

  const rpeChartData = useMemo(
    () =>
      volumeChartData
        .filter((row) => row.avg_rpe != null)
        .map((row) => ({
          week: row.week,
          rpe: Number(row.avg_rpe),
        })),
    [volumeChartData],
  )

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-xl lg:col-span-2">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Weekly volume</CardTitle>
            <CardDescription>
              Calendar week · working sets
              {volumeMetric === 'tonnage' && volumeScope === 'compound'
                ? ' · compound exercises only'
                : ''}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center">
            {volumeMetric === 'tonnage' && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={volumeScope === 'total' ? 'primary' : 'tertiary'}
                  onClick={() => setVolumeScope('total')}
                >
                  Total
                </Button>
                <Button
                  size="sm"
                  variant={volumeScope === 'compound' ? 'primary' : 'tertiary'}
                  onClick={() => setVolumeScope('compound')}
                >
                  Compound
                </Button>
              </div>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={volumeMetric === 'tonnage' ? 'primary' : 'tertiary'}
                onClick={() => setVolumeMetric('tonnage')}
              >
                Tonnage
              </Button>
              <Button
                size="sm"
                variant={volumeMetric === 'sets' ? 'primary' : 'tertiary'}
                onClick={() => setVolumeMetric('sets')}
              >
                Sets
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {volumeLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-muted" />
          ) : volumeChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No volume history yet.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} unit={displayUnit} />
                  <Tooltip
                    labelFormatter={(_, payload) => {
                      const weekStart = payload?.[0]?.payload?.weekStart as
                        | string
                        | undefined
                      return weekStart ? formatWeekLabel(weekStart) : ''
                    }}
                  />
                  <Bar
                    dataKey={volumeBarKey}
                    fill="var(--accent)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Tracked lifts (e1RM)</CardTitle>
          <CardDescription>
            Best estimated max per calendar week
            {stalledLiftNames.length > 0 && (
              <span className="mt-1 block text-amber-600 dark:text-amber-500">
                Stalled: {stalledLiftNames.join(', ')}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {perfLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          ) : liftChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasTrackedLifts
                ? 'No e1RM history yet — log working sets (≤10 reps) or re-import workouts.'
                : 'Mark exercises as tracked to see e1RM trends.'}
            </p>
          ) : (
            <div className="space-y-4">
              {liftChartData.map((lift) => (
                <div key={lift.name}>
                  <p className="mb-1 text-xs font-medium">{lift.name}</p>
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lift.points}>
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} width={36} unit={displayUnit} />
                        <Tooltip
                          labelFormatter={(_, payload) => {
                            const weekStart = payload?.[0]?.payload?.weekStart as
                              | string
                              | undefined
                            return weekStart ? formatWeekLabel(weekStart) : ''
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="e1rm"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          dot={lift.points.length < 2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">RPE trend</CardTitle>
          <CardDescription>Calendar week average (working sets)</CardDescription>
        </CardHeader>
        <CardContent>
          {volumeLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          ) : rpeChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No RPE data yet.</p>
          ) : (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rpeChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[6, 10]} tick={{ fontSize: 11 }} width={32} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="rpe"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
