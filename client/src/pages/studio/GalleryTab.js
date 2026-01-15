import React, { useState, useEffect, useCallback } from 'react';
import { apiMethods } from '../../services/api';
import { GalleryGrid } from '../../components/studio/GalleryGrid';
import { GalleryFilters } from '../../components/studio/GalleryFilters';

// ============================================
// GALLERY TAB COMPONENT
// ============================================
// Display all generated images from backend API
// Fetches from GET /api/generation/history

export function GalleryTab() {
  const [generations, setGenerations] = useState([]);
  const [filters, setFilters] = useState({ sort: 'newest' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch history from backend API
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        limit: filters.limit || 20,
      };

      const response = await apiMethods.getGenerationHistory(params);

      if (response.success) {
        setGenerations(response.data);
        setPagination(response.pagination || {});
      } else {
        setError('Failed to load gallery');
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError(err.message || 'Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Load data on mount and filter changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to page 1 when filters change
    }));
  };

  // Handle item click (open detail view/modal)
  const handleItemClick = (generation) => {
    console.log('Clicked generation:', generation);
    // TODO: Open modal or navigate to detail view
    // Could use StudioContext to set selectedGeneration and show modal
  };

  // Handle load more pagination
  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      setFilters((prev) => ({ ...prev, page: pagination.page + 1 }));
    }
  };

  // Error state
  if (error && !isLoading && generations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Gallery
            </h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <GalleryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        totalCount={pagination.total || 0}
      />

      {/* Grid */}
      <GalleryGrid
        generations={generations}
        onItemClick={handleItemClick}
        isLoading={isLoading && generations.length === 0}
      />

      {/* Load More Button */}
      {!isLoading && generations.length > 0 && pagination.page < pagination.pages && (
        <div className="p-6 text-center border-t border-gray-200 bg-white">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More ({pagination.total - generations.length} remaining)
          </button>
        </div>
      )}

      {/* Loading more indicator */}
      {isLoading && generations.length > 0 && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading more...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default GalleryTab;
