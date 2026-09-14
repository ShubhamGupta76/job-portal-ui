import apiClient from './apiClient';

/**
 * Billing API service. The frontend only ever selects a plan by CODE and displays server-returned
 * amounts — it never sends a price or a payment/subscription status; the backend is authoritative
 * for all of that (see BillingService on the backend).
 */
export const billingService = {
  getPlans: () => apiClient.get('/billing/plans'),

  getSummary: (companyId) => apiClient.get(`/companies/${companyId}/billing`),

  getTransactions: (companyId, page = 0, size = 20) =>
    apiClient.get(`/companies/${companyId}/billing/transactions`, { params: { page, size } }),

  getInvoices: (companyId, page = 0, size = 20) =>
    apiClient.get(`/companies/${companyId}/billing/invoices`, { params: { page, size } }),

  getCreditActivity: (companyId, page = 0, size = 20) =>
    apiClient.get(`/companies/${companyId}/billing/credits`, { params: { page, size } }),

  checkout: (companyId, planCode, billingCycle = 'MONTHLY') =>
    apiClient.post(`/companies/${companyId}/billing/checkout`, {
      planCode,
      billingCycle,
      idempotencyKey: `${companyId}-${planCode}-${billingCycle}-${Date.now()}`,
    }),

  cancelSubscription: (companyId) => apiClient.post(`/companies/${companyId}/billing/subscription/cancel`),

  resumeSubscription: (companyId) => apiClient.post(`/companies/${companyId}/billing/subscription/resume`),
};

export const adminBillingService = {
  getTransactions: (page = 0, size = 20) =>
    apiClient.get('/admin/billing/transactions', { params: { page, size } }),

  confirmPayment: (transactionId, reason) =>
    apiClient.post(`/admin/billing/transactions/${transactionId}/confirm`, { reason }),

  adjustCredits: (companyId, amount, reason) =>
    apiClient.post(`/admin/billing/companies/${companyId}/credits/adjust`, { amount, reason }),
};
