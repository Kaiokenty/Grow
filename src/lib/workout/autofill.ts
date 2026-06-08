import type { LastSessionSet } from '@/hooks/useExercises'
import type { DisplayUnit } from '@/lib/units'
import { kgToDisplayWeight } from '@/lib/workout/validation'
import type { SetRow } from '@/lib/workout/types'

export function lastSessionToInitialSet(
  last: LastSessionSet,
  displayUnit: DisplayUnit,
): Partial<SetRow> {
  return {
    reps: String(last.reps),
    weightDisplay: kgToDisplayWeight(last.weight_kg, displayUnit),
    rpe: last.rpe != null ? String(last.rpe) : '',
    setType: last.set_type,
  }
}
