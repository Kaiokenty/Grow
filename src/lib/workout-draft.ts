import type { WorkoutDraft } from '@/lib/workout/types'

const DRAFT_PREFIX = 'grow:workout-draft:'

function draftKey(userId: string) {
  return `${DRAFT_PREFIX}${userId}`
}

export function saveWorkoutDraft(userId: string, draft: WorkoutDraft) {
  localStorage.setItem(draftKey(userId), JSON.stringify(draft))
}

export function loadWorkoutDraft(userId: string): WorkoutDraft | null {
  const raw = localStorage.getItem(draftKey(userId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as WorkoutDraft
  } catch {
    return null
  }
}

export function clearWorkoutDraft(userId: string) {
  localStorage.removeItem(draftKey(userId))
}

export function hasWorkoutDraft(userId: string) {
  return loadWorkoutDraft(userId) !== null
}
