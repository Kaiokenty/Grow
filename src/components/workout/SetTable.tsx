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
}

export function SetTable({
  exerciseClientId,
  sets,
  displayUnit,
  validationErrors,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
}: SetTableProps) {
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[2.5rem_5.5rem_1fr_1fr_7.5rem_2rem] gap-2 px-1 text-xs text-muted-foreground sm:grid">
        <span>Set</span>
        <span>Type</span>
        <span>Weight ({displayUnit})</span>
        <span>Reps</span>
        <span>RPE</span>
        <span />
      </div>
      {sets.map((set) => {
        const errors = validationErrors[setErrorKey(exerciseClientId, set.clientId)]

        return (
          <div
            key={set.clientId}
            className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 p-2 sm:grid-cols-[2.5rem_5.5rem_1fr_1fr_7.5rem_2rem] sm:items-start sm:border-0 sm:p-0"
          >
            <span className="text-sm font-medium tabular-nums text-muted-foreground sm:pt-2 sm:text-center">
              {set.setNumber}
            </span>
            <select
              value={set.setType}
              onChange={(e) =>
                onUpdateSet(set.clientId, {
                  setType: e.target.value as SetRow['setType'],
                })
              }
              className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring sm:mt-0"
            >
              <option value="working">Working</option>
              <option value="warmup">Warmup</option>
            </select>
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
