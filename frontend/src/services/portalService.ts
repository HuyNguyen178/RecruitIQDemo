import api from './api';

export const portalService = {
  getOpenJobs: async () => {
    const response = await api.get('/portal/jobs');
    return response.data;
  },

  getJobById: async (id: number | string) => {
    const response = await api.get(`/portal/jobs/${id}`);
    return response.data;
  },

  applyForJob: async (jobId: number | string, cvFile: File) => {
    const formData = new FormData();
    formData.append('file', cvFile);

    const response = await api.post(`/portal/apply/${jobId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyApplications: async () => {
    const response = await api.get('/portal/my-applications');
    return response.data;
  },

  downloadCv: async (id: number, filename: string) => {
    const response = await api.get(`/portal/my-applications/${id}/download-cv`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  withdrawApplication: async (id: number) => {
    const response = await api.delete(`/portal/my-applications/${id}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/portal/dashboard/stats');
    return response.data;
  }
};
