import React from 'react';
import { Loader, Image as ImageIcon } from 'lucide-react';
import { GalleryItem } from './GalleryItem';

// ============================================
// GALLERY GRID COMPONENT
// ============================================
// Masonry-style grid with 30px gap
// 6 columns, images shown at their natural sizes with rounded corners

export function GalleryGrid({
  generations = [],
  onItemClick,
  isLoading = false
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading your generations...</p>
        </div>
      </div>
    );
  }

  // Empty state (should rarely show since we have samples)
  if (generations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Generations Yet
            </h3>
            <p className="text-gray-600">
              Your generated try-on images will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Masonry-style grid with 30px gap on all sides, 6 columns
  return (
    <div className="p-[30px]">
      <div className="columns-1 sm:columns-2 lg:columns-4 xl:columns-6 gap-[30px]">
        {generations.map((gen) => (
          <GalleryItem
            key={gen.id}
            id={gen.id}
            imageUrl={gen.imageUrl}
            modelId={gen.modelId}
            provider={gen.provider}
            pose={gen.pose}
            createdAt={gen.createdAt}
            processingTime={gen.processingTime}
            isSample={gen.isSample}
            userName={gen.userName}
            prompt={gen.prompt}
            onClick={() => onItemClick(gen)}
          />
        ))}
      </div>
    </div>
  );
}

export default GalleryGrid;
