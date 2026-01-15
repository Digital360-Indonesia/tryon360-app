import { useCallback } from 'react';
import storageService from '../services/storage';
import API_CONFIG from '../config/api';

// ============================================
// USE GALLERY HOOK
// ============================================
// Handles gallery/history management
// Uses local storage - NO BACKEND MODIFICATIONS

export function useGallery() {

  // Load all gallery items from local storage
  const loadGallery = useCallback(() => {
    const history = storageService.getGenerationHistory();

    // Transform items to include full image URLs
    return history.map(item => ({
      ...item,
      imageUrl: item.imageUrl ? API_CONFIG.buildImageUrl(item.imageUrl) : null,
    }));
  }, []);

  // Load gallery on mount
  const loadGalleryOnMount = useCallback(() => {
    return loadGallery();
  }, [loadGallery]);

  // Add new item to gallery
  const addToGallery = useCallback((result) => {
    storageService.saveGeneration(result);
    return result;
  }, []);

  // Clear all gallery items
  const clearGallery = useCallback(() => {
    return storageService.clearGenerationHistory();
  }, []);

  // Delete specific item
  const deleteItem = useCallback((itemId) => {
    try {
      const history = storageService.getGenerationHistory();
      const filtered = history.filter(item => item.id !== itemId);
      localStorage.setItem('tryon_generation_history', JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Failed to delete item:', error);
      return false;
    }
  }, []);

  // Filter gallery by model
  const filterByModel = useCallback((items, modelId) => {
    if (modelId === 'all') return items;
    return items.filter(item => item.modelId === modelId);
  }, []);

  // Get unique models from gallery
  const getGalleryModels = useCallback((items) => {
    const modelIds = [...new Set(items.map(item => item.modelId))];
    return modelIds;
  }, []);

  // Get gallery stats
  const getGalleryStats = useCallback((items) => {
    const byModel = {};
    items.forEach(item => {
      const modelId = item.modelId || 'unknown';
      byModel[modelId] = (byModel[modelId] || 0) + 1;
    });

    return {
      total: items.length,
      byModel,
    };
  }, []);

  return {
    // Methods
    loadGallery,
    loadGalleryOnMount,
    addToGallery,
    clearGallery,
    deleteItem,
    filterByModel,
    getGalleryModels,
    getGalleryStats,
  };
}

export default useGallery;
