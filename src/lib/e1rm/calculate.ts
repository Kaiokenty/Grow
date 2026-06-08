import { formulaForMovementType, type MovementType } from '@/lib/e1rm/formulas'
import { isValidE1RMReps } from '@/lib/e1rm/guards'

export function calculateE1RM(
  set: { reps: number; weight_kg: number },
  movementType: MovementType | null | undefined,
): number | null {
  if (!isValidE1RMReps(set.reps)) return null
  if (!Number.isFinite(set.weight_kg) || set.weight_kg <= 0) return null

  const formula = formulaForMovementType(movementType)
  const result = formula(set.weight_kg, set.reps)
  return Number.isFinite(result) ? result : null
}
