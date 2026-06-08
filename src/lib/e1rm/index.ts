import { calculateE1RM } from '@/lib/e1rm/calculate'
import { bestSetE1RM, type SetType, type WorkingSet } from '@/lib/e1rm/best-set'

export { calculateE1RM }
export { bestSetE1RM }
export type { MovementType } from '@/lib/e1rm/formulas'
export type { SetType, WorkingSet }
export {
  brzycki,
  epley,
  formulaForMovementType,
  lombardi,
  mayhew,
  wathen,
} from '@/lib/e1rm/formulas'
export { isValidE1RMReps, MAX_E1RM_REPS } from '@/lib/e1rm/guards'
