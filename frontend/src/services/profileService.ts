import api from './api';

export interface ProfileData {
  id?: number;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
  profileImageUrl?: string;
}

export interface ProfileUpdateData {
  name: string;
  email: string;
  password?: string;
}

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data as ProfileData;
  },

  updateProfile: async (data: ProfileUpdateData) => {
    const response = await api.put('/users/me', data);
    return response.data as ProfileData;
  }
};
