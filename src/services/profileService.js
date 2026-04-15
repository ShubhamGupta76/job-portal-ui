import apiClient from './apiClient';

export const profileService = {
  getProfile: () => apiClient.get('/profile'),
  updateProfile: (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    return apiClient.put('/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
