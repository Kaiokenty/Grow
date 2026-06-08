import type { ExtendedBodyPart, Slug } from '@mjcdev/react-body-highlighter'
import { volumeToIntensity, maxVolume } from '@/lib/body-map/intensity'
import { muscleToSlugs, type GrowMuscleGroup } from '@/lib/body-map/muscle-slugs'

export function muscleVolumeToBodyParts(
  volumeByMuscle: Partial<Record<GrowMuscleGroup, number>>,
  steps = 4,
): ExtendedBodyPart[] {
  const maxKg = maxVolume(volumeByMuscle as Record<string, number>)
  const intensityBySlug = new Map<Slug, number>()

  for (const [muscle, kg] of Object.entries(volumeByMuscle) as [
    GrowMuscleGroup,
    number,
  ][]) {
    const intensity = volumeToIntensity(kg, maxKg, steps)
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
