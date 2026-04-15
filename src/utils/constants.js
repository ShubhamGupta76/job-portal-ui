/**
 * Constants used throughout the application
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  JOBS: {
    LIST: '/jobs',
    DETAIL: '/jobs/:id',
    CREATE: '/jobs',
    UPDATE: '/jobs/:id',
    DELETE: '/jobs/:id',
    APPLY: '/jobs/:id/apply',
  },
  RECRUITER: {
    DASHBOARD: '/recruiter/stats',
    JOBS: '/recruiter/jobs',
    APPLICATIONS: '/recruiter/applications',
  },
};

export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

export const EXPERIENCE_LEVELS = [
  { value: 0, label: 'Fresher' },
  { value: 1, label: '1 Year' },
  { value: 2, label: '2 Years' },
  { value: 3, label: '3-5 Years' },
  { value: 5, label: '5+ Years' },
];

export const APPLICATION_STATUS = {
  NEW: 'new',
  SHORTLISTED: 'shortlisted',
  UNDER_REVIEW: 'under-review',
  INTERVIEW_SCHEDULED: 'interview-scheduled',
  REJECTED: 'rejected',
  HIRED: 'hired',
};

export const USER_ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter',
};
