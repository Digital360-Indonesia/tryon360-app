import React, { useState, useEffect, useCallback } from 'react';
import { apiMethods } from '../../services/api';
import { GalleryGrid } from '../../components/studio/GalleryGrid';

// Sample images from homepage - default gallery content
const SAMPLE_IMAGES = [
  {
    id: 'sample-1',
    imageUrl: '/assets/landing/samples/red.jpeg',
    modelId: 'red-dress',
    provider: 'flux_kontext',
    pose: 'professional_standing',
    prompt: 'Professional standing pose with elegant red dress',
    userName: 'Bella',
    createdAt: null,
    isSample: true,
  },
  {
    id: 'sample-2',
    imageUrl: '/assets/landing/samples/red2.jpeg',
    modelId: 'red-dress',
    provider: 'nano_banana',
    pose: 'hands_on_hips',
    prompt: 'Confident pose with hands on hips, red dress',
    userName: 'Bella',
    createdAt: null,
    isSample: true,
  },
  {
    id: 'sample-3',
    imageUrl: '/assets/landing/samples/red3.jpeg',
    modelId: 'red-dress',
    provider: 'flux_kontext',
    pose: 'casual_standing',
    prompt: 'Casual standing pose, elegant red dress',
    userName: 'Bella',
    createdAt: null,
    isSample: true,
  },
  {
    id: 'sample-4',
    imageUrl: '/assets/landing/samples/yellow.jpeg',
    modelId: 'yellow-dress',
    provider: 'flux_kontext',
    pose: 'professional_standing',
    prompt: 'Professional standing pose with yellow dress',
    userName: 'Citra',
    createdAt: null,
    isSample: true,
  },
  {
    id: 'sample-5',
    imageUrl: '/assets/landing/samples/yellow2.jpeg',
    modelId: 'yellow-dress',
    provider: 'nano_banana',
    pose: 'walking',
    prompt: 'Walking pose with yellow dress',
    userName: 'Citra',
    createdAt: null,
    isSample: true,
  },
  {
    id: 'sample-6',
    imageUrl: '/assets/landing/samples/yellow3.jpeg',
    modelId: 'yellow-dress',
    provider: 'flux_kontext',
    pose: 'hands_in_pockets',
    prompt: 'Relaxed pose with hands in pockets, yellow dress',
    userName: 'Citra',
    createdAt: null,
    isSample: true,
  },
];

// ============================================
// GALLERY TAB COMPONENT
// ============================================
// Simple grid layout showing generated images
// Sample images shown by default

export function GalleryTab() {
  const [generations, setGenerations] = useState(SAMPLE_IMAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch history from backend API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiMethods.getGenerationHistory({ limit: 50 });

      if (response.success && response.data.length > 0) {
        // Combine samples with real generations
        setGenerations([...SAMPLE_IMAGES, ...response.data]);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      // Keep showing samples on error
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle item click (open detail view/modal)
  const handleItemClick = (generation) => {
    console.log('Clicked generation:', generation);
    // Could open modal or navigate to detail view
  };

  return (
    <div className="h-full overflow-y-auto">
      <GalleryGrid
        generations={generations}
        onItemClick={handleItemClick}
        isLoading={false}
      />
    </div>
  );
}

export default GalleryTab;
