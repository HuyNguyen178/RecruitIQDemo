import api from './api';

export interface City {
  id: number;
  name: string;
}

export const cityService = {
  getActiveCities: async (): Promise<City[]> => {
    const response = await api.get('/cities');
    return response.data;
  },
};
