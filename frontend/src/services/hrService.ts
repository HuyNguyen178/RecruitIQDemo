import api from './api';

export const hrService = {
  getOverview: async () => {
    const response = await api.get('/hr/dashboard/overview');
    return response.data;
  }
};
