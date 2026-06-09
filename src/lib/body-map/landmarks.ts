import type { GrowMuscleGroup } from '@/lib/body-map/muscle-slugs'

/** Default weekly working sets per muscle (MEV/MRV). Phase 3: AI quiz + user overrides. */
export const DEFAULT_MUSCLE_LANDMARKS: Record<
  GrowMuscleGroup,
  { mev_sets: number; mrv_sets: number }
> = {
  chest: { mev_sets: 8, mrv_sets: 20 },
  triceps: { mev_sets: 6, mrv_sets: 14 },
  biceps: { mev_sets: 6, mrv_sets: 14 },
  shoulders: { mev_sets: 8, mrv_sets: 18 },
  rear_delts: { mev_sets: 6, mrv_sets: 12 },
  upper_back: { mev_sets: 8, mrv_sets: 18 },
  back: { mev_sets: 8, mrv_sets: 18 },
  quads: { mev_sets: 8, mrv_sets: 20 },
  hamstrings: { mev_sets: 6, mrv_sets: 16 },
  glutes: { mev_sets: 6, mrv_sets: 16 },
  calves: { mev_sets: 6, mrv_sets: 14 },
  forearms: { mev_sets: 4, mrv_sets: 10 },
  core: { mev_sets: 4, mrv_sets: 12 },
}

export type LandmarkBand = 'untrained' | 'under' | 'approaching' | 'productive' | 'over'

export function landmarkBand(
  avgWeeklySets: number,
  muscle: GrowMuscleGroup,
): LandmarkBand {
  if (avgWeeklySets <= 0) return 'untrained'

  const { mev_sets, mrv_sets } = DEFAULT_MUSCLE_LANDMARKS[muscle]

  if (avgWeeklySets < mev_sets * 0.75) return 'under'
  if (avgWeeklySets < mev_sets) return 'approaching'
  if (avgWeeklySets <= mrv_sets) return 'productive'
  return 'over'
}

/** Maps band → body-highlighter intensity 1–4 (0 = untrained). */
export function landmarkBandToIntensity(band: LandmarkBand): number {
  switch (band) {
    case 'under':
      return 1
    case 'approaching':
      return 2
    case 'productive':
      return 3
    case 'over':
      return 4
    default:
      return 0
  }
}

export function landmarkBandLabel(band: LandmarkBand): string {
  switch (band) {
    case 'under':
      return 'Below MEV'
    case 'approaching':
      return 'Approaching MEV'
    case 'productive':
      return 'In range'
    case 'over':
      return 'Above MRV'
    default:
      return 'Untrained'
  }
}
