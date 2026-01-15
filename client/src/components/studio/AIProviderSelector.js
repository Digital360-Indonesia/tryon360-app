import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, Check } from 'lucide-react';
import api from '../../services/api';

// ============================================
// AI PROVIDER SELECTOR COMPONENT
// ============================================
// Compact provider selection with icons

// Provider icons mapping
const PROVIDER_ICONS = {
  'flux_kontext': '/flux_icon.svg',
  'gemini_2_5_flash_image': '/gemini_icon.png',
  'nano_banana': '/gemini_icon.png',
  'imagen_4_ultra': '/imagen_icon.png',
};

// Default providers as fallback
const DEFAULT_PROVIDERS = [
  {
    id: 'gemini_2_5_flash_image',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and affordable generation',
    cost: 0.002,
    avgTime: 15,
    tier: 'free'
  },
  {
    id: 'flux_kontext',
    name: 'Flux Kontext',
    description: 'High quality with context awareness',
    cost: 0.005,
    avgTime: 20,
    tier: 'standard'
  },
  {
    id: 'imagen_4_ultra',
    name: 'Imagen 4 Ultra',
    description: 'Premium quality output',
    cost: 0.015,
    avgTime: 30,
    tier: 'premium'
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
        setProviders(response.data.providers);
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
          const iconSrc = PROVIDER_ICONS[provider.id];

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
                {/* Left: Icon + Name */}
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  {/* Provider Icon */}
                  <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-white' : 'bg-gray-100'
                  }`}>
                    {iconSrc ? (
                      iconSrc.endsWith('.svg') ? (
                        <img src={iconSrc} alt={provider.name} className="w-6 h-6" />
                      ) : (
                        <img src={iconSrc} alt={provider.name} className="w-8 h-8 rounded" />
                      )
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded"></div>
                    )}
                  </div>

                  {/* Name + Check + Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5">
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      )}
                      <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {provider.name}
                      </h4>
                    </div>
                    {/* Description - only show on hover */}
                    <p className="text-xs text-gray-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      {provider.description}
                    </p>
                  </div>
                </div>

                {/* Right: Cost + Time */}
                <div className="flex items-center space-x-3 text-xs flex-shrink-0">
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-3 h-3" />
                    <span>${provider.cost?.toFixed(3) || '0.002'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{provider.avgTime || 15}s</span>
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
