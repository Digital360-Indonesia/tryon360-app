import { useState, useEffect } from 'react';
import { apiMethods } from '../services/api';

// ============================================
// USE MODELS HOOK
// ============================================
// Fetches and manages models list
// Uses existing GET /models endpoint - NO BACKEND MODIFICATIONS

export function useModels() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch models from backend
   * Uses existing GET /models endpoint
   * DO NOT modify the endpoint
   */
  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call existing API endpoint - DO NOT MODIFY
      const response = await apiMethods.getModels();

      // Use data as-is from backend
      setModels(response.models || []);

    } catch (err) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  /**
   * Get model by ID
   */
  const getModelById = (id) => {
    return models.find(m => m.id === id);
  };

  /**
   * Get models by gender
   */
  const getModelsByGender = (gender) => {
    return models.filter(m => m.gender === gender);
  };

  /**
   * Get active models only
   */
  const getActiveModels = () => {
    return models.filter(m => m.status === 'active');
  };

  /**
   * Get male models
   */
  const getMaleModels = () => {
    return getModelsByGender('male');
  };

  /**
   * Get female models
   */
  const getFemaleModels = () => {
    return getModelsByGender('female');
  };

  return {
    models,
    isLoading,
    error,
    getModelById,
    getModelsByGender,
    getActiveModels,
    getMaleModels,
    getFemaleModels,
    refresh: fetchModels
  };
}

export default useModels;
