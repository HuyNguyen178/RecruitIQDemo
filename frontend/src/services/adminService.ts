import api from './api';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'HR_OFFICER' | 'CANDIDATE';
  isActive: boolean;
}

export const adminService = {
  getGlobalStats: async () => {
    const response = await api.get('/admin/global-stats');
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  createUser: async (data: User) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  getUserById: async (id: number | string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number | string, data: User) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  changeUserStatus: async (id: number | string) => {
    const response = await api.post(`/admin/users/${id}/changeStatus`);
    return response.data;
  }
};
