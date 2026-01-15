import React, { useEffect, useCallback } from 'react';
import { BarChart3, Trash2, History } from 'lucide-react';
import { StudioProvider, useStudio } from '../contexts/StudioContext';
import { StudioSidebar, StudioCanvas } from './studio';
import storageService from '../services/storage';

// ============================================
// TRY ON STUDIO - MAIN PAGE
// ============================================
// Adobe Firefly-inspired design with tabs
// FRONTEND ONLY - Uses existing backend API

function TryOnStudioContent() {
  const studio = useStudio();

  const {
    setGenerationResults,
    setCurrentResult,
    activeTab,
    setActiveTab,
  } = studio;

  // Load saved history on mount
  useEffect(() => {
    const savedHistory = storageService.getGenerationHistory();
    if (savedHistory.length > 0) {
      setGenerationResults(savedHistory);
    }
  }, [setGenerationResults]);

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    if (window.confirm('Clear all saved history?')) {
      storageService.clearGenerationHistory();
      setGenerationResults([]);
      setCurrentResult(null);
    }
  }, [setGenerationResults, setCurrentResult]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/try-on360-logo.png"
              alt="Try-On 360"
              className="h-10 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback logo */}
            <div
              className="hidden items-center space-x-2"
              style={{ display: 'none' }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">360</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Try-On 360
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'generate'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                activeTab === 'gallery'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Gallery
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => (window.location.href = '/logs')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Generation Logs"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => (window.location.href = '/history')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Generation History"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearHistory}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear Local History"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">v2.6</p>
              <p className="text-xs text-gray-500">Studio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only show on Generate tab */}
        {activeTab === 'generate' && <StudioSidebar />}

        {/* Canvas - shows GenerateTab or GalleryTab */}
        <StudioCanvas />
      </div>
    </div>
  );
}

// Main component with provider
const TryOnStudio = () => {
  return (
    <StudioProvider>
      <TryOnStudioContent />
    </StudioProvider>
  );
};

export default TryOnStudio;
