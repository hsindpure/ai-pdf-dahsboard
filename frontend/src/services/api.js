// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for document processing
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // File upload
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  // Get session data
  getSession: async (sessionId) => {
    const response = await api.get(`/api/session/${sessionId}`);
    return response.data;
  },

  // Generate dashboard
  generateDashboard: async (sessionId) => {
    const response = await api.post('/api/generate-dashboard', {
      sessionId
    });
    return response.data;
  },

  // Get all sessions (for debugging)
  getSessions: async () => {
    const response = await api.get('/api/sessions');
    return response.data;
  },

  // Clear all sessions (for debugging)
  clearSessions: async () => {
    const response = await api.delete('/api/sessions');
    return response.data;
  },


  getRawData: async (sessionId) => {
    const response = await api.get(`/api/raw-data/${sessionId}`);
    return response.data;
  },

  // Get just the extracted text
  getExtractedText: async (sessionId) => {
    const response = await api.get(`/api/extracted-text/${sessionId}`);
    return response.data;
  }
};

export default apiService;