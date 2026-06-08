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
