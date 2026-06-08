import type { GrowMuscleGroup } from '@/lib/body-map/muscle-slugs'

export type MuscleVolumeStats = {
  tonnage_kg: number
  sets: number
}

/** Sample weekly stats — replaced by Phase 2 aggregation. */
export const MOCK_WEEKLY_VOLUME: Record<GrowMuscleGroup, MuscleVolumeStats> = {
  chest: { tonnage_kg: 8400, sets: 12 },
  quads: { tonnage_kg: 12000, sets: 16 },
  back: { tonnage_kg: 6200, sets: 14 },
  shoulders: { tonnage_kg: 2100, sets: 8 },
  biceps: { tonnage_kg: 1800, sets: 9 },
  triceps: { tonnage_kg: 2400, sets: 10 },
  glutes: { tonnage_kg: 9000, sets: 12 },
  hamstrings: { tonnage_kg: 4500, sets: 10 },
  calves: { tonnage_kg: 1200, sets: 6 },
  forearms: { tonnage_kg: 800, sets: 4 },
  rear_delts: { tonnage_kg: 900, sets: 6 },
  upper_back: { tonnage_kg: 0, sets: 0 },
  core: { tonnage_kg: 0, sets: 0 },
}

export function mockTonnageByMuscle(): Record<GrowMuscleGroup, number> {
  return Object.fromEntries(
    Object.entries(MOCK_WEEKLY_VOLUME).map(([muscle, stats]) => [
      muscle,
      stats.tonnage_kg,
    ]),
  ) as Record<GrowMuscleGroup, number>
}
