import type { Slug } from '@mjcdev/react-body-highlighter'

/** Muscle group tags stored in exercises.muscle_groups[] */
export type GrowMuscleGroup =
  | 'chest'
  | 'triceps'
  | 'biceps'
  | 'shoulders'
  | 'rear_delts'
  | 'upper_back'
  | 'back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'forearms'
  | 'core'

export const GROW_MUSCLE_GROUPS: readonly GrowMuscleGroup[] = [
  'chest',
  'triceps',
  'biceps',
  'shoulders',
  'rear_delts',
  'upper_back',
  'back',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'forearms',
  'core',
] as const

/** Grow DB tag → @mjcdev/react-body-highlighter slug(s) */
export const MUSCLE_TO_SLUGS: Record<GrowMuscleGroup, readonly Slug[]> = {
  chest: ['chest'],
  triceps: ['triceps'],
  biceps: ['biceps'],
  shoulders: ['deltoids'],
  rear_delts: ['trapezius'],
  upper_back: ['upper-back'],
  back: ['upper-back', 'lower-back'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  calves: ['calves'],
  forearms: ['forearm'],
  core: ['abs', 'obliques'],
}

export function muscleToSlugs(muscle: GrowMuscleGroup): readonly Slug[] {
  return MUSCLE_TO_SLUGS[muscle]
}
