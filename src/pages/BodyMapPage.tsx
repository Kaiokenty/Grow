import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MuscleMapExplorer } from '@/components/body-map/MuscleMapExplorer'
import { useAnalyticsRange } from '@/hooks/useAnalyticsRange'
import { useAuth } from '@/hooks/useAuth'
import { useUserSettings } from '@/hooks/useUserSettings'
import { GROW_MUSCLE_GROUPS, type GrowMuscleGroup } from '@/lib/body-map'

export function BodyMapPage() {
  const { user } = useAuth()
  const { data: settings } = useUserSettings(user?.id)
  const [searchParams] = useSearchParams()

  const weekStartDay = settings?.week_start_day ?? 1
  const displayUnit = settings?.display_unit ?? 'kg'
  const chartWeeks = settings?.chart_weeks ?? 6
  const { preset, setPreset, weeks: rangeWeeks } = useAnalyticsRange(chartWeeks)

  const initialMuscle = useMemo(() => {
    const param = searchParams.get('muscle')
    if (param && GROW_MUSCLE_GROUPS.includes(param as GrowMuscleGroup)) {
      return param as GrowMuscleGroup
    }
    return null
  }, [searchParams])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-balance">
          Body map
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore muscle volume over time. Calendar week for tonnage; rolling 7
          days for RPE.
        </p>
      </div>

      {user?.id && (
        <MuscleMapExplorer
          key={initialMuscle ?? 'overview'}
          userId={user.id}
          weekStartDay={weekStartDay}
          displayUnit={displayUnit}
          rangeWeeks={rangeWeeks}
          analyticsPreset={preset}
          onAnalyticsPresetChange={setPreset}
          variant="explore"
          initialMuscle={initialMuscle}
        />
      )}
    </div>
  )
}
