import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Download,
  RefreshCw,
  Share2,
  Loader2,
  XCircle,
  ZoomIn,
  Check
} from 'lucide-react';

// ============================================
// GENERATED PREVIEW COMPONENT
// ============================================
// Displays generated image with actions (download, regenerate, share)
// Supports 4 states: Empty, Generating, Success, Error

export function GeneratedPreview({
  imageUrl = null,
  isGenerating = false,
  generationData = null,
  error = null,
  onRegenerate,
  onDownload,
  onShare,
  onClear
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const imageRef = useRef(null);

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Handle download
  const handleDownload = async () => {
    if (!imageUrl) return;

    setDownloadLoading(true);
    try {
      // Create a temporary link to download
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `tryon-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownload?.(imageUrl);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!imageUrl) return;

    // Try Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Try-On Result',
          text: 'Check out my AI-generated try-on!',
          url: imageUrl
        });
        onShare?.();
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Share failed:', err);
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      onShare?.();
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Handle regenerate
  const handleRegenerate = () => {
    setImageLoaded(false);
    onRegenerate?.();
  };

  // Handle clear
  const handleClear = () => {
    setImageLoaded(false);
    onClear?.();
  };

  // ==================== EMPTY STATE ====================
  if (!isGenerating && !imageUrl && !error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to Generate
          </h3>
          <p className="text-gray-600 text-sm">
            Complete the steps in the sidebar: select a model, choose a pose, upload your product, and click generate.
          </p>
        </div>
      </div>
    );
  }

  // ==================== GENERATING STATE ====================
  if (isGenerating) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          {/* Animated loader */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            {/* Animated ring */}
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            {/* Inner pulse */}
            <div className="absolute inset-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-pulse" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Generating Your Try-On...
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {generationData?.progress?.stage || 'AI is working its magic'}
          </p>

          {/* Progress bar */}
          {generationData?.progress?.progress !== undefined && (
            <div className="w-full max-w-xs mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(generationData.progress.progress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {generationData.progress.progress}%
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4">
            This usually takes 15-30 seconds
          </p>
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Generation Failed
          </h3>
          <p className="text-red-700 text-sm mb-4">
            {typeof error === 'string' ? error : error.message || 'Something went wrong'}
          </p>
          <button
            onClick={handleRegenerate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==================== SUCCESS STATE ====================
  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="relative group">
          {/* Main Image */}
          <div
            className={`
              relative bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200
              transition-all duration-200
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 300px)' }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Generated try-on result"
              className="max-w-full max-h-full object-contain"
              onLoad={handleImageLoad}
              onError={() => setImageLoaded(true)}
            />

            {/* Zoom button overlay */}
            <button
              onClick={() => setShowZoomModal(true)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={downloadLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {downloadLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download
        </button>

        {/* Regenerate */}
        <button
          onClick={handleRegenerate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium relative"
        >
          {copiedToClipboard ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <XCircle className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Generation Metadata */}
      {generationData && (
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-4 px-4 py-2 bg-gray-100 rounded-lg text-xs">
            {generationData.provider && (
              <span className="text-gray-600">
                <span className="font-medium">Provider:</span> {generationData.provider}
              </span>
            )}
            {generationData.metadata?.processingTime && (
              <span className="text-gray-600">
                <span className="font-medium">Time:</span> {(generationData.metadata.processingTime / 1000).toFixed(1)}s
              </span>
            )}
            {generationData.metadata?.cost && (
              <span className="text-gray-600">
                <span className="font-medium">Cost:</span> ${generationData.metadata.cost.toFixed(3)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {showZoomModal && imageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowZoomModal(false)}
        >
          <button
            onClick={() => setShowZoomModal(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <img
            src={imageUrl}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default GeneratedPreview;
