export const queryKeys = {
  userSettings: (userId: string) => ['userSettings', userId] as const,
  exercises: (userId: string) => ['exercises', userId] as const,
  workouts: (userId: string) => ['workouts', userId] as const,
  workout: (workoutId: string) => ['workout', workoutId] as const,
  workoutSets: (workoutId: string) => ['workoutSets', workoutId] as const,
  lastSessionSet: (userId: string, exerciseId: string) =>
    ['lastSessionSet', userId, exerciseId] as const,
  recentExercises: (userId: string) => ['recentExercises', userId] as const,
  programs: (userId: string) => ['programs', userId] as const,
  program: (programId: string) => ['program', programId] as const,
  programExercises: (programId: string) =>
    ['programExercises', programId] as const,
  weeklySummary: (userId: string, weekStartDay: number) =>
    ['weeklySummary', userId, weekStartDay] as const,
  muscleHeatmap: (userId: string, weekStartDay: number) =>
    ['muscleHeatmap', userId, weekStartDay] as const,
  muscleWeekStats: (userId: string, muscle: string, weekStartDay: number) =>
    ['muscleWeekStats', userId, muscle, weekStartDay] as const,
  muscleVolumeHistory: (userId: string, muscle: string, weeks: number) =>
    ['muscleVolumeHistory', userId, muscle, weeks] as const,
  fatigueSummary: (userId: string) => ['fatigueSummary', userId] as const,
  weeklyNlg: (userId: string, weekStartDay: number) =>
    ['weeklyNlg', userId, weekStartDay] as const,
  weeklyVolumeHistory: (userId: string, weeks: number) =>
    ['weeklyVolumeHistory', userId, weeks] as const,
  trainingBlocks: (userId: string) => ['trainingBlocks', userId] as const,
  blockSummary: (userId: string, blockId: string) =>
    ['blockSummary', userId, blockId] as const,
}
