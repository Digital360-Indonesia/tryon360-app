import React, { useState } from 'react';
import { Download, Heart, Eye, User } from 'lucide-react';
import API_CONFIG from '../../config/api';

// ============================================
// GALLERY ITEM COMPONENT
// ============================================
// Single image with rounded corners
// Hover overlay with user info, description, and action buttons
// Natural image size, 30px gap handled by parent grid

export function GalleryItem({
  id,
  imageUrl,
  modelId,
  provider,
  pose,
  createdAt,
  processingTime,
  isSample = false,
  userName,
  prompt,
  onClick
}) {
  const [isLiked, setIsLiked] = useState(false);

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

  // Handle like toggle
  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  // Handle view
  const handleView = (e) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div
      className="group relative mb-[30px] break-inside-avoid rounded-xl overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Image - natural size */}
      {fullImageUrl ? (
        <img
          src={fullImageUrl}
          alt={`Try-on with ${modelId}`}
          className="w-full h-auto rounded-xl transition-transform duration-200"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}

      {/* Hover Overlay - shows on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {/* User Info */}
          {userName && (
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium text-sm">{userName}</span>
            </div>
          )}

          {/* Description / Prompt */}
          {prompt && (
            <p className="text-white/90 text-sm mb-3 line-clamp-2">
              {prompt}
            </p>
          )}

          {/* Generation Details */}
          {!isSample && (
            <div className="flex flex-wrap gap-2 mb-3">
              {provider && (
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                  {provider}
                </span>
              )}
              {modelId && (
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                  {modelId}
                </span>
              )}
              {pose && (
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                  {pose}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isLiked
                  ? 'bg-red-500 text-white'
                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>Like</span>
            </button>
            <button
              onClick={handleView}
              className="flex items-center space-x-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
            <button
              onClick={handleDownload}
              className="ml-auto p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GalleryItem;
