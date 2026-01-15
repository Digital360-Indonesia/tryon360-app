import { useCallback } from 'react';
import { apiMethods, createGenerationFormData } from '../services/api';
import storageService from '../services/storage';
import API_CONFIG from '../config/api';

// ============================================
// USE GENERATION HOOK
// ============================================
// Handles all generation-related API calls
// Uses existing backend endpoints - NO MODIFICATIONS

export function useGeneration() {

  // Generate try-on image
  const generateTryOn = useCallback(async (generationData, uploadFiles) => {
    try {
      // Create FormData with existing helper
      const formData = createGenerationFormData(generationData, uploadFiles);

      // Call existing API endpoint
      const response = await apiMethods.generateTryOn(formData);

      // Return the response
      return {
        success: response.success,
        jobId: response.jobId,
        result: response.success ? {
          ...response.result,
          imageUrl: API_CONFIG.buildImageUrl(response.result.imageUrl),
          generatedAt: new Date().toISOString(),
        } : null,
        error: response.error || null,
        processingTime: response.processingTime,
      };
    } catch (error) {
      console.error('Generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate try-on image',
        result: null,
      };
    }
  }, []);

  // Get job status (for polling)
  const getJobStatus = useCallback(async (jobId) => {
    try {
      const response = await apiMethods.getGenerationJob(jobId);
      return {
        success: true,
        job: response.job || response.data,
      };
    } catch (error) {
      console.error('Job status error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }, []);

  // Cancel generation job
  const cancelJob = useCallback(async (jobId) => {
    try {
      const response = await apiMethods.cancelGenerationJob(jobId);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error('Cancel job error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }, []);

  // Save generation to local storage
  const saveGeneration = useCallback((result) => {
    return storageService.saveGeneration(result);
  }, []);

  // Save generation log
  const saveGenerationLog = useCallback((logData) => {
    return storageService.saveGenerationLog(logData);
  }, []);

  return {
    // Methods
    generateTryOn,
    getJobStatus,
    cancelJob,
    saveGeneration,
    saveGenerationLog,
  };
}

export default useGeneration;
