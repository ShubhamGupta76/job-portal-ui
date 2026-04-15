import apiClient from './apiClient';

/**
 * Recruiter API service
 */

export const recruiterService = {
  getDashboardStats: () =>
    apiClient.get('/dashboard/recruiter'),

  getJobs: (params = {}) =>
    apiClient.get('/jobs/my-jobs', { params }),

  getAllApplications: (params = {}) =>
    apiClient.get('/applications/recruiter', { params }),

  getCompanyProfile: () =>
    apiClient.get('/companies/me'),

  updateCompanyProfile: (companyData) =>
    apiClient.put('/companies/me', companyData),
};
