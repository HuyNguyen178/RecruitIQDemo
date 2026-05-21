import api from './api';

export const candidateService = {
  getCandidatesByJob: async (jobId: number | string) => {
    const response = await api.get(`/candidates/job/${jobId}`);
    return response.data;
  },

  getCandidateById: async (id: number | string) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },

  uploadCV: async (jobId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    
    const response = await api.post(`/candidates/${jobId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadCV: async (id: number | string) => {
    // Returns a blob so we can trigger a download in the browser
    const response = await api.get(`/candidates/${id}/download-cv`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportCandidates: async (jobId: number | string) => {
    const response = await api.get(`/candidates/job/${jobId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  deleteCandidate: async (id: number | string) => {
    const response = await api.delete(`/candidates/${id}`);
    return response.data;
  },

  updateDecision: async (id: number | string, data: { decisionStatus: string; hrNotes: string }) => {
    const response = await api.patch(`/candidates/${id}/decision`, data);
    return response.data;
  }
};
