import api from './api';

export const fileService = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url as string;
  },
};
