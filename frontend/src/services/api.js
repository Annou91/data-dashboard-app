import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur — ajoute automatiquement le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur — redirige vers login si token expiré
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await axios.post(`${API_URL}/auth/login`, formData);
    return response.data;
  },
  register: async (email, username, password) => {
    const response = await api.post('/auth/register', { email, username, password });
    return response.data;
  },
};

export const dataService = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getFiles: async () => {
    const response = await api.get('/data/files');
    return response.data;
  },
  getFileData: async (fileId, page = 1, pageSize = 100) => {
    const response = await api.get(`/data/files/${fileId}?page=${page}&page_size=${pageSize}`);
    return response.data;
  },
  deleteFile: async (fileId) => {
    await api.delete(`/data/files/${fileId}`);
  },
};

export const reportService = {
  generateReport: async (fileId, format = 'pdf') => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_URL}/reports/generate/${fileId}?format=${format}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error('Report generation failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report.${format === 'word' ? 'docx' : 'pdf'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default api;