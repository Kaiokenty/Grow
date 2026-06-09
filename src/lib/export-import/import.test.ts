import { describe, expect, it } from 'vitest'
import { parseGrowExport, previewImport } from '@/lib/export-import/import'
import type { GrowExportV1 } from '@/lib/export-import/types'

const sample: GrowExportV1 = {
  grow_version: 1,
  exported_at: '2026-06-01T00:00:00.000Z',
  display_unit_hint: 'kg',
  exercises: [
    {
      name: 'Bench Press',
      movement_type: 'upper_push',
      category: 'chest',
      muscle_groups: ['chest', 'triceps'],
      primary_muscle: 'chest',
      secondary_muscles: ['triceps'],
      other_muscles: [],
      is_compound: true,
      is_tracked: true,
    },
  ],
  workouts: [
    {
      date: '2026-05-20',
      duration_minutes: 60,
      notes: null,
      sets: [
        {
          exercise_key: { name: 'Bench Press', movement_type: 'upper_push' },
          set_number: 1,
          set_type: 'working',
          reps: 5,
          weight_kg: 100,
          rpe: 8,
          notes: null,
        },
      ],
    },
    {
      date: '2026-05-27',
      duration_minutes: 55,
      notes: null,
      sets: [
        {
          exercise_key: { name: 'Bench Press', movement_type: 'upper_push' },
          set_number: 1,
          set_type: 'working',
          reps: 5,
          weight_kg: 100,
          rpe: 8.5,
          notes: null,
        },
      ],
    },
  ],
}

describe('parseGrowExport', () => {
  it('accepts valid v1 export', () => {
    expect(parseGrowExport(sample).grow_version).toBe(1)
  })

  it('rejects unsupported version', () => {
    expect(() =>
      parseGrowExport({ ...sample, grow_version: 2 }),
    ).toThrow(/Unsupported export version/)
  })
})

describe('previewImport', () => {
  it('summarizes workout count and date range', () => {
    const preview = previewImport(sample)
    expect(preview.workoutCount).toBe(2)
    expect(preview.exerciseCount).toBe(1)
    expect(preview.dateRange).toEqual({
      start: '2026-05-20',
      end: '2026-05-27',
    })
  })
})
