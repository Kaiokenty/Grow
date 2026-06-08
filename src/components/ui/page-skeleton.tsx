import { cn } from '@/lib/utils'

type PageSkeletonProps = {
  rows?: number
  className?: string
}

export function PageSkeleton({ rows = 3, className }: PageSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-muted"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}
