import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';
import API_CONFIG from '../../config/api';

// ============================================
// IMAGE LIGHTBOX COMPONENT
// ============================================
// Full-screen image viewer with slideshow functionality

export function ImageLightbox({ images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setImageLoaded(false);
  }, [initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentImage = images[currentIndex];
  const fullImageUrl = currentImage?.imageUrl ? API_CONFIG.buildImageUrl(currentImage.imageUrl) : null;

  const goNext = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleDownload = () => {
    if (!fullImageUrl) return;

    const link = document.createElement('a');
    link.href = fullImageUrl;
    link.download = `tryon_${currentImage?.modelId}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        title="Close (Esc)"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Image Container */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        {/* Previous Button */}
        <button
          onClick={goPrev}
          className="absolute left-4 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous (←)"
          disabled={images.length <= 1}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Image */}
        <div className="relative max-w-full max-h-full">
          {fullImageUrl ? (
            <img
              src={fullImageUrl}
              alt={`Generation ${currentIndex + 1}`}
              className={`max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-50'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-96 h-96 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
              No Image Available
            </div>
          )}

          {/* Loading indicator */}
          {!imageLoaded && fullImageUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={goNext}
          className="absolute right-4 z-50 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next (→)"
          disabled={images.length <= 1}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="max-w-4xl mx-auto">
          {/* Counter */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-white text-lg font-semibold">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Details */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {currentImage.modelId && (
                <span className="px-3 py-1 bg-blue-500/80 rounded-full text-white text-sm">
                  Model: {currentImage.modelId}
                </span>
              )}
              {currentImage.pose && (
                <span className="px-3 py-1 bg-purple-500/80 rounded-full text-white text-sm">
                  Pose: {currentImage.pose}
                </span>
              )}
              {currentImage.provider && (
                <span className="px-3 py-1 bg-green-500/80 rounded-full text-white text-sm">
                  Provider: {currentImage.provider}
                </span>
              )}
            </div>

            {currentImage.prompt && (
              <p className="text-white/90 text-sm line-clamp-2 mt-2">
                {currentImage.prompt}
              </p>
            )}

            {currentImage.createdAt && (
              <p className="text-white/60 text-xs mt-2">
                Created: {new Date(currentImage.createdAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-[90%] overflow-x-auto py-2 px-4">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => {
                setImageLoaded(false);
                setCurrentIndex(index);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {image.imageUrl ? (
                <img
                  src={API_CONFIG.buildImageUrl(image.imageUrl)}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
                  {index + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageLightbox;
