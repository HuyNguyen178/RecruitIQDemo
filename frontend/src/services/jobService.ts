import api from './api';

export interface Job {
  id?: number;
  title: string;
  department: string;
  location?: string;
  cityId: number;
  cityName?: string;
  jdText: string;
  requiredSkills: string;
  minExperienceYears?: number;
  requiredEducation?: 'HIGH_SCHOOL' | 'BACHELOR' | 'MASTER' | 'PHD';
  deadline?: string;
  status: 'OPEN' | 'CLOSED';
  createdByName?: string;
  createdByEmail?: string;
  createdAt?: string;
  logoUrl?: string;
  salary?: string;
  candidateCount?: number;
}

export const jobService = {
  getAllJobs: async () => {
    const response = await api.get('/jobs');
    return response.data;
  },
  
  getJobById: async (id: number | string) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (data: Job) => {
    const response = await api.post('/jobs', data);
    return response.data;
  },

  updateJob: async (id: number | string, data: Job) => {
    const response = await api.put(`/jobs/${id}`, data);
    return response.data;
  },

  deleteJob: async (id: number | string) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  getJobStats: async (jobId: number | string) => {
    const response = await api.get(`/jobs/${jobId}/stats`);
    return response.data;
  },
  
  getJobCandidateStatuses: async (jobId: number | string) => {
    const response = await api.get(`/jobs/${jobId}/candidates/status`);
    return response.data;
  }
};
