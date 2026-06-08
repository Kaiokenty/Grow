import { lazy, Suspense } from 'react'
import type { ExtendedBodyPart, Slug } from '@mjcdev/react-body-highlighter'
import { HEAT_COLORS } from '@/components/body-map/heat-colors'
import { cn } from '@/lib/utils'

type BodyHeatmapProps = {
  data: ReadonlyArray<ExtendedBodyPart>
  side?: 'front' | 'back'
  scale?: number
  className?: string
  onMuscleClick?: (slug: Slug) => void
}

const LazyBody = lazy(() => import('@mjcdev/react-body-highlighter'))

function BodyHeatmapFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto flex h-64 w-40 animate-pulse items-center justify-center rounded-xl bg-muted',
        className,
      )}
      aria-hidden
    />
  )
}

export function BodyHeatmap({
  data,
  side = 'front',
  scale = 1,
  className,
  onMuscleClick,
}: BodyHeatmapProps) {
  return (
    <div className={cn('flex justify-center', className)}>
      <Suspense fallback={<BodyHeatmapFallback />}>
        <LazyBody
          data={data}
          side={side}
          gender="male"
          scale={scale}
          colors={HEAT_COLORS}
          border="none"
          onBodyPartClick={(part) => {
            if (part.slug && onMuscleClick) onMuscleClick(part.slug)
          }}
        />
      </Suspense>
    </div>
  )
}
