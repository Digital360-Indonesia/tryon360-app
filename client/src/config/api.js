// API Configuration
const API_CONFIG = {
  // Determine backend URL based on environment
  getBackendUrl: () => {
    // Check if we're running on Netlify (production)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const port = typeof window !== 'undefined' ? window.location.port : '';
    const isNetlifyProduction = hostname.includes('netlify.app');
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';

    console.log('API Config Debug:', {
      hostname,
      port,
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      isNetlifyProduction,
      isDevelopment
    });

    // If we're on Netlify, always use production backend
    if (isNetlifyProduction) {
      console.log('Detected Netlify deployment, using production backend');
      return 'https://tryon-app-backend.fly.dev';
    }

    // If environment variable is explicitly set, use it
    if (process.env.REACT_APP_API_URL) {
      const backendUrl = process.env.REACT_APP_API_URL.replace('/api', '');
      console.log('Using backend from env var:', backendUrl);
      return backendUrl;
    }

    // For monolithic architecture, use the same host and port
    if (isDevelopment) {
      const currentPort = port || (window.location.protocol === 'https:' ? '443' : '80');
      const backendUrl = `http://${hostname}:${currentPort}`;
      console.log('Using monolithic backend:', backendUrl);
      return backendUrl;
    }

    // Default fallback
    console.log('Using default backend: http://localhost:5005');
    return 'http://localhost:5005';
  },

  // Get API base URL
  getApiUrl: () => {
    const url = API_CONFIG.getBackendUrl() + '/api';
    console.log('API Base URL:', url);
    return url;
  },

  // Build full image URL
  buildImageUrl: (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl; // Already full URL
    
    const fullUrl = API_CONFIG.getBackendUrl() + imageUrl;
    console.log('Built image URL:', fullUrl, 'from', imageUrl);
    return fullUrl;
  }
};

export default API_CONFIG;