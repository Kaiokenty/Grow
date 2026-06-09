import { useCallback, useMemo, useState } from 'react'

export const ANALYTICS_RANGE_PRESETS = [1, 4, 8, 12, 'all'] as const
export type AnalyticsRangePreset = (typeof ANALYTICS_RANGE_PRESETS)[number]

const STORAGE_KEY = 'grow_analytics_range'

function parseStoredPreset(value: string): AnalyticsRangePreset | null {
  if (value === 'all') return 'all'
  if (value === '1') return 1
  if (value === '4') return 4
  if (value === '8') return 8
  if (value === '12') return 12
  return null
}

export function defaultAnalyticsPreset(chartWeeks: number): AnalyticsRangePreset {
  if (chartWeeks <= 1) return 1
  if (chartWeeks <= 4) return 4
  if (chartWeeks <= 8) return 8
  if (chartWeeks <= 12) return 12
  return 'all'
}

function readStoredPreset(fallback: AnalyticsRangePreset): AnalyticsRangePreset {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? parseStoredPreset(stored) : null
    if (parsed) return parsed
  } catch {
    // ignore
  }
  return fallback
}

export function analyticsPresetToWeeks(preset: AnalyticsRangePreset): number {
  return preset === 'all' ? 0 : preset
}

export function analyticsPresetLabel(preset: AnalyticsRangePreset): string {
  return preset === 'all' ? 'All' : `${preset}w`
}

export function useAnalyticsRange(chartWeeks: number) {
  const fallback = useMemo(() => defaultAnalyticsPreset(chartWeeks), [chartWeeks])
  const [preset, setPresetState] = useState<AnalyticsRangePreset>(() =>
    readStoredPreset(fallback),
  )

  const setPreset = useCallback((next: AnalyticsRangePreset) => {
    setPresetState(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // ignore
    }
  }, [])

  const weeks = analyticsPresetToWeeks(preset)

  return {
    preset,
    setPreset,
    weeks,
    isAllTime: preset === 'all',
  }
}
