import apiClient from './apiClient';

export const bookmarkService = {
  toggleBookmark: (jobId) => apiClient.post(`/bookmarks/${jobId}/toggle`),
  getSavedJobs: () => apiClient.get('/bookmarks'),
  getBookmarkStatus: (jobId) => apiClient.get(`/bookmarks/${jobId}/status`),
};
