import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateUserSettings, useUserSettings } from '@/hooks/useUserSettings'
import type { Database } from '@/lib/database.types'

type DisplayUnit = Database['public']['Enums']['display_unit']

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const { data: settings, isLoading, error } = useUserSettings(user?.id)
  const updateSettings = useUpdateUserSettings(user?.id)

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Display and analytics preferences." />
        <PageSkeleton rows={4} />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error instanceof Error ? error.message : 'Failed to load settings'}
      </p>
    )
  }

  const save = async (patch: Parameters<typeof updateSettings.mutateAsync>[0]) => {
    await updateSettings.mutateAsync(patch)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Display and analytics preferences."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training</CardTitle>
          <CardDescription>Used in logger and Phase 2 charts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="display-unit">Weight display unit</Label>
            <select
              id="display-unit"
              value={settings.display_unit}
              onChange={(e) =>
                void save({ display_unit: e.target.value as DisplayUnit })
              }
              className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="week-start">First day of week</Label>
            <select
              id="week-start"
              value={settings.week_start_day}
              onChange={(e) =>
                void save({ week_start_day: Number(e.target.value) })
              }
              className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              {WEEKDAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chart-weeks">Chart range (weeks)</Label>
            <select
              id="chart-weeks"
              value={settings.chart_weeks}
              onChange={(e) =>
                void save({ chart_weeks: Number(e.target.value) })
              }
              className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2 text-sm"
            >
              {[4, 6, 8, 12, 16].map((weeks) => (
                <option key={weeks} value={weeks}>
                  {weeks} weeks
                </option>
              ))}
            </select>
          </div>

          {updateSettings.isPending && (
            <p className="text-xs text-muted-foreground">Saving…</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
