import apiClient from './apiClient';

export const companyService = {
  getCompanies: () => apiClient.get('/companies'),
  getMyCompany: () => apiClient.get('/companies/me'),
  createCompany: (payload) => apiClient.post('/companies', payload),
  updateMyCompany: (payload) => apiClient.put('/companies/me', payload),
};
