import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { apiMethods } from '../../services/api';

// ============================================
// GALLERY FILTERS COMPONENT
// ============================================
// Filter controls for gallery
// Uses backend API endpoints for models and providers

export function GalleryFilters({
  filters = {},
  onFilterChange,
  totalCount = 0
}) {
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  // Fetch available models on mount
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [modelsData, providersData] = await Promise.all([
          apiMethods.getModels(),
          apiMethods.getProviders()
        ]);
        setModels(modelsData.models || []);
        setProviders(providersData.providers || []);
      } catch (error) {
        console.error('Failed to fetch filters data:', error);
      }
    };
    fetchFiltersData();
  }, []);

  // Handle model filter change
  const handleModelChange = (e) => {
    onFilterChange({ ...filters, modelId: e.target.value || undefined });
  };

  // Handle provider filter change
  const handleProviderChange = (e) => {
    onFilterChange({ ...filters, provider: e.target.value || undefined });
  };

  // Handle sort change
  const handleSortChange = (e) => {
    onFilterChange({ ...filters, sort: e.target.value });
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({ ...filters, search: searchQuery || undefined });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Format model name for display
  const formatModelName = (modelId) => {
    return modelId
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()) || modelId;
  };

  // Format provider name for display
  const formatProviderName = (providerId) => {
    return providerId
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()) || providerId;
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gallery</h2>
          <p className="text-gray-600">
            {totalCount} {totalCount === 1 ? 'generation' : 'generations'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by model, pose, or provider..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Model Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filters.modelId || ''}
            onChange={handleModelChange}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
          >
            <option value="">All Models</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {formatModelName(model.name || model.id)}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Filter */}
        <select
          value={filters.provider || ''}
          onChange={handleProviderChange}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
        >
          <option value="">All Providers</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {formatProviderName(provider.name || provider.id)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort || 'newest'}
          onChange={handleSortChange}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>
    </div>
  );
}

export default GalleryFilters;
