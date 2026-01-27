import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import api from '../../services/api';

// ============================================
// AI PROVIDER SELECTOR COMPONENT
// ============================================
// Tier-based selection with star icons

// Star icon component
const StarIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
  </svg>
);

// Provider display config
const PROVIDER_CONFIG = {
  'gemini_2_5_flash_image': {
    name: 'Basic',
    stars: 1,
    description: 'Fast and efficient generation',
  },
  'nano_banana': {
    name: 'Premium',
    stars: 2,
    description: 'Premium quality with advanced features',
  }
};

// Default providers - only 2 Gemini providers with tier names
const DEFAULT_PROVIDERS = [
  {
    id: 'gemini_2_5_flash_image',
    name: 'Basic',
    description: 'Fast and efficient generation',
    stars: 1,
  },
  {
    id: 'nano_banana',
    name: 'Premium',
    description: 'Premium quality with advanced features',
    stars: 2,
  }
];

export function AIProviderSelector({
  selectedProvider,
  onProviderSelect,
  className = ''
}) {
  const [providers, setProviders] = useState(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/generation/providers');
      if (response.data?.providers) {
        // Filter to only include our 2 Gemini providers
        const geminiProviders = response.data.providers.filter(
          p => p.id === 'gemini_2_5_flash_image' || p.id === 'nano_banana'
        );
        if (geminiProviders.length > 0) {
          setProviders(geminiProviders.map(p => {
            const config = PROVIDER_CONFIG[p.id] || PROVIDER_CONFIG['gemini_2_5_flash_image'];
            return {
              id: p.id,
              name: config.name,
              description: config.description,
              stars: config.stars
            };
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (providerId) => {
    onProviderSelect?.(providerId);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        AI Provider
      </label>

      <div className="space-y-2">
        {providers.map((provider) => {
          const isSelected = provider.id === selectedProvider;

          return (
            <button
              key={provider.id}
              onClick={() => handleProviderSelect(provider.id)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isSelected
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                {/* Left: Stars + Name */}
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  {/* Star Icons */}
                  <div className={`flex space-x-0.5 flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
                    {[...Array(provider.stars)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${isSelected ? 'text-yellow-500' : 'text-yellow-400'}`}
                      />
                    ))}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      )}
                      <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {provider.name}
                      </h4>
                    </div>
                    {/* Description - show on hover or when selected */}
                    <p className={`text-xs text-gray-500 mt-0.5 transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      {provider.description}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AIProviderSelector;
