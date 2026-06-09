import { describe, expect, it } from 'vitest'
import { landmarkBand, landmarkBandLabel } from '@/lib/body-map/landmarks'

describe('landmarkBand', () => {
  it('returns untrained for zero sets', () => {
    expect(landmarkBand(0, 'chest')).toBe('untrained')
  })

  it('flags under MEV for chest', () => {
    expect(landmarkBand(4, 'chest')).toBe('under')
  })

  it('flags productive in MEV–MRV window', () => {
    expect(landmarkBand(12, 'chest')).toBe('productive')
  })

  it('flags over MRV', () => {
    expect(landmarkBand(25, 'chest')).toBe('over')
  })
})

describe('landmarkBandLabel', () => {
  it('labels productive band', () => {
    expect(landmarkBandLabel('productive')).toBe('In range')
  })
})
