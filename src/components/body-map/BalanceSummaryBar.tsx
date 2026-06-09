import { Button } from '@/components/ui/button'
import {
  BALANCE_VIEW_LABELS,
  computeBalanceSummary,
  type BalanceView,
} from '@/lib/body-map/balance'
import type { GrowMuscleGroup } from '@/lib/body-map'
import { formatTonnage, type DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

const VIEWS: BalanceView[] = [
  'push_pull_legs',
  'upper_lower',
  'push_pull_legs_core',
]

type BalanceSummaryBarProps = {
  volumeByMuscle: Partial<Record<GrowMuscleGroup, number>>
  displayUnit: DisplayUnit
  view: BalanceView
  onViewChange: (view: BalanceView) => void
  className?: string
}

export function BalanceSummaryBar({
  volumeByMuscle,
  displayUnit,
  view,
  onViewChange,
  className,
}: BalanceSummaryBarProps) {
  const buckets = computeBalanceSummary(volumeByMuscle, view)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-1">
        {VIEWS.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={view === option ? 'primary' : 'tertiary'}
            onClick={() => onViewChange(option)}
          >
            {BALANCE_VIEW_LABELS[option]}
          </Button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {buckets.map((bucket) => (
          <div
            key={bucket.key}
            className="rounded-lg border border-border/60 px-3 py-2 text-sm"
          >
            <p className="text-xs text-muted-foreground">{bucket.label}</p>
            <p className="mt-0.5 font-medium tabular-nums">
              {bucket.volume > 0
                ? formatTonnage(bucket.volume, displayUnit)
                : '—'}
              <span className="text-xs font-normal text-muted-foreground">
                {' '}
                /wk
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
