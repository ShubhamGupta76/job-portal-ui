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

// Recruiter Layout
import RecruiterLayout from './features/recruiter/components/RecruiterLayout';

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

  return (
    <div className="flex flex-col min-h-screen">
      <Header isLoggedIn={isLoggedIn} userRole={userRole} />

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
              <RecruiterLayout title="Recruiter Dashboard" subtitle="Manage your hiring workflow">
                <RecruiterDashboardPage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          <Route path="/recruiter/post-job" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Post New Job" subtitle="Attract top talent">
                <PostJobPage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          <Route path="/recruiter/manage-jobs" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Manage Jobs" subtitle="Job postings & applications">
                <ManageJobsPage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          <Route path="/recruiter/applicants" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Applicants" subtitle="Review & advance candidates">
                <ApplicantsPage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          <Route path="/recruiter/company-profile" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Company Profile" subtitle="Employer branding">
                <CompanyProfilePage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          <Route path="/recruiter/analytics" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Analytics" subtitle="Hiring insights dashboard">
                <AnalyticsPage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/recruiter/assessments" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Assessments" subtitle="Coding tests & MCQ">
                <AssessmentsPage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          <Route path="/recruiter/assessments/create" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Create Assessment" subtitle="Build coding test">
                <CreateAssessmentPage />
              </RecruiterLayout>
            </ProtectedRoute>
          } />
          <Route path="/recruiter/assessments/:assessmentId/edit" element={
            <ProtectedRoute role="recruiter">
              <RecruiterLayout title="Edit Assessment" subtitle="Update coding test">
                <EditAssessmentPage />
              </RecruiterLayout>
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

      <Footer />
    </div>
  );
}

export default App;

