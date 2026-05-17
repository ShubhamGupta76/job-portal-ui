import apiClient from './apiClient';

export const assessmentService = {
  getAssessmentsForJob: async (jobId) => {
    try {
      const response = await apiClient.get(`/assessments/job/${jobId}`);
      return response;
    } catch (error) {
      console.error('Failed to get assessments for job:', error);
      throw error;
    }
  },
  getMyAssessments: async () => {
    try {
      const response = await apiClient.get('/assessments/my');
      return response;
    } catch (error) {
      console.error('Failed to get my assessments:', error);
      throw error;
    }
  },
  getAssessment: async (assessmentId) => {
    try {
      const response = await apiClient.get(`/assessments/${assessmentId}`);
      return response;
    } catch (error) {
      console.error('Failed to get assessment:', error);
      throw error;
    }
  },
  createAssessment: async (data) => {
    try {
      const response = await apiClient.post('/assessments', data);
      return response;
    } catch (error) {
      console.error('Failed to create assessment:', error);
      throw error;
    }
  },
  updateAssessment: async (assessmentId, data) => {
    try {
      const response = await apiClient.put(`/assessments/${assessmentId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to update assessment:', error);
      throw error;
    }
  },
  publishAssessment: async (assessmentId) => {
    try {
      const response = await apiClient.post(`/assessments/${assessmentId}/publish`);
      return response;
    } catch (error) {
      console.error('Failed to publish assessment:', error);
      throw error;
    }
  },
  closeAssessment: async (assessmentId) => {
    try {
      const response = await apiClient.post(`/assessments/${assessmentId}/close`);
      return response;
    } catch (error) {
      console.error('Failed to close assessment:', error);
      throw error;
    }
  },
  deleteAssessment: async (assessmentId) => {
    try {
      const response = await apiClient.delete(`/assessments/${assessmentId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete assessment:', error);
      throw error;
    }
  },
  addQuestion: async (assessmentId, questionData) => {
    try {
      const response = await apiClient.post(`/assessments/${assessmentId}/questions`, questionData);
      return response;
    } catch (error) {
      console.error('Failed to add question:', error);
      throw error;
    }
  },
  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await apiClient.put(`/assessments/questions/${questionId}`, questionData);
      return response;
    } catch (error) {
      console.error('Failed to update question:', error);
      throw error;
    }
  },
  deleteQuestion: async (questionId) => {
    try {
      const response = await apiClient.delete(`/assessments/questions/${questionId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete question:', error);
      throw error;
    }
  },
  startAssessment: async (assessmentId) => {
    try {
      console.log("Starting assessment:", assessmentId);
      const response = await apiClient.post('/test-sessions/start', {
        assessmentId,
        deviceFingerprint: getDeviceFingerprint(),
      });
      return response;
    } catch (error) {
      console.error("Start error:", getApiErrorMessage(error), error.response?.data);
      throw error;
    }
  },
  assignAssessment: async (jobId, candidateId, assessmentId) => {
    try {
      const response = await apiClient.post('/assessments/assign', { jobId, candidateId, assessmentId });
      return response;
    } catch (error) {
      console.error('Failed to assign assessment:', error);
      throw error;
    }
  },
  getSessionInfo: async (sessionToken) => {
    try {
      const response = await apiClient.get('/test-sessions/info', { params: { sessionToken } });
      return response;
    } catch (error) {
      console.error('Failed to get test session info:', error);
      throw error;
    }
  },
  submitAnswer: async (payload) => {
    try {
      const response = await apiClient.post('/submissions', payload);
      return response;
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  },
  submitTestSession: async (sessionToken) => {
    try {
      const response = await apiClient.post('/test-sessions/submit', null, { params: { sessionToken } });
      return response;
    } catch (error) {
      console.error('Failed to submit test session:', error);
      throw error;
    }
  },
  executeCode: async (payload) => {
    try {
      const response = await apiClient.post('/submissions/execute-code', payload);
      return response;
    } catch (error) {
      console.error('Failed to execute code:', error);
      throw error;
    }
  },
  logProctoringEvent: async (payload) => {
    try {
      const response = await apiClient.post('/proctoring/log-event', payload);
      return response;
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
      throw error;
    }
  },
};

const getDeviceFingerprint = () => {
  const existing = localStorage.getItem('assessmentDeviceFingerprint');
  if (existing) return existing;

  const entropy = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  ].join('|');

  const fingerprint = btoa(unescape(encodeURIComponent(entropy))).slice(0, 180);
  localStorage.setItem('assessmentDeviceFingerprint', fingerprint);
  return fingerprint;
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  return data.message || data.error || data.data?.message || fallback;
};
