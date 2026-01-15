import React from 'react';
import { Download } from 'lucide-react';
import API_CONFIG from '../../config/api';

// ============================================
// GALLERY ITEM COMPONENT
// ============================================
// Single gallery card displaying a generation
// Uses backend data as-is from /api/generation/history

export function GalleryItem({
  id,
  imageUrl,
  modelId,
  provider,
  pose,
  createdAt,
  processingTime,
  onClick
}) {
  // Build full image URL from backend path
  const fullImageUrl = imageUrl ? API_CONFIG.buildImageUrl(imageUrl) : null;

  // Handle download
  const handleDownload = (e) => {
    e.stopPropagation();
    if (!fullImageUrl) return;

    const link = document.createElement('a');
    link.href = fullImageUrl;
    link.download = `tryon_${modelId}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Format processing time
  const formatProcessingTime = (ms) => {
    if (!ms) return null;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
        {fullImageUrl ? (
          <img
            src={fullImageUrl}
            alt={`Try-on with ${modelId}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Download Button Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            title="Download image"
          >
            <Download className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-sm font-medium capitalize">
            {modelId?.replace(/_/g, ' ') || 'Unknown Model'}
          </span>
          {formatProcessingTime(processingTime) && (
            <span className="text-white/80 text-xs">
              {formatProcessingTime(processingTime)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-white/70">
          <span className="capitalize">{provider?.replace(/_/g, ' ') || 'Unknown'}</span>
          <span>{formatRelativeTime(createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

export default GalleryItem;
