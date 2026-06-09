import type { GrowMuscleGroup } from '@/lib/body-map/muscle-slugs'

export const MUSCLE_WEIGHT_PRIMARY = 1.0
export const MUSCLE_WEIGHT_SECONDARY = 0.5
export const MUSCLE_WEIGHT_OTHER = 0.3

export type MuscleAttribution = {
  primary_muscle: GrowMuscleGroup
  secondary_muscles: GrowMuscleGroup[]
  other_muscles: GrowMuscleGroup[]
}

export type MuscleRole = 'primary' | 'secondary' | 'other'

const ROLE_WEIGHT: Record<MuscleRole, number> = {
  primary: MUSCLE_WEIGHT_PRIMARY,
  secondary: MUSCLE_WEIGHT_SECONDARY,
  other: MUSCLE_WEIGHT_OTHER,
}

export function muscleRoleWeight(role: MuscleRole): number {
  return ROLE_WEIGHT[role]
}

/** Backfill rule: 1st → primary, 2nd–3rd → secondary, rest → other */
export function backfillMuscleAttribution(
  muscleGroups: readonly string[],
): MuscleAttribution {
  const tags = muscleGroups.filter(Boolean) as GrowMuscleGroup[]
  if (tags.length === 0) {
    throw new Error('At least one muscle group is required')
  }

  return {
    primary_muscle: tags[0],
    secondary_muscles: tags.slice(1, 3) as GrowMuscleGroup[],
    other_muscles: tags.slice(3) as GrowMuscleGroup[],
  }
}

export function buildMuscleGroups(attribution: MuscleAttribution): GrowMuscleGroup[] {
  return [
    attribution.primary_muscle,
    ...attribution.secondary_muscles,
    ...attribution.other_muscles,
  ]
}

export type WeightedMuscleContribution = {
  muscle: GrowMuscleGroup
  role: MuscleRole
  weight: number
}

export function expandMuscleContributions(
  attribution: MuscleAttribution,
): WeightedMuscleContribution[] {
  const rows: WeightedMuscleContribution[] = [
    {
      muscle: attribution.primary_muscle,
      role: 'primary',
      weight: MUSCLE_WEIGHT_PRIMARY,
    },
  ]

  for (const muscle of attribution.secondary_muscles) {
    rows.push({
      muscle,
      role: 'secondary',
      weight: MUSCLE_WEIGHT_SECONDARY,
    })
  }

  for (const muscle of attribution.other_muscles) {
    rows.push({
      muscle,
      role: 'other',
      weight: MUSCLE_WEIGHT_OTHER,
    })
  }

  return rows
}

export function weightedSetTonnage(
  reps: number,
  weightKg: number,
  role: MuscleRole,
): number {
  return reps * weightKg * ROLE_WEIGHT[role]
}

export function formatMuscleAttributionLabel(
  attribution: MuscleAttribution,
): string {
  const parts = [`${formatMuscleLabel(attribution.primary_muscle)} (primary)`]
  for (const m of attribution.secondary_muscles) {
    parts.push(`${formatMuscleLabel(m)} (0.5×)`)
  }
  for (const m of attribution.other_muscles) {
    parts.push(`${formatMuscleLabel(m)} (0.3×)`)
  }
  return parts.join(' · ')
}

export function formatMuscleLabel(muscle: GrowMuscleGroup): string {
  return muscle.replace(/_/g, ' ')
}

export function validateMuscleAttribution(attribution: MuscleAttribution): string | null {
  const all = buildMuscleGroups(attribution)
  const unique = new Set(all)
  if (unique.size !== all.length) {
    return 'Each muscle can only appear in one tier'
  }
  if (attribution.secondary_muscles.length > 2) {
    return 'At most 2 secondary muscles'
  }
  if (attribution.other_muscles.length > 3) {
    return 'At most 3 other muscles'
  }
  return null
}
