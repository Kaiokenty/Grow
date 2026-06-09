import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  GROW_MUSCLE_GROUPS,
  formatMuscleLabel,
  type GrowMuscleGroup,
  type MuscleAttribution,
} from '@/lib/body-map'
import { cn } from '@/lib/utils'

type MuscleAttributionPickerProps = {
  value: MuscleAttribution
  onChange: (value: MuscleAttribution) => void
}

function MuscleSelect({
  id,
  label,
  badge,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  badge?: string
  value: string
  options: readonly GrowMuscleGroup[]
  onChange: (muscle: GrowMuscleGroup) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        {badge && (
          <Badge variant="dot" size="sm" className="text-[10px]">
            {badge}
          </Badge>
        )}
      </div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as GrowMuscleGroup)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
      >
        {options.map((muscle) => (
          <option key={muscle} value={muscle}>
            {formatMuscleLabel(muscle)}
          </option>
        ))}
      </select>
    </div>
  )
}

function MuscleMultiToggle({
  label,
  badge,
  selected,
  max,
  excluded,
  onToggle,
}: {
  label: string
  badge: string
  selected: GrowMuscleGroup[]
  max: number
  excluded: Set<GrowMuscleGroup>
  onToggle: (muscle: GrowMuscleGroup) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <Badge variant="dot" size="sm" className="text-[10px]">
          {badge}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {GROW_MUSCLE_GROUPS.filter((m) => !excluded.has(m)).map((muscle) => {
          const isSelected = selected.includes(muscle)
          const disabled = !isSelected && selected.length >= max
          return (
            <button
              key={muscle}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(muscle)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs capitalize transition-colors',
                isSelected
                  ? 'border-accent bg-accent/15 text-accent-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/30',
                disabled && 'opacity-40',
              )}
            >
              {formatMuscleLabel(muscle)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MuscleAttributionPicker({
  value,
  onChange,
}: MuscleAttributionPickerProps) {
  const toggleSecondary = (muscle: GrowMuscleGroup) => {
    const has = value.secondary_muscles.includes(muscle)
    onChange({
      ...value,
      secondary_muscles: has
        ? value.secondary_muscles.filter((m) => m !== muscle)
        : [...value.secondary_muscles, muscle].slice(0, 2),
    })
  }

  const toggleOther = (muscle: GrowMuscleGroup) => {
    const has = value.other_muscles.includes(muscle)
    onChange({
      ...value,
      other_muscles: has
        ? value.other_muscles.filter((m) => m !== muscle)
        : [...value.other_muscles, muscle].slice(0, 3),
    })
  }

  return (
    <div className="space-y-4">
      <MuscleSelect
        id="primary-muscle"
        label="Primary muscle"
        badge="1.0×"
        value={value.primary_muscle}
        options={GROW_MUSCLE_GROUPS}
        onChange={(primary_muscle) => onChange({ ...value, primary_muscle })}
      />
      <MuscleMultiToggle
        label="Secondary muscles"
        badge="0.5×"
        selected={value.secondary_muscles}
        max={2}
        excluded={
          new Set([value.primary_muscle, ...value.other_muscles])
        }
        onToggle={toggleSecondary}
      />
      <MuscleMultiToggle
        label="Other muscles"
        badge="0.3×"
        selected={value.other_muscles}
        max={3}
        excluded={
          new Set([value.primary_muscle, ...value.secondary_muscles])
        }
        onToggle={toggleOther}
      />
    </div>
  )
}
