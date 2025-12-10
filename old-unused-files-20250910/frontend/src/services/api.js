import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3002/api',
  timeout: 60000, // 60 seconds timeout for image generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Service class
class ApiService {
  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  }

  // Models API
  async getModels() {
    const response = await api.get('/models');
    return response.data;
  }

  async getModel(modelId) {
    const response = await api.get(`/models/${modelId}`);
    return response.data;
  }

  async getGarmentTypes() {
    const response = await api.get('/models/garments');
    return response.data;
  }

  async getQualitySettings() {
    const response = await api.get('/models/quality');
    return response.data;
  }

  async getGenerativeModels() {
    const response = await api.get('/models/generative');
    return response.data;
  }

  // Try-On Generation API
  async generateTryOn(formData) {
    const response = await api.post('/tryon/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async enhanceLogo(formData) {
    const response = await api.post('/tryon/enhance-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getJobStatus(jobId) {
    const response = await api.get(`/tryon/job/${jobId}`);
    return response.data;
  }

  async cancelJob(jobId) {
    const response = await api.delete(`/tryon/job/${jobId}`);
    return response.data;
  }

  // Queue API
  async getQueueStatus() {
    const response = await api.get('/queue/status');
    return response.data;
  }

  async getQueueJobs(status = null, limit = 50) {
    const params = { limit };
    if (status) params.status = status;
    
    const response = await api.get('/queue/jobs', { params });
    return response.data;
  }

  async getQueueStats() {
    const response = await api.get('/queue/stats');
    return response.data;
  }

  async clearQueue(olderThanHours = 24) {
    const response = await api.post('/queue/clear', { olderThanHours });
    return response.data;
  }

  // Credit tracking methods
  async getCreditSummary(range = 'all') {
    const response = await api.get(`/credits/summary?range=${range}`);
    return response.data;
  }

  async getCreditHistory(range = 'all', limit = 50, offset = 0) {
    const response = await api.get(`/credits/history?range=${range}&limit=${limit}&offset=${offset}`);
    return response.data;
  }

  async exportCreditReport(range = 'all') {
    const response = await api.get(`/credits/export?range=${range}`, {
      responseType: 'blob'
    });
    return response;
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export individual methods for convenience
export const {
  healthCheck,
  getModels,
  getModel,
  getGarmentTypes,
  getQualitySettings,
  getGenerativeModels,
  generateTryOn,
  enhanceLogo,
  getJobStatus,
  cancelJob,
  getQueueStatus,
  getQueueJobs,
  getQueueStats,
  clearQueue,
} = apiService;
