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
}
