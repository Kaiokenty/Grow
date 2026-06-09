import type { GrowMuscleGroup } from '@/lib/body-map/muscle-slugs'

export type BalanceView = 'push_pull_legs' | 'upper_lower' | 'push_pull_legs_core'

export const BALANCE_VIEW_LABELS: Record<BalanceView, string> = {
  push_pull_legs: 'Push / Pull / Legs',
  upper_lower: 'Upper / Lower',
  push_pull_legs_core: 'P / P / L / Core',
}

const PUSH: GrowMuscleGroup[] = ['chest', 'shoulders', 'triceps']
const PULL: GrowMuscleGroup[] = [
  'back',
  'upper_back',
  'rear_delts',
  'biceps',
  'forearms',
]
const LEGS: GrowMuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves']
const CORE: GrowMuscleGroup[] = ['core']

export const BALANCE_BUCKETS: Record<
  BalanceView,
  { key: string; label: string; muscles: GrowMuscleGroup[] }[]
> = {
  push_pull_legs: [
    { key: 'push', label: 'Push', muscles: PUSH },
    { key: 'pull', label: 'Pull', muscles: PULL },
    { key: 'legs', label: 'Legs', muscles: LEGS },
  ],
  upper_lower: [
    { key: 'upper', label: 'Upper', muscles: [...PUSH, ...PULL] },
    { key: 'lower', label: 'Lower', muscles: [...LEGS, ...CORE] },
  ],
  push_pull_legs_core: [
    { key: 'push', label: 'Push', muscles: PUSH },
    { key: 'pull', label: 'Pull', muscles: PULL },
    { key: 'legs', label: 'Legs', muscles: LEGS },
    { key: 'core', label: 'Core', muscles: CORE },
  ],
}

export function sumBucketVolume(
  volumeByMuscle: Partial<Record<GrowMuscleGroup, number>>,
  muscles: GrowMuscleGroup[],
): number {
  return muscles.reduce((sum, muscle) => sum + (volumeByMuscle[muscle] ?? 0), 0)
}

export function computeBalanceSummary(
  volumeByMuscle: Partial<Record<GrowMuscleGroup, number>>,
  view: BalanceView,
): { key: string; label: string; volume: number }[] {
  return BALANCE_BUCKETS[view].map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    volume: sumBucketVolume(volumeByMuscle, bucket.muscles),
  }))
}
