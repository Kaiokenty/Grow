import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  formatMuscleLabel,
  volumeToIntensity,
  maxVolume,
  type GrowMuscleGroup,
} from '@/lib/body-map'
import type { MuscleWeekStats } from '@/lib/api/analytics'
import type { DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

type MuscleDetailPanelProps = {
  muscle: GrowMuscleGroup
  stats: MuscleWeekStats | undefined
  volumeByMuscle: Partial<Record<GrowMuscleGroup, number>>
  displayUnit: DisplayUnit
  isLoading?: boolean
  showDeepDiveLink?: boolean
  className?: string
}

function formatTonnage(kg: number, unit: DisplayUnit) {
  const value = unit === 'lbs' ? Math.round(kg * 2.2046226218) : Math.round(kg)
  return `${value.toLocaleString()} ${unit}`
}

export function MuscleDetailPanel({
  muscle,
  stats,
  volumeByMuscle,
  displayUnit,
  isLoading,
  showDeepDiveLink = true,
  className,
}: MuscleDetailPanelProps) {
  const maxKg = maxVolume(volumeByMuscle as Record<string, number>)
  const intensity = volumeToIntensity(
    volumeByMuscle[muscle] ?? stats?.weighted_tonnage_kg ?? 0,
    maxKg,
  )

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-base font-medium capitalize">
          {formatMuscleLabel(muscle)}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Calendar week · weighted volume
        </p>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border/60 p-3">
              <dt className="text-xs text-muted-foreground">Weighted volume</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {formatTonnage(stats?.weighted_tonnage_kg ?? 0, displayUnit)}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <dt className="text-xs text-muted-foreground">Working sets</dt>
              <dd className="mt-1 font-medium tabular-nums">{stats?.sets ?? 0}</dd>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <dt className="text-xs text-muted-foreground">vs last week</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {stats?.prior_week_delta_pct != null
                  ? `${stats.prior_week_delta_pct > 0 ? '+' : ''}${stats.prior_week_delta_pct}%`
                  : '—'}
              </dd>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <dt className="text-xs text-muted-foreground">Intensity</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {intensity === 0 ? 'Untrained' : `${intensity}/4`}
              </dd>
            </div>
            <div className="col-span-2 rounded-lg border border-border/60 p-3">
              <dt className="text-xs text-muted-foreground">
                Avg RPE (last 7 days)
              </dt>
              <dd className="mt-1 font-medium tabular-nums">
                {stats?.rolling_7d_avg_rpe ?? '—'}
              </dd>
            </div>
          </dl>

          <p className="text-[10px] text-muted-foreground">
            Weighted by muscle role: primary 100%, secondary 50%, other 30%.
          </p>

          {(stats?.top_exercises?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Top exercises
              </p>
              <ul className="mt-2 divide-y divide-border/60 text-sm">
                {stats!.top_exercises.slice(0, 3).map((ex) => (
                  <li
                    key={ex.exercise_id}
                    className="flex items-center justify-between py-2"
                  >
                    <span>{ex.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {ex.sets} sets ·{' '}
                      {formatTonnage(ex.weighted_tonnage_kg, displayUnit)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showDeepDiveLink && (
            <Button variant="tertiary" size="sm" asChild>
              <Link to={`/body-map?muscle=${muscle}`}>View history →</Link>
            </Button>
          )}
        </>
      )}
    </div>
  )
}
