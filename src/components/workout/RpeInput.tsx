import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RpeInputProps = {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  error?: string
  className?: string
}

const MIN = 6
const MAX = 10
const STEP = 0.5

function parseValue(value: string) {
  const n = Number(value)
  return Number.isFinite(n) ? n : MIN
}

function clampRpe(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return ''
  const clamped = Math.min(MAX, Math.max(MIN, Math.round(n * 2) / 2))
  return String(clamped)
}

export function RpeInput({
  value,
  onChange,
  invalid,
  error,
  className,
}: RpeInputProps) {
  const current = value.trim() ? parseValue(value) : null

  const bump = (delta: number) => {
    const base = current ?? MIN
    const next = Math.min(MAX, Math.max(MIN, Math.round((base + delta) * 2) / 2))
    onChange(String(next))
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Decrease RPE"
          onClick={() => bump(-STEP)}
        >
          −
        </Button>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const clamped = clampRpe(value)
            if (clamped !== value) onChange(clamped)
          }}
          placeholder="RPE"
          aria-invalid={invalid}
          className={cn(
            'h-8 w-14 rounded-lg border border-input bg-transparent px-2 text-center text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            invalid && 'border-destructive ring-3 ring-destructive/20',
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Increase RPE"
          onClick={() => bump(STEP)}
        >
          +
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
