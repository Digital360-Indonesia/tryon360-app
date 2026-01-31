// API Configuration
const API_CONFIG = {
  // Get backend URL from environment variable
  getBackendUrl: () => {
    return process.env.REACT_APP_API_URL || window.location.origin;
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
