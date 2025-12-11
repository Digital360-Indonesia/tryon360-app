// API Configuration
const API_CONFIG = {
  // Determine backend URL based on environment
  getBackendUrl: () => {
    // Check if we're running on Netlify (production)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const port = typeof window !== 'undefined' ? window.location.port : '';
    const isNetlifyProduction = hostname.includes('netlify.app');
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';

  
    // If we're on Netlify, always use production backend
    if (isNetlifyProduction) {
        return 'https://tryon-app-backend.fly.dev';
    }

    // If environment variable is explicitly set, use it
    if (process.env.REACT_APP_API_URL) {
      const backendUrl = process.env.REACT_APP_API_URL.replace('/api', '');
        return backendUrl;
    }

    // For monolithic architecture, use the same host and port
    if (isDevelopment) {
      const currentPort = port || (window.location.protocol === 'https:' ? '443' : '80');
      const backendUrl = `http://${hostname}:${currentPort}`;
        return backendUrl;
    }

    // Default fallback
    if (isDevelopment) {
      return `http://localhost:${process.env.PORT || '9901'}`;
    }
    // For production domains, use HTTPS with current host
    return `https://${hostname}`;
  },

  // Get API base URL
  getApiUrl: () => {
    const url = API_CONFIG.getBackendUrl() + '/api';
      return url;
  },

  // Build full image URL
  buildImageUrl: (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl; // Already full URL
    
    const fullUrl = API_CONFIG.getBackendUrl() + imageUrl;
      return fullUrl;
  }
};

export default API_CONFIG;