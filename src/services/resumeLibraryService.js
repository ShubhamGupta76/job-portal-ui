import apiClient from './apiClient';

export const resumeLibraryService = {
  list: () => apiClient.get('/candidate/resumes'),
  upload: (file, label) => {
    const formData = new FormData();
    formData.append('file', file);
    if (label) formData.append('label', label);
    return apiClient.post('/candidate/resumes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  rename: (id, label) => apiClient.put(`/candidate/resumes/${id}`, { label }),
  replace: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/candidate/resumes/${id}/replace`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  setPrimary: (id) => apiClient.post(`/candidate/resumes/${id}/primary`),
  remove: (id) => apiClient.delete(`/candidate/resumes/${id}`),
  download: (id, download = false) =>
    apiClient.get(`/candidate/resumes/${id}/download`, {
      params: { download },
      responseType: 'blob',
    }),
};
