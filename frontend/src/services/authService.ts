import api from './api';

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface RegisterRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  register: async (data: RegisterRequest) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  }
};
