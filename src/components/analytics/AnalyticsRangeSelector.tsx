import { Button } from '@/components/ui/button'
import {
  ANALYTICS_RANGE_PRESETS,
  analyticsPresetLabel,
  type AnalyticsRangePreset,
} from '@/hooks/useAnalyticsRange'
import { cn } from '@/lib/utils'

type AnalyticsRangeSelectorProps = {
  preset: AnalyticsRangePreset
  onPresetChange: (preset: AnalyticsRangePreset) => void
  className?: string
}

export function AnalyticsRangeSelector({
  preset,
  onPresetChange,
  className,
}: AnalyticsRangeSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)} role="group" aria-label="Analytics time range">
      {ANALYTICS_RANGE_PRESETS.map((option) => (
        <Button
          key={String(option)}
          type="button"
          size="sm"
          variant={preset === option ? 'primary' : 'tertiary'}
          onClick={() => onPresetChange(option)}
        >
          {analyticsPresetLabel(option)}
        </Button>
      ))}
    </div>
  )
}
