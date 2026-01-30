import axios from 'axios';
import API_CONFIG from '../config/api';

const API_BASE_URL = API_CONFIG.getApiUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for generation requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Axios response received:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Axios error:', {
      message: error.message,
      code: error.code,
      hasResponse: !!error.response,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    });

    // Handle common errors
    if (error.response?.status === 413) {
      error.message = 'File too large. Please use a smaller image.';
    } else if (error.response?.status === 429) {
      error.message = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. The generation is taking longer than expected.';
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiMethods = {
  // Model operations
  async getModels() {
    const response = await api.get('/models');
    return response.data;
  },

  async getModel(modelId) {
    const response = await api.get(`/models/${modelId}`);
    return response.data;
  },

  async getModelPoses(modelId) {
    const response = await api.get(`/models/${modelId}/poses`);
    return response.data;
  },

  // Generation operations
  async generateTryOn(formData) {
    const response = await api.post('/generation/try-on', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 180000 // 3 minutes for generation
    });
    return response.data;
  },

  async getGenerationJob(jobId) {
    const response = await api.get(`/generation/job/${jobId}`);
    return response.data;
  },

  async cancelGenerationJob(jobId) {
    const response = await api.delete(`/generation/job/${jobId}`);
    return response.data;
  },

  async getProviders() {
    const response = await api.get('/generation/providers');
    return response.data;
  },

  // Get generation history from backend
  async getGenerationHistory(params = {}) {
    const response = await api.get('/generation/history', { params });
    return response.data;
  },

  // Utility operations
  async cleanupFiles(maxAgeHours = 24) {
    const response = await api.post('/generation/cleanup', { maxAgeHours });
    return response.data;
  },

  // Health check
  async healthCheck() {
    const response = await api.get('/health', {
      baseURL: API_BASE_URL.replace('/api', '') // Remove /api for health check
    });
    return response.data;
  }
};

// Helper function to create FormData for generation
export const createGenerationFormData = (generationData, uploads) => {
  const formData = new FormData();
  
  // Add generation parameters
  Object.entries(generationData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });

  // Add embroidery details as individual fields
  if (generationData.embroideryDetails) {
    generationData.embroideryDetails.forEach((detail, index) => {
      formData.append(`embroideryPosition${index + 1}`, detail.position);
      formData.append(`embroideryDescription${index + 1}`, detail.description);
    });
  }

  // Add file uploads
  if (uploads.product) {
    formData.append('productImage', uploads.product);
  }
  if (uploads.detail1) {
    formData.append('detail1', uploads.detail1);
  }
  if (uploads.detail2) {
    formData.append('detail2', uploads.detail2);
  }
  if (uploads.detail3) {
    formData.append('detail3', uploads.detail3);
  }

  return formData;
};

// Polling utility for job status
export const pollJobStatus = async (jobId, onUpdate, maxAttempts = 60) => {
  let attempts = 0;
  
  const poll = async () => {
    try {
      const response = await apiMethods.getGenerationJob(jobId);
      const job = response.job;
      
      onUpdate(job);
      
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return job;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Polling timeout exceeded');
      }
      
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
      return poll();
      
    } catch (error) {
            throw error;
    }
  };
  
  return poll();
};

export default api;