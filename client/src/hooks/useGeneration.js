import { useCallback } from 'react';
import { apiMethods, createGenerationFormData } from '../services/api';
import storageService from '../services/storage';
import API_CONFIG from '../config/api';
import toastr from 'toastr';

// Configure toastr
toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: false,
  progressBar: true,
  positionClass: 'toast-top-right',
  preventDuplicates: false,
  onclick: null,
  showDuration: '300',
  hideDuration: '1000',
  timeOut: '5000',
  extendedTimeOut: '1000',
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut',
};

// ============================================
// USE GENERATION HOOK
// ============================================
// Handles all generation-related API calls
// Uses existing backend endpoints - NO MODIFICATIONS

export function useGeneration() {

  // Generate try-on image
  const generateTryOn = useCallback(async (generationData, uploadFiles) => {
    console.log('🔧 useGeneration: generateTryOn called');
    try {
      // Create FormData with existing helper
      const formData = createGenerationFormData(generationData, uploadFiles);
      console.log('📦 FormData created');

      // Call existing API endpoint
      console.log('📤 Calling apiMethods.generateTryOn...');
      const response = await apiMethods.generateTryOn(formData);
      console.log('📥 API Response:', {
        hasSuccess: 'success' in response,
        success: response?.success,
        hasResult: 'result' in response,
        hasJobId: 'jobId' in response,
        hasError: 'error' in response,
        keys: Object.keys(response),
        response: response
      });

      // Return the response
      const result = {
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
      console.log('✅ Returning from useGeneration:', result);
      return result;
    } catch (error) {
      console.error('💥 useGeneration error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);

      // Handle 403 Forbidden - Token habis
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.error || error.message;
        const message = errorMessage.includes('Token habis') ? errorMessage : 'Token habis. Silakan hubungi admin untuk menambah token.';

        // Show toastr notification
        toastr.error(message, 'Token Habis', {
          timeOut: 6000,
          extendedTimeOut: 2000,
        });

        return {
          success: false,
          error: message,
          result: null,
          isTokenError: true,
        };
      }

      // Handle other errors
      const errorMessage = error.message || 'Failed to generate try-on image';
      toastr.error(errorMessage, 'Error', {
        timeOut: 5000,
      });

      return {
        success: false,
        error: errorMessage,
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
