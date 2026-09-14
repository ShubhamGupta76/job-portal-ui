import apiClient from './apiClient';

export const fileService = {
  uploadFile: (file, entityType, entityId, fileCategory = 'DOCUMENT') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    if (entityId != null) formData.append('entityId', entityId);
    formData.append('fileCategory', fileCategory);
    return apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
