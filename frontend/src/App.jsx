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
import { HomeSkeleton } from './components/Skeletons';

// Route-based Code Splitting with React.lazy
const LoginPage            = lazy(() => import('./pages/LoginPage'));
const OnboardingPage       = lazy(() => import('./pages/OnboardingPage'));
const HomePage             = lazy(() => import('./pages/HomePage'));
const AddMedicinePage      = lazy(() => import('./pages/AddMedicinePage'));
const RiskAnalysisPage     = lazy(() => import('./pages/RiskAnalysisPage'));
const LogSymptomPage       = lazy(() => import('./pages/LogSymptomPage'));
const SymptomResultPage    = lazy(() => import('./pages/SymptomResultPage'));
const TimelinePage         = lazy(() => import('./pages/TimelinePage'));
const InsightsPage         = lazy(() => import('./pages/InsightsPage'));
const DoctorDashboardPage  = lazy(() => import('./pages/DoctorDashboardPage'));
const DoctorSharePage      = lazy(() => import('./pages/DoctorSharePage'));
const CaregiverViewPage    = lazy(() => import('./pages/CaregiverViewPage'));
const ConnectedPeoplePage  = lazy(() => import('./pages/ConnectedPeoplePage'));

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
    <div className="min-h-[85vh] bg-[#FBF8F2]">
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
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
