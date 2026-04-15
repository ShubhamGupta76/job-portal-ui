import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuthContext } from './context/useAuthContext';
import { Header, Footer } from './components/layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// Auth Pages
import { LoginPage, SignupPage } from './features/auth/pages';

// Job Pages
import { JobList, JobDetailsPage } from './features/jobs/pages';

// Dashboard Pages
import CandidateDashboardPage from './features/dashboard/pages/CandidateDashboardPage';

// Recruiter Pages
import {
  RecruiterDashboardPage,
  PostJobPage,
  ManageJobsPage,
  ApplicantsPage,
  CompanyProfilePage,
  AnalyticsPage,
} from './features/recruiter/pages';
import ProfilePage from './features/profile/pages/ProfilePage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';

/**
 * Main App Component with Routing
 * Production-level SaaS Frontend for Job Portal
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { isLoggedIn, userRole } = useAuthContext();

  return (
    <div className="flex flex-col min-h-screen">
      <Header isLoggedIn={isLoggedIn} userRole={userRole} />

      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Job Routes (Public) */}
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:jobId" element={<JobDetailsPage />} />

          {/* Candidate Routes (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="candidate">
                <CandidateDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Recruiter Routes (Protected) */}
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute role="recruiter">
                <RecruiterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/post-job"
            element={
              <ProtectedRoute role="recruiter">
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/manage-jobs"
            element={
              <ProtectedRoute role="recruiter">
                <ManageJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/applicants"
            element={
              <ProtectedRoute role="recruiter">
                <ApplicantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/company-profile"
            element={
              <ProtectedRoute role="recruiter">
                <CompanyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/analytics"
            element={
              <ProtectedRoute role="recruiter">
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/recruiter/jobs/:jobId" element={<JobDetailsPage />} />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
