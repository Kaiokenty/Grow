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
  landmarkBand,
  landmarkBandLabel,
  DEFAULT_MUSCLE_LANDMARKS,
} from '@/lib/body-map/landmarks'
export {
  computeBalanceSummary,
  BALANCE_VIEW_LABELS,
  type BalanceView,
} from '@/lib/body-map/balance'
export { muscleSetsToBodyParts } from '@/lib/body-map/landmark-body-parts'
export {
  MOCK_WEEKLY_VOLUME,
  mockTonnageByMuscle,
  type MuscleVolumeStats,
} from '@/lib/body-map/mock-volume'
export { isBackOnlySlug, slugToMuscles } from '@/lib/body-map/slug-to-muscles'
export { muscleVolumeToBodyParts } from '@/lib/body-map/to-body-parts'
