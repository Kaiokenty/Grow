const DEFAULT_STEPS = 4

/** Bucket volume (kg) into intensity 1..steps, or 0 when untrained. */
export function volumeToIntensity(
  kg: number,
  maxKg: number,
  steps = DEFAULT_STEPS,
): number {
  if (kg <= 0 || maxKg <= 0) return 0

  const ratio = kg / maxKg
  if (ratio < 0.25) return 1
  if (ratio < 0.5) return Math.min(2, steps)
  if (ratio < 0.75) return Math.min(3, steps)
  return steps
}

export function maxVolume(volumeByMuscle: Record<string, number>): number {
  const values = Object.values(volumeByMuscle)
  return values.length > 0 ? Math.max(...values) : 0
}
