import type { Slug } from '@mjcdev/react-body-highlighter'
import { GROW_MUSCLE_GROUPS, MUSCLE_TO_SLUGS, type GrowMuscleGroup } from '@/lib/body-map/muscle-slugs'

export function slugToMuscles(slug: Slug): GrowMuscleGroup[] {
  return GROW_MUSCLE_GROUPS.filter((muscle) =>
    MUSCLE_TO_SLUGS[muscle].includes(slug),
  )
}

/** Slugs that only appear on the back view */
const BACK_ONLY_SLUGS = new Set<Slug>([
  'upper-back',
  'trapezius',
  'hamstring',
  'gluteal',
  'calves',
])

export function isBackOnlySlug(slug: Slug): boolean {
  return BACK_ONLY_SLUGS.has(slug)
}
