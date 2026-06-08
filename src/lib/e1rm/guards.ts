export const MAX_E1RM_REPS = 10

export function isValidE1RMReps(reps: number): boolean {
  return Number.isFinite(reps) && reps > 0 && reps <= MAX_E1RM_REPS
}
