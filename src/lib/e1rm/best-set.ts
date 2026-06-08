import { calculateE1RM } from '@/lib/e1rm/calculate'
import type { MovementType } from '@/lib/e1rm/formulas'

export type SetType = 'working' | 'warmup'

export interface WorkingSet {
  set_type: SetType
  reps: number
  weight_kg: number
}

export function bestSetE1RM(
  sets: WorkingSet[],
  movementType: MovementType | null | undefined,
): number | null {
  let best: number | null = null

  for (const set of sets) {
    if (set.set_type !== 'working') continue
    const e1rm = calculateE1RM(set, movementType)
    if (e1rm === null) continue
    if (best === null || e1rm > best) best = e1rm
  }

  return best
}
