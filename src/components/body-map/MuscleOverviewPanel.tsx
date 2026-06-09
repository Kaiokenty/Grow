import type { WeeklySummary } from '@/hooks/useWeeklySummary'
import type { WeeklySummaryNlg } from '@/lib/api/analytics'
import type { DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

type MuscleOverviewPanelProps = {
  summary: WeeklySummary | undefined
  nlg: WeeklySummaryNlg | undefined
  displayUnit: DisplayUnit
  isLoading?: boolean
  className?: string
}

function volumeDelta(current: number, prior: number): string | null {
  if (prior <= 0) return null
  const pct = Math.round(((current - prior) / prior) * 100)
  if (pct === 0) return 'flat'
  return pct > 0 ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`
}

export function MuscleOverviewPanel({
  summary,
  nlg,
  displayUnit,
  isLoading,
  className,
}: MuscleOverviewPanelProps) {
  const tonnage =
    displayUnit === 'lbs' && summary
      ? Math.round(summary.weeklyTonnageKg * 2.2046226218)
      : summary?.weeklyTonnageKg

  const priorTonnage =
    displayUnit === 'lbs' && summary
      ? Math.round(summary.priorWeekTonnageKg * 2.2046226218)
      : summary?.priorWeekTonnageKg

  const delta =
    summary && priorTonnage != null && priorTonnage > 0
      ? volumeDelta(tonnage ?? 0, priorTonnage)
      : null

  return (
    <div className={cn('space-y-5', className)}>
      <div>
        <h2 className="text-base font-medium">This week</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Calendar week totals from working sets. Tap a muscle for breakdown.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <dl className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 p-3 text-center">
            <dt className="text-xs text-muted-foreground">Sessions</dt>
            <dd className="stat-value mt-1 tabular-nums">
              {summary?.workoutsThisWeek ?? 0}
            </dd>
          </div>
          <div className="rounded-xl border border-border/60 p-3 text-center">
            <dt className="text-xs text-muted-foreground">Volume ({displayUnit})</dt>
            <dd className="stat-value mt-1 tabular-nums">
              {tonnage?.toLocaleString() ?? 0}
            </dd>
            {delta && (
              <p className="mt-0.5 text-xs text-accent-foreground tabular-nums">
                {delta} vs last week
              </p>
            )}
          </div>
          <div className="rounded-xl border border-border/60 p-3 text-center">
            <dt className="text-xs text-muted-foreground">Avg RPE</dt>
            <dd className="stat-value mt-1 tabular-nums">
              {summary?.rolling7dAvgRpe ?? '—'}
            </dd>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Last 7 days</p>
          </div>
        </dl>
      )}

      {nlg && nlg.lines.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">Summary</p>
          <ul className="mt-2 space-y-1 text-sm">
            {nlg.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
