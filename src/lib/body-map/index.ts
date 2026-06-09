export {
  GROW_MUSCLE_GROUPS,
  MUSCLE_TO_SLUGS,
  muscleToSlugs,
  type GrowMuscleGroup,
} from '@/lib/body-map/muscle-slugs'
export {
  MUSCLE_WEIGHT_PRIMARY,
  MUSCLE_WEIGHT_SECONDARY,
  MUSCLE_WEIGHT_OTHER,
  backfillMuscleAttribution,
  buildMuscleGroups,
  expandMuscleContributions,
  formatMuscleAttributionLabel,
  formatMuscleLabel,
  validateMuscleAttribution,
  weightedSetTonnage,
  type MuscleAttribution,
  type MuscleRole,
} from '@/lib/body-map/attribution'
export { volumeToIntensity, maxVolume } from '@/lib/body-map/intensity'
export {
  MOCK_WEEKLY_VOLUME,
  mockTonnageByMuscle,
  type MuscleVolumeStats,
} from '@/lib/body-map/mock-volume'
export { isBackOnlySlug, slugToMuscles } from '@/lib/body-map/slug-to-muscles'
export { muscleVolumeToBodyParts } from '@/lib/body-map/to-body-parts'
