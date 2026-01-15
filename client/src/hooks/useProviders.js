import { useState, useEffect } from 'react';
import { apiMethods } from '../services/api';

// ============================================
// USE PROVIDERS HOOK
// ============================================
// Fetches and manages AI providers list
// Uses existing GET /generation/providers endpoint - NO BACKEND MODIFICATIONS

export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch providers from backend
   * Uses existing GET /generation/providers endpoint
   * DO NOT modify the endpoint
   */
  const fetchProviders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call existing API endpoint - DO NOT MODIFY
      const response = await apiMethods.getProviders();

      // Use data as-is from backend
      setProviders(response.providers || []);

    } catch (err) {
      setError(err.message || 'Failed to fetch providers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  /**
   * Get active providers only
   */
  const getActiveProviders = () => {
    return providers.filter(p => p.status === 'active');
  };

  /**
   * Get provider by ID
   */
  const getProviderById = (id) => {
    return providers.find(p => p.id === id);
  };

  /**
   * Get providers by type (image generation vs text)
   */
  const getProvidersByType = (type) => {
    return providers.filter(p => p.type === type);
  };

  /**
   * Get default provider (flux_kontext or first active)
   */
  const getDefaultProvider = () => {
    const defaultProvider = getProviderById('flux_kontext');
    if (defaultProvider) return defaultProvider;
    return getActiveProviders()[0] || null;
  };

  return {
    providers,
    isLoading,
    error,
    getActiveProviders,
    getProviderById,
    getProvidersByType,
    getDefaultProvider,
    refresh: fetchProviders
  };
}

export default useProviders;
