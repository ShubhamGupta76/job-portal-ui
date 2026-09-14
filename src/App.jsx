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
import SavedSearchesPage from './features/dashboard/pages/SavedSearchesPage';
import CandidateActivityPage from './features/dashboard/pages/CandidateActivityPage';
import CandidateAnalyticsPage from './features/dashboard/pages/CandidateAnalyticsPage';
import CandidateResumesPage from './features/dashboard/pages/CandidateResumesPage';
import CandidateRecommendationsPage from './features/dashboard/pages/CandidateRecommendationsPage';
import MessagingPage from './features/messaging/pages/MessagingPage';

// Recruiter Pages
import {
  RecruiterDashboardPage,
  PostJobPage,
  ManageJobsPage,
  ApplicantsPage,
  CompanyProfilePage,
  CompanyVerificationPage,
  TeamManagementPage,
  TeamInviteAcceptPage,
  AnalyticsPage,
  AssessmentsPage,
  BillingPage,
} from './features/recruiter/pages';
import AdminBillingPage from './features/admin/pages/AdminBillingPage';

import CreateAssessmentPage from './features/assessments/pages/CreateAssessmentPage.jsx';
import ProfilePage from './features/profile/pages/ProfilePage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';
import NotificationPreferencesPage from './features/notifications/pages/NotificationPreferencesPage';
import SecuritySettingsPage from './features/settings/pages/SecuritySettingsPage';
import {
  CandidateAssessmentsPage,
  AssessmentLeaderboardPage,
  EditAssessmentPage,
  TestInterface,
} from './features/assessments/pages';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import AdminCompanyVerificationsPage from './features/admin/pages/AdminCompanyVerificationsPage';
import AdminReportsPage from './features/admin/pages/AdminReportsPage';
import CandidateApplicationsPage from './features/applications/pages/CandidateApplicationsPage';
import {
  InterviewDashboardPage,
  InterviewRoomPage,
  InterviewWaitingRoomPage,
} from './features/interview/pages';

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
    location.pathname === '/dashboard/alerts' ||
    location.pathname === '/candidate/activity' ||
    location.pathname === '/candidate/analytics' ||
    location.pathname === '/candidate/resumes' ||
    location.pathname === '/candidate/recommendations' ||
    location.pathname === '/messages' ||
    location.pathname === '/applications' ||
    location.pathname === '/interviews' ||
    location.pathname.startsWith('/interview/') ||
    location.pathname === '/candidate/assessments' ||
    location.pathname.startsWith('/test/') ||
    location.pathname === '/recruiter/dashboard' ||
    location.pathname === '/recruiter/post-job' ||
    location.pathname === '/recruiter/manage-jobs' ||
    location.pathname === '/recruiter/applicants' ||
    location.pathname === '/recruiter/company-profile' ||
    location.pathname === '/recruiter/company/verification' ||
    location.pathname === '/recruiter/team' ||
    location.pathname.startsWith('/team/invite/') ||
    location.pathname === '/recruiter/assessments' ||
    location.pathname === '/recruiter/analytics' ||
    location.pathname === '/recruiter/messages' ||
    location.pathname === '/recruiter/assessments/create' ||
    location.pathname === '/recruiter/billing' ||
    location.pathname === '/admin/dashboard' ||
    location.pathname === '/admin/company-verifications' ||
    location.pathname === '/admin/reports' ||
    location.pathname === '/admin/billing' ||
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
          <Route path="/dashboard/alerts" element={
            <ProtectedRoute role="candidate">
              <SavedSearchesPage />
            </ProtectedRoute>
          } />
          <Route path="/candidate/activity" element={
            <ProtectedRoute role="candidate">
              <CandidateActivityPage />
            </ProtectedRoute>
          } />
          <Route path="/candidate/analytics" element={
            <ProtectedRoute role="candidate">
              <CandidateAnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/candidate/resumes" element={
            <ProtectedRoute role="candidate">
              <CandidateResumesPage />
            </ProtectedRoute>
          } />
          <Route path="/candidate/recommendations" element={
            <ProtectedRoute role="candidate">
              <CandidateRecommendationsPage />
            </ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute role="candidate">
              <CandidateApplicationsPage />
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
          <Route path="/settings/notifications" element={
            <ProtectedRoute>
              <NotificationPreferencesPage />
            </ProtectedRoute>
          } />
          <Route path="/settings/security" element={
            <ProtectedRoute>
              <SecuritySettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagingPage />
            </ProtectedRoute>
          } />
          <Route path="/interviews" element={
            <ProtectedRoute>
              <InterviewDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/interview/join/:inviteToken" element={
            <ProtectedRoute>
              <InterviewWaitingRoomPage />
            </ProtectedRoute>
          } />
          <Route path="/interview/room/:roomToken" element={
            <ProtectedRoute>
              <InterviewRoomPage />
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
          <Route path="/recruiter/company/verification" element={
            <ProtectedRoute role="recruiter">
              <CompanyVerificationPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/team" element={
            <ProtectedRoute role="recruiter">
              <TeamManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/team/invite/:token" element={
            <ProtectedRoute role="recruiter">
              <TeamInviteAcceptPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/analytics" element={
            <ProtectedRoute role="recruiter">
              <AnalyticsPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/billing" element={
            <ProtectedRoute role="recruiter">
              <BillingPage />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/messages" element={
            <ProtectedRoute role="recruiter">
              <MessagingPage />
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

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/company-verifications" element={
            <ProtectedRoute role="admin">
              <AdminCompanyVerificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/billing" element={
            <ProtectedRoute role="admin">
              <AdminBillingPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute role="admin">
              <AdminReportsPage />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isJobsWorkspace && <Footer />}
    </div>
  );
}

export default App;

