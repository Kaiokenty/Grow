import { startOfCalendarWeek, toIsoDate } from '@/lib/dates'

export type WeekPoint<T extends Record<string, unknown>> = {
  week_start: string
} & T

/** Fill missing calendar weeks with zero values between rangeStart and rangeEnd. */
export function zeroFillWeekSeries<T extends Record<string, number | null | undefined>>(
  rows: WeekPoint<T>[],
  rangeStart: string,
  rangeEnd: string,
  weekStartDay: number,
  zeroRow: T,
): WeekPoint<T>[] {
  const byWeek = new Map(rows.map((row) => [row.week_start, row]))
  const result: WeekPoint<T>[] = []

  const [startY, startM, startD] = rangeStart.split('-').map(Number)
  const [endY, endM, endD] = rangeEnd.split('-').map(Number)
  if (!startY || !startM || !startD || !endY || !endM || !endD) return rows

  let cursor = startOfCalendarWeek(
    new Date(startY, startM - 1, startD),
    weekStartDay,
  )
  const end = startOfCalendarWeek(
    new Date(endY, endM - 1, endD),
    weekStartDay,
  )

  while (cursor <= end) {
    const weekStart = toIsoDate(cursor)
    const existing = byWeek.get(weekStart)
    result.push(existing ?? { week_start: weekStart, ...zeroRow })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
  }

  return result
}

export function weekRangeForPreset(
  presetWeeks: number,
  weekStartDay: number,
  today = new Date(),
): { start: string; end: string } {
  const end = startOfCalendarWeek(today, weekStartDay)
  const start = new Date(end)
  start.setDate(start.getDate() - (presetWeeks - 1) * 7)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

export function weekRangeAllTime(
  earliestWeekStart: string | undefined,
  weekStartDay: number,
  today = new Date(),
): { start: string; end: string } {
  const end = toIsoDate(startOfCalendarWeek(today, weekStartDay))
  if (!earliestWeekStart) return { start: end, end }
  return { start: earliestWeekStart, end }
}
