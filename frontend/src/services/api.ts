import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Adjust if backend port is different
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (e.g., redirect to login or logout)
      console.error('Unauthorized, please login again.');
      // Optional: window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
