import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts (loaded eagerly for shell stability)
import PatientLayout from './layouts/PatientLayout';
import DoctorLayout from './layouts/DoctorLayout';
import CaregiverLayout from './layouts/CaregiverLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { HomeSkeleton } from './components/Skeletons';

// Auto-recovering lazy import helper to prevent blank screens on chunk mismatch
function lazyWithRetry(componentImport) {
  return lazy(() =>
    componentImport()
      .then((module) => {
        window.sessionStorage.removeItem('chunk_retry_reloaded');
        return module;
      })
      .catch((error) => {
        console.warn('[App] Dynamic chunk load failed, auto-reloading page for fresh assets:', error);
        const hasReloaded = window.sessionStorage.getItem('chunk_retry_reloaded') === 'true';
        if (!hasReloaded) {
          window.sessionStorage.setItem('chunk_retry_reloaded', 'true');
          window.location.reload();
          return new Promise(() => {}); // prevent throwing while reload is executing
        }
        window.sessionStorage.removeItem('chunk_retry_reloaded');
        throw error;
      })
  );
}

// Route-based Code Splitting with Auto-Recovering Lazy Loading
const LoginPage            = lazyWithRetry(() => import('./pages/LoginPage'));
const OnboardingPage       = lazyWithRetry(() => import('./pages/OnboardingPage'));
const HomePage             = lazyWithRetry(() => import('./pages/HomePage'));
const AddMedicinePage      = lazyWithRetry(() => import('./pages/AddMedicinePage'));
const RiskAnalysisPage     = lazyWithRetry(() => import('./pages/RiskAnalysisPage'));
const LogSymptomPage       = lazyWithRetry(() => import('./pages/LogSymptomPage'));
const SymptomResultPage    = lazyWithRetry(() => import('./pages/SymptomResultPage'));
const TimelinePage         = lazyWithRetry(() => import('./pages/TimelinePage'));
const InsightsPage         = lazyWithRetry(() => import('./pages/InsightsPage'));
const DoctorDashboardPage  = lazyWithRetry(() => import('./pages/DoctorDashboardPage'));
const DoctorSharePage      = lazyWithRetry(() => import('./pages/DoctorSharePage'));
const CaregiverViewPage    = lazyWithRetry(() => import('./pages/CaregiverViewPage'));
const ConnectedPeoplePage  = lazyWithRetry(() => import('./pages/ConnectedPeoplePage'));
const ProfilePage          = lazyWithRetry(() => import('./pages/ProfilePage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#EDE8DC] flex items-center justify-center">
      <HomeSkeleton />
    </div>
  );
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <RouteLoadingFallback />;
  if (!user || user.isGuest) return <Navigate to="/login" replace />;
  const role = (user.role || '').toUpperCase();
  if (role === 'DOCTOR') return <Navigate to="/doctor-dashboard" replace />;
  if (role === 'CAREGIVER') return <Navigate to="/caregiver-view" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster
            position="top-right"
            expand={false}
            duration={4000}
            offset="20px"
            toastOptions={{
              style: {
                background: 'transparent',
                boxShadow: 'none',
                border: 'none',
                padding: 0,
              },
            }}
          />
          <ErrorBoundary>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* ── Public Auth Routes ── */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* ── 1. PATIENT LAYOUT & PROTECTED ROUTES ── */}
                <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
                  <Route element={<PatientLayout />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/add-medicine" element={<AddMedicinePage />} />
                    <Route path="/risk/:id" element={<RiskAnalysisPage />} />
                    <Route path="/log-symptom" element={<LogSymptomPage />} />
                    <Route path="/symptom-result" element={<SymptomResultPage />} />
                    <Route path="/timeline" element={<TimelinePage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route path="/trends" element={<InsightsPage />} />
                    <Route path="/connected-people" element={<ConnectedPeoplePage />} />
                    <Route path="/share-with-doctor" element={<DoctorSharePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>

                {/* ── 2. DOCTOR LAYOUT & PROTECTED ROUTES ── */}
                <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
                  <Route element={<DoctorLayout />}>
                    <Route path="/doctor-dashboard" element={<DoctorDashboardPage />} />
                  </Route>
                </Route>

                {/* ── 3. CAREGIVER LAYOUT & PROTECTED ROUTES ── */}
                <Route element={<ProtectedRoute allowedRoles={['CAREGIVER']} />}>
                  <Route element={<CaregiverLayout />}>
                    <Route path="/caregiver-view" element={<CaregiverViewPage />} />
                  </Route>
                </Route>

                {/* ── Default & Fallback Redirects ── */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
