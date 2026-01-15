import { useCallback } from 'react';
import { useStudio } from '../contexts/StudioContext';

// ============================================
// USE STUDIO STATE HOOK
// ============================================
// Convenience hook for common studio state operations
// Wraps StudioContext for cleaner component code

export function useStudioState() {
  const studio = useStudio();

  // Model selection helpers
  const selectModel = useCallback((modelId) => {
    studio.setSelectedModel(modelId);
    studio.setSidebarSection('pose');
  }, [studio]);

  const selectPose = useCallback((poseId) => {
    studio.setSelectedPose(poseId);
    studio.setSidebarSection('upload');
  }, [studio]);

  // Upload helpers
  const handleUpload = useCallback((slot, file) => {
    studio.setUpload(slot, file);
  }, [studio]);

  const handleRemoveUpload = useCallback((slot) => {
    studio.removeUpload(slot);
  }, [studio]);

  // Generation flow helpers
  const prepareGenerationData = useCallback(() => {
    // Build embroidery details from active uploads
    const embroideryDetails = studio.activeDetailUploads.map((upload, index) => {
      const detailNum = parseInt(upload.key.replace('detail', ''));
      const config = studio.detailConfigs[upload.key];
      return {
        position: config?.position || 'chest_center',
        description: config?.description || '',
        imagePath: upload.file,
      };
    }).filter(detail => detail.description);

    return {
      modelId: studio.selectedModel,
      pose: studio.selectedPose,
      providerId: studio.providerId,
      garmentDescription: `${studio.garmentDescription} ${studio.smartAddons}`.trim(),
      embroideryDetails,
    };
  }, [studio]);

  const resetForNewGeneration = useCallback(() => {
    studio.setCurrentResult(null);
    studio.resetGenerationState();
    studio.setActiveTab('generate');
  }, [studio]);

  // UI helpers
  const goToSection = useCallback((section) => {
    studio.setSidebarSection(section);
  }, [studio]);

  const switchTab = useCallback((tab) => {
    studio.setActiveTab(tab);
  }, [studio]);

  // Validation helpers
  const getValidationError = useCallback(() => {
    if (!studio.selectedModel) return 'Please select a model';
    if (!studio.selectedPose) return 'Please select a pose';
    if (!studio.uploads.product) return 'Please upload a product image';
    if (!studio.providerId) return 'Please select an AI provider';
    return null;
  }, [studio]);

  // Computed helpers
  const getProgressSteps = useCallback(() => {
    return [
      { id: 'model', label: 'Model', completed: !!studio.selectedModel },
      { id: 'pose', label: 'Pose', completed: !!studio.selectedPose },
      { id: 'upload', label: 'Upload', completed: !!studio.uploads.product },
      { id: 'generate', label: 'Generate', completed: !!studio.currentResult },
    ];
  }, [studio]);

  const getSelectedModelInfo = useCallback(() => {
    if (!studio.selectedModel) return null;
    // This would typically fetch from models API
    return {
      id: studio.selectedModel,
      name: studio.selectedModel.charAt(0).toUpperCase() + studio.selectedModel.slice(1),
    };
  }, [studio]);

  return {
    // State access (passthrough)
    ...studio,

    // Helper methods
    selectModel,
    selectPose,
    handleUpload,
    handleRemoveUpload,
    prepareGenerationData,
    resetForNewGeneration,
    goToSection,
    switchTab,
    getValidationError,
    getProgressSteps,
    getSelectedModelInfo,
  };
}

export default useStudioState;
