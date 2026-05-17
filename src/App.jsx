import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuthContext } from './context/useAuthContext';
import { Header, Footer } from './components/layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

// Auth Pages
import { LoginPage, SignupPage, OtpVerificationPage } from './features/auth/pages';

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
  AssessmentsPage,
} from './features/recruiter/pages';

import CreateAssessmentPage from './features/assessments/pages/CreateAssessmentPage.jsx';
import ProfilePage from './features/profile/pages/ProfilePage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';
import {
  CandidateAssessmentsPage,
  AssessmentLeaderboardPage,
  EditAssessmentPage,
  TestInterface,
} from './features/assessments/pages';

/**
 * Main App Component with Routing
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
  const location = useLocation();
  const isJobsWorkspace =
    location.pathname === '/jobs' ||
    location.pathname === '/dashboard' ||
    location.pathname === '/candidate/assessments' ||
    location.pathname.startsWith('/test/') ||
    location.pathname === '/recruiter/dashboard' ||
    location.pathname === '/recruiter/post-job' ||
    location.pathname === '/recruiter/manage-jobs' ||
    location.pathname === '/recruiter/applicants' ||
    location.pathname === '/recruiter/company-profile' ||
    location.pathname === '/recruiter/assessments' ||
    location.pathname === '/recruiter/analytics' ||
    location.pathname === '/recruiter/assessments/create' ||
    /^\/recruiter\/assessments\/[^/]+\/edit$/.test(location.pathname);

  return (
    <div className="app-shell flex min-h-screen flex-col">
      {!isJobsWorkspace && <Header isLoggedIn={isLoggedIn} userRole={userRole} />}

      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp-verify" element={<OtpVerificationPage />} />

          {/* Job Routes */}
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:jobId" element={<JobDetailsPage />} />

          {/* Candidate Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute role="candidate">
              <CandidateDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/candidate/assessments" element={
            <ProtectedRoute role="candidate">
              <CandidateAssessmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/test/:sessionToken" element={
            <ProtectedRoute role="candidate">
              <TestInterface />
            </ProtectedRoute>
          } />

          {/* Recruiter Routes */}
          <Route path="/recruiter/dashboard" element={
            <ProtectedRoute role="recruiter">
              <RecruiterDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/post-job" element={
            <ProtectedRoute role="recruiter">
              <PostJobPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/manage-jobs" element={
            <ProtectedRoute role="recruiter">
              <ManageJobsPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/applicants" element={
            <ProtectedRoute role="recruiter">
              <ApplicantsPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/company-profile" element={
            <ProtectedRoute role="recruiter">
              <CompanyProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/analytics" element={
            <ProtectedRoute role="recruiter">
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/recruiter/assessments" element={
            <ProtectedRoute role="recruiter">
              <AssessmentsPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/assessments/create" element={
            <ProtectedRoute role="recruiter">
              <CreateAssessmentPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/assessments/:assessmentId/edit" element={
            <ProtectedRoute role="recruiter">
              <EditAssessmentPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/assessments/:assessmentId/leaderboard" element={
            <ProtectedRoute role="recruiter">
              <AssessmentLeaderboardPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/jobs/:jobId" element={<JobDetailsPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isJobsWorkspace && <Footer />}
    </div>
  );
}

export default App;

