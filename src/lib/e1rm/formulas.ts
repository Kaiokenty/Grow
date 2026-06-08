export type MovementType =
  | 'upper_push'
  | 'upper_pull'
  | 'lower_compound'
  | 'lower_hinge'
  | 'isolation'

export function epley(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30)
}

export function mayhew(weightKg: number, reps: number): number {
  return weightKg / (0.522 + 0.419 * Math.exp(-0.055 * reps))
}

export function lombardi(weightKg: number, reps: number): number {
  return weightKg * Math.pow(reps, 0.1)
}

export function brzycki(weightKg: number, reps: number): number {
  return weightKg / (1.0278 - 0.0278 * reps)
}

export function wathen(weightKg: number, reps: number): number {
  return weightKg / (0.488 + 0.538 * Math.exp(-0.075 * reps))
}

export function formulaForMovementType(
  movementType: MovementType | null | undefined,
): (weightKg: number, reps: number) => number {
  switch (movementType) {
    case 'upper_push':
      return mayhew
    case 'upper_pull':
      return epley
    case 'lower_compound':
      return lombardi
    case 'lower_hinge':
      return brzycki
    case 'isolation':
      return wathen
    default:
      return epley
  }
}
