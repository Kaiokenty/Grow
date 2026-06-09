import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useFatigueSummary } from '@/hooks/useMuscleAnalytics'
import { cn } from '@/lib/utils'

type DeloadCardProps = {
  userId: string
  className?: string
}

const TIER_LABEL = {
  lean: 'Lean deload',
  moderate: 'Moderate deload',
  strong: 'Strong deload',
} as const

export function DeloadCard({ userId, className }: DeloadCardProps) {
  const { data, isLoading } = useFatigueSummary(userId)

  return (
    <Card className={cn('rounded-xl', className)}>
      <CardHeader>
        <CardTitle className="text-base">Fatigue signal</CardTitle>
        <CardDescription>
          Rolling 7-day RPE and performance trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {data?.deload_tier
                  ? TIER_LABEL[data.deload_tier]
                  : 'No signal yet'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data?.deload_reason ?? 'Log workouts to see fatigue signals.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10"
                aria-label={`Deload score ${data?.deload_score ?? 0} out of 100`}
              >
                <span className="text-lg font-medium tabular-nums text-accent-foreground">
                  {data?.deload_score ?? 0}
                </span>
              </div>
              {data?.rolling_7d_avg_rpe != null && (
                <div className="text-xs text-muted-foreground">
                  <p>Rolling 7d RPE</p>
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {data.rolling_7d_avg_rpe}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
