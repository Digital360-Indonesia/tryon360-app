import React, { useState, useEffect, useCallback } from 'react';
import { apiMethods } from '../../services/api';
import { GalleryGrid } from '../../components/studio/GalleryGrid';
import { ImageLightbox } from '../../components/studio/ImageLightbox';

// ============================================
// GALLERY TAB COMPONENT
// ============================================
// Displays generation history from database
// Fetches real data from MySQL backend
// Lightbox for zoom and slideshow

export function GalleryTab() {
  const [generations, setGenerations] = useState([]);
  const [displayedGenerations, setDisplayedGenerations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch history from backend API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📸 Fetching generation history from database...');
      const response = await apiMethods.getGenerationHistory({ limit: 100 });

      console.log('📥 History response:', {
        success: response.success,
        hasData: !!response.data,
        totalCount: response.data?.length || 0,
        firstItem: response.data?.[0]
      });

      if (response.success && response.data && response.data.length > 0) {
        // Filter only completed generations with images
        const validGenerations = response.data.filter(item => {
          const hasImage = item.imageUrl && item.imageUrl !== '' && item.imageUrl !== null;
          const isCompleted = item.status === 'completed';
          return hasImage && isCompleted;
        });

        console.log('🔍 Filter results:', {
          original: response.data.length,
          filtered: validGenerations.length,
          removed: response.data.length - validGenerations.length
        });

        // Map database fields to expected format
        const mappedGenerations = validGenerations.map(item => ({
          id: item.jobId || item.id,
          jobId: item.jobId,
          imageUrl: item.imageUrl, // Already includes /generated/ prefix
          modelId: item.modelId,
          provider: item.provider,
          pose: item.pose,
          prompt: item.prompt,
          status: item.status,
          processingTime: item.processingTime,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          isFromDatabase: true
        }));

        console.log('✅ Final generations:', {
          total: mappedGenerations.length,
          allIds: mappedGenerations.map(g => ({id: g.id, modelId: g.modelId, hasImage: !!g.imageUrl})),
          firstId: mappedGenerations[0]?.id,
          lastId: mappedGenerations[mappedGenerations.length - 1]?.id
        });

        setGenerations(mappedGenerations);
        setDisplayedGenerations(mappedGenerations);
      } else {
        console.log('ℹ️ No generations found in database');
        setGenerations([]);
        setDisplayedGenerations([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch history:', err);
      setError('Failed to load gallery. Please try again.');
      setGenerations([]);
      setDisplayedGenerations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle item click - open lightbox
  const handleItemClick = (generation) => {
    console.log('Opening lightbox for:', generation.id);

    // Find the index of this generation in our displayed list
    const index = displayedGenerations.findIndex(g => g.id === generation.id);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // Handle close lightbox
  const handleCloseLightbox = () => {
    setLightboxOpen(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchHistory();
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with refresh button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generation Gallery</h2>
            <p className="text-sm text-gray-600">
              {displayedGenerations.length} {displayedGenerations.length === 1 ? 'generation' : 'generations'}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Gallery grid */}
      <div className="p-6">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : displayedGenerations.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No generations yet. Start creating!</p>
          </div>
        ) : (
          <GalleryGrid
            generations={displayedGenerations}
            onItemClick={handleItemClick}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && displayedGenerations.length > 0 && (
        <ImageLightbox
          images={displayedGenerations}
          initialIndex={lightboxIndex}
          onClose={handleCloseLightbox}
        />
      )}
    </div>
  );
}

export default GalleryTab;
