export type DisplayUnit = 'kg' | 'lbs'

const KG_TO_LBS = 2.2046226218

export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS
}

export function lbsToKg(lbs: number): number {
  return lbs / KG_TO_LBS
}

export function formatWeight(kg: number, unit: DisplayUnit, digits = 1): string {
  const value = unit === 'lbs' ? kgToLbs(kg) : kg
  return `${value.toFixed(digits)} ${unit}`
}

/** Aggregate volume / tonnage — whole numbers with separators. */
export function formatTonnage(kg: number, unit: DisplayUnit): string {
  const value =
    unit === 'lbs'
      ? Math.round(kgToLbs(kg))
      : Math.round(kg)
  return `${value.toLocaleString()} ${unit}`
}

export function formatTonnageValue(kg: number, unit: DisplayUnit): number {
  return unit === 'lbs' ? Math.round(kgToLbs(kg)) : Math.round(kg)
}

export function formatE1rm(kg: number, unit: DisplayUnit): string {
  const value = unit === 'lbs' ? kgToLbs(kg) : kg
  return `${value.toFixed(1)} ${unit}`
}

export function formatE1rmValue(kg: number, unit: DisplayUnit): number {
  const value = unit === 'lbs' ? kgToLbs(kg) : kg
  return Math.round(value * 10) / 10
}
