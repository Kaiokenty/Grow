import type { MovementType } from '@/lib/workout/types'

export const MOVEMENT_TYPE_OPTIONS: {
  value: MovementType
  label: string
}[] = [
  { value: 'upper_push', label: 'Upper push' },
  { value: 'upper_pull', label: 'Upper pull' },
  { value: 'lower_compound', label: 'Lower compound' },
  { value: 'lower_hinge', label: 'Lower hinge' },
  { value: 'isolation', label: 'Isolation' },
]

export function movementTypeLabel(value: MovementType) {
  return MOVEMENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
}
