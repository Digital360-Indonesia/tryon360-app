import React, { useCallback, useEffect } from 'react';
import { useStudio } from '../../contexts/StudioContext';
import { useGeneration } from '../../hooks/useGeneration';
import { useGallery } from '../../hooks/useGallery';
import {
  SelectedOptionsChips,
  AddOnsPrompt,
  GeneratedPreview,
} from '../../components/studio';

// ============================================
// GENERATE TAB COMPONENT
// ============================================
// Main generation interface - Canvas area
// Layout: Generated Preview (top) → Selected Options Chips → Add-ons Prompt (bottom)
// Uses StudioContext for state, useGeneration for API calls

export function GenerateTab() {
  const {
    selectedModel,
    selectedPose,
    uploads,
    smartAddons,
    setSmartAddons,
    providerId,
    isGenerating,
    generationProgress,
    currentResult,
    setSidebarSection,
    canGenerate,
    completeGeneration,
    failGeneration,
    startGeneration,
    setCurrentResult,
  } = useStudio();

  const { generateTryOn, saveGeneration, saveGenerationLog } = useGeneration();
  const { addToGallery } = useGallery();

  // Handle generate button
  const handleGenerate = useCallback(async () => {
    if (!canGenerate || isGenerating) return;

    startGeneration();

    try {
      // Prepare generation data
      const generationData = {
        modelId: selectedModel,
        pose: selectedPose,
        providerId: providerId,
        garmentDescription: smartAddons || 'Standard try-on generation',
      };

      // Add embroidery details if present
      const embroideryDetails = [];
      if (uploads.detail1) {
        embroideryDetails.push({
          position: 'chest_left',
          description: 'Detail embroidery'
        });
      }
      if (embroideryDetails.length > 0) {
        generationData.embroideryDetails = embroideryDetails;
      }

      // Add smart addons to prompt
      if (smartAddons) {
        generationData.additionalPrompt = smartAddons;
      }

      // Call API
      const response = await generateTryOn(generationData, uploads);

      if (response.success && response.result) {
        // Complete generation
        completeGeneration(response.result);

        // Save to gallery
        addToGallery(response.result);
        saveGeneration(response.result);

        // Save generation log
        saveGenerationLog({
          timestamp: new Date().toISOString(),
          modelId: selectedModel,
          pose: selectedPose,
          providerId: providerId,
          success: true,
          processingTime: response.processingTime,
          cost: response.result?.metadata?.cost
        });
      } else {
        failGeneration();
      }
    } catch (error) {
      console.error('Generation failed:', error);
      failGeneration();
    }
  }, [
    canGenerate,
    isGenerating,
    selectedModel,
    selectedPose,
    providerId,
    smartAddons,
    uploads,
    generateTryOn,
    completeGeneration,
    failGeneration,
    startGeneration,
    addToGallery,
    saveGeneration,
    saveGenerationLog
  ]);

  // Handle chip click - scroll to sidebar section
  const handleChipClick = useCallback((section) => {
    setSidebarSection(section);
  }, [setSidebarSection]);

  // Handle download
  const handleDownload = useCallback((imageUrl) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `tryon_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Handle share
  const handleShare = useCallback(() => {
    // Share logic handled by GeneratedPreview component
    console.log('Share triggered');
  }, []);

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Handle clear
  const handleClear = useCallback(() => {
    setCurrentResult(null);
  }, [setCurrentResult]);

  // Check if any option is selected
  const hasSelections = selectedModel || selectedPose || uploads.product || providerId;

  // Debug logging
  useEffect(() => {
    console.log('GenerateTab state:', {
      selectedModel,
      selectedPose,
      uploads,
      providerId,
      hasSelections
    });
  }, [selectedModel, selectedPose, uploads, providerId, hasSelections]);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Generated Preview - Top section, takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <GeneratedPreview
          imageUrl={currentResult?.imageUrl || null}
          isGenerating={isGenerating}
          generationData={{
            progress: generationProgress,
            provider: providerId,
            metadata: currentResult?.metadata
          }}
          error={null}
          onRegenerate={handleRegenerate}
          onDownload={handleDownload}
          onShare={handleShare}
          onClear={handleClear}
        />
      </div>

      {/* Selected Options Chips - Always show for debugging */}
      <SelectedOptionsChips
        selectedModel={selectedModel}
        selectedPose={selectedPose}
        uploads={uploads}
        providerId={providerId}
        onChipClick={handleChipClick}
      />

      {/* Add-ons Prompt - Bottom section */}
      <div className="flex-shrink-0 px-6 py-4">
        <AddOnsPrompt
          value={smartAddons}
          onChange={setSmartAddons}
          placeholder="Add custom enhancements... e.g., 'Add golden embroidery on collar, pearl buttons on front'"
          maxLength={200}
        />
      </div>
    </div>
  );
}

export default GenerateTab;
