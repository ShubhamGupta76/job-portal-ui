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
  addQuestion: async (assessmentId, questionData) => {
    try {
      const response = await apiClient.post(`/assessments/${assessmentId}/questions`, questionData);
      return response;
    } catch (error) {
      console.error('Failed to add question:', error);
      throw error;
    }
  },
  startAssessment: async (assessmentId) => {
    try {
      console.log("Starting assessment:", assessmentId);
      const response = await apiClient.post('/test-sessions/start', { assessmentId });
      return response;
    } catch (error) {
      console.error("Start error:", error.response?.data);
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
};
