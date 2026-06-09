import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RpeInput } from '@/components/workout/RpeInput'
import { setErrorKey, type SetRow } from '@/lib/workout/types'
import type { ValidationErrors } from '@/lib/workout/types'
import type { DisplayUnit } from '@/lib/units'
import { cn } from '@/lib/utils'

type SetTableProps = {
  exerciseClientId: string
  sets: SetRow[]
  displayUnit: DisplayUnit
  validationErrors: ValidationErrors
  onUpdateSet: (setClientId: string, patch: Partial<SetRow>) => void
  onRemoveSet: (setClientId: string) => void
  onAddSet: () => void
  onCompleteSet?: (setClientId: string) => void
}

export function SetTable({
  exerciseClientId,
  sets,
  displayUnit,
  validationErrors,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onCompleteSet,
}: SetTableProps) {
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[2.5rem_4.5rem_1fr_1fr_7.5rem_2.5rem_2rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
        <span>Set</span>
        <span>Type</span>
        <span>Weight ({displayUnit})</span>
        <span>Reps</span>
        <span>RPE</span>
        <span />
        <span />
      </div>
      {sets.map((set) => {
        const errors = validationErrors[setErrorKey(exerciseClientId, set.clientId)]
        const isWarmup = set.setType === 'warmup'

        return (
          <div
            key={set.clientId}
            className={cn(
              'grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-[2.5rem_4.5rem_1fr_1fr_7.5rem_2.5rem_2rem] sm:items-start sm:border-0 sm:p-0',
              set.completed && 'border-accent/40 bg-accent/5 sm:border-0 sm:bg-transparent',
              isWarmup && !set.completed && 'border-dashed border-border/60',
            )}
          >
            <span className="text-sm font-medium tabular-nums text-muted-foreground sm:pt-2 sm:text-center">
              {set.setNumber}
            </span>
            <div className="flex gap-1 sm:pt-1">
              <button
                type="button"
                onClick={() => onUpdateSet(set.clientId, { setType: 'warmup' })}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                  isWarmup
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                W
              </button>
              <button
                type="button"
                onClick={() => onUpdateSet(set.clientId, { setType: 'working' })}
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                  !isWarmup
                    ? 'bg-accent/15 text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                Work
              </button>
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step={displayUnit === 'kg' ? 0.5 : 1}
                value={set.weightDisplay}
                onChange={(e) =>
                  onUpdateSet(set.clientId, { weightDisplay: e.target.value })
                }
                aria-invalid={Boolean(errors?.weightDisplay)}
                placeholder={`Weight (${displayUnit})`}
                className={cn(errors?.weightDisplay && 'border-destructive')}
              />
              {errors?.weightDisplay && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.weightDisplay}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={set.reps}
                onChange={(e) => onUpdateSet(set.clientId, { reps: e.target.value })}
                aria-invalid={Boolean(errors?.reps)}
                placeholder="Reps"
                className={cn(errors?.reps && 'border-destructive')}
              />
              {errors?.reps && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.reps}
                </p>
              )}
            </div>
            <RpeInput
              value={set.rpe}
              onChange={(rpe) => onUpdateSet(set.clientId, { rpe })}
              invalid={Boolean(errors?.rpe)}
              error={errors?.rpe}
            />
            <Button
              type="button"
              variant={set.completed ? 'primary' : 'tertiary'}
              size="icon-sm"
              aria-label={set.completed ? 'Set completed' : 'Complete set'}
              className={cn(
                'sm:mt-0.5 transition-transform',
                set.completed && 'scale-100',
              )}
              onClick={() => onCompleteSet?.(set.clientId)}
            >
              <Check className={cn('h-3.5 w-3.5', set.completed && 'text-background')} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove set"
              className="sm:mt-1"
              onClick={() => onRemoveSet(set.clientId)}
            >
              ×
            </Button>
          </div>
        )
      })}
      <Button type="button" variant="secondary" size="sm" onClick={onAddSet}>
        Add set
      </Button>
    </div>
  )
}
