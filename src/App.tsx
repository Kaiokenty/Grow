import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoggerShell } from '@/components/layout/LoggerShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ForgotPasswordPage } from '@/pages/ForgotPassword'
import { LoginPage } from '@/pages/Login'
import { SignUpPage } from '@/pages/SignUp'

const DashboardPage = lazy(() =>
  import('@/pages/Dashboard').then((m) => ({ default: m.DashboardPage })),
)
const BodyMapPage = lazy(() =>
  import('@/pages/BodyMapPage').then((m) => ({ default: m.BodyMapPage })),
)
const WorkoutsPage = lazy(() =>
  import('@/pages/WorkoutsPage').then((m) => ({ default: m.WorkoutsPage })),
)
const WorkoutLoggerPage = lazy(() =>
  import('@/pages/WorkoutLoggerPage').then((m) => ({
    default: m.WorkoutLoggerPage,
  })),
)
const ExercisesPage = lazy(() =>
  import('@/pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage })),
)
const ProgramsPage = lazy(() =>
  import('@/pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })),
)
const ProgramEditorPage = lazy(() =>
  import('@/pages/ProgramEditorPage').then((m) => ({
    default: m.ProgramEditorPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            element={
              <ProtectedRoute>
                <LoggerShell />
              </ProtectedRoute>
            }
          >
            <Route path="workouts/active" element={<WorkoutLoggerPage />} />
            <Route path="workouts/:id/edit" element={<WorkoutLoggerPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="body-map" element={<BodyMapPage />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/:id" element={<ProgramEditorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
