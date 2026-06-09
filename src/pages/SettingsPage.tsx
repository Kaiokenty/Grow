import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateUserSettings, useUserSettings } from '@/hooks/useUserSettings'
import { downloadUserExport } from '@/lib/export-import/export'
import {
  importUserData,
  parseGrowExport,
  previewImport,
} from '@/lib/export-import/import'
import type { GrowExportV1, ImportMode } from '@/lib/export-import/types'
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

const REST_PRESETS = [60, 90, 120, 180]

export function SettingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: settings, isLoading, error } = useUserSettings(user?.id)
  const updateSettings = useUpdateUserSettings(user?.id)

  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<GrowExportV1 | null>(null)
  const [importPreview, setImportPreview] = useState<ReturnType<
    typeof previewImport
  > | null>(null)

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

  const handleExport = async () => {
    if (!user?.id) return
    setExporting(true)
    try {
      await downloadUserExport(user.id)
    } finally {
      setExporting(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImportError(null)
    try {
      const text = await file.text()
      const parsed = parseGrowExport(JSON.parse(text))
      setPendingImport(parsed)
      setImportPreview(previewImport(parsed))
    } catch (err) {
      setPendingImport(null)
      setImportPreview(null)
      setImportError(err instanceof Error ? err.message : 'Invalid import file')
    }
  }

  const runImport = async (mode: ImportMode) => {
    if (!user?.id || !pendingImport) return
    if (
      mode === 'replace' &&
      !window.confirm(
        'Replace deletes all existing workouts and sets. Continue?',
      )
    ) {
      return
    }

    setImporting(true)
    setImportError(null)
    try {
      await importUserData(user.id, pendingImport, mode)
      setPendingImport(null)
      setImportPreview(null)
      await queryClient.invalidateQueries()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
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
          <CardDescription>Used in logger and charts.</CardDescription>
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

          <Switch
            label="Rest timer after working sets"
            checked={settings.rest_timer_enabled}
            onToggle={() =>
              void save({ rest_timer_enabled: !settings.rest_timer_enabled })
            }
          />

          {settings.rest_timer_enabled && (
            <div className="space-y-2">
              <Label htmlFor="rest-seconds">Rest duration</Label>
              <select
                id="rest-seconds"
                value={settings.rest_timer_seconds}
                onChange={(e) =>
                  void save({ rest_timer_seconds: Number(e.target.value) })
                }
                className="h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                {REST_PRESETS.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds} seconds
                  </option>
                ))}
              </select>
            </div>
          )}

          {updateSettings.isPending && (
            <p className="text-xs text-muted-foreground">Saving…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data export / import</CardTitle>
          <CardDescription>
            grow-export v1 JSON backup or test history seed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => void handleExport()} loading={exporting}>
            Download export
          </Button>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void handleFileChange(e)}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Choose import file
            </Button>
          </div>

          {importPreview && (
            <div className="rounded-lg border border-border/60 p-3 text-sm">
              <p>{importPreview.workoutCount} workouts</p>
              <p>{importPreview.exerciseCount} exercises</p>
              {importPreview.dateRange && (
                <p>
                  {importPreview.dateRange.start} → {importPreview.dateRange.end}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void runImport('merge')}
                  loading={importing}
                >
                  Merge
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void runImport('replace')}
                  loading={importing}
                >
                  Replace
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPendingImport(null)
                    setImportPreview(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {importError && (
            <p className="text-sm text-destructive" role="alert">
              {importError}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
