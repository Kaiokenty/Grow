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

type DashboardChartsProps = {
  userId: string
  chartWeeks: number
}

export function DashboardCharts({ userId, chartWeeks }: DashboardChartsProps) {
  const [volumeMetric, setVolumeMetric] = useState<'tonnage' | 'sets'>('tonnage')
  const [volumeScope, setVolumeScope] = useState<'total' | 'compound'>('total')
  const { data: weeklyVolume = [], isLoading: volumeLoading } =
    useWeeklyVolumeHistory(userId, chartWeeks)
  const { data: exercisePerf = [], isLoading: perfLoading } =
    useExercisePerformanceHistory(userId, chartWeeks)
  const { data: fatigue } = useFatigueSummary(userId)

  const stalledNames = useMemo(
    () => new Set(fatigue?.stalled_exercises ?? []),
    [fatigue?.stalled_exercises],
  )

  const volumeChartData = useMemo(
    () =>
      weeklyVolume.map((row) => ({
        week: row.week_start.slice(5),
        tonnage: Number(row.tonnage),
        sets: row.total_sets,
        compound: Number(row.compound_volume),
      })),
    [weeklyVolume],
  )

  const liftChartData = useMemo(() => {
    const tracked = exercisePerf.filter(
      (row) =>
        row.exercises &&
        typeof row.exercises === 'object' &&
        'is_tracked' in row.exercises &&
        (row.exercises as { is_tracked: boolean }).is_tracked &&
        row.e1rm != null,
    )
    const byExercise = new Map<string, { name: string; points: { week: string; e1rm: number }[] }>()
    for (const row of tracked) {
      const name =
        row.exercises && typeof row.exercises === 'object' && 'name' in row.exercises
          ? (row.exercises as { name: string }).name
          : 'Lift'
      if (!byExercise.has(row.exercise_id)) {
        byExercise.set(row.exercise_id, { name, points: [] })
      }
      byExercise.get(row.exercise_id)!.points.push({
        week: row.week_start.slice(5),
        e1rm: Number(row.e1rm),
      })
    }
    return [...byExercise.values()].slice(0, 4)
  }, [exercisePerf])

  const stalledLiftNames = useMemo(
    () => liftChartData.filter((lift) => stalledNames.has(lift.name)).map((l) => l.name),
    [liftChartData, stalledNames],
  )

  const volumeBarKey =
    volumeMetric === 'sets' ? 'sets' : volumeScope === 'compound' ? 'compound' : 'tonnage'

  const rpeChartData = useMemo(
    () =>
      weeklyVolume
        .filter((row) => row.avg_rpe != null)
        .map((row) => ({
          week: row.week_start.slice(5),
          rpe: Number(row.avg_rpe),
        })),
    [weeklyVolume],
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
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip />
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
              Mark exercises as tracked to see e1RM trends.
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
                        <YAxis tick={{ fontSize: 10 }} width={36} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="e1rm"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          dot={false}
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
