import { HEAT_COLORS } from '@/components/body-map/heat-colors'

const LABELS = ['Low', 'Moderate', 'High', 'Peak'] as const

export function BodyHeatmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Volume</span>
      {HEAT_COLORS.map((color, i) => (
        <div key={color} className="flex items-center gap-1.5">
          <span
            className="size-3 rounded-sm border border-border/60"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          <span>{LABELS[i]}</span>
        </div>
      ))}
    </div>
  )
}
