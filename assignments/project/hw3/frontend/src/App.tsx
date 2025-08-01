/**
 * Main App component with routing and layout
 */

import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LoadingSpinner } from './components/common/LoadingSpinner'
import { Layout } from './components/layout/Layout'
import { useAuth } from './context/AuthContext'

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const SignupPage = React.lazy(() => import('./pages/SignupPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const TasksPage = React.lazy(() => import('./pages/TasksPage'))
const CompletedTasksPage = React.lazy(() => import('./pages/CompletedTasksPage'))

/**
 * Protected Route component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

/**
 * Public Route component
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" text="Loading..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

/**
 * Main App component
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <React.Suspense fallback={<LoadingSpinner size="large" text="Loading..." />}>
                  <LoginPage />
                </React.Suspense>
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <React.Suspense fallback={<LoadingSpinner size="large" text="Loading..." />}>
                  <SignupPage />
                </React.Suspense>
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <React.Suspense fallback={<LoadingSpinner size="large" text="Loading dashboard..." />}>
                  <DashboardPage />
                </React.Suspense>
              }
            />
            <Route
              path="tasks"
              element={
                <React.Suspense fallback={<LoadingSpinner size="large" text="Loading tasks..." />}>
                  <TasksPage />
                </React.Suspense>
              }
            />
            <Route
              path="completed"
              element={
                <React.Suspense fallback={<LoadingSpinner size="large" text="Loading completed tasks..." />}>
                  <CompletedTasksPage />
                </React.Suspense>
              }
            />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App