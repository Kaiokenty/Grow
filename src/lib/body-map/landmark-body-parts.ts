import type { ExtendedBodyPart, Slug } from '@mjcdev/react-body-highlighter'
import {
  landmarkBand,
  landmarkBandToIntensity,
} from '@/lib/body-map/landmarks'
import { muscleToSlugs, type GrowMuscleGroup } from '@/lib/body-map/muscle-slugs'

export function muscleSetsToBodyParts(
  setsPerWeekByMuscle: Partial<Record<GrowMuscleGroup, number>>,
): ExtendedBodyPart[] {
  const intensityBySlug = new Map<Slug, number>()

  for (const [muscle, sets] of Object.entries(setsPerWeekByMuscle) as [
    GrowMuscleGroup,
    number,
  ][]) {
    const band = landmarkBand(sets, muscle)
    const intensity = landmarkBandToIntensity(band)
    if (intensity === 0) continue

    for (const slug of muscleToSlugs(muscle)) {
      const existing = intensityBySlug.get(slug) ?? 0
      intensityBySlug.set(slug, Math.max(existing, intensity))
    }
  }

  return [...intensityBySlug.entries()].map(([slug, intensity]) => ({
    slug,
    intensity,
  }))
}
