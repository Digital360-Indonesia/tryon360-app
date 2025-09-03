import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Clock, DollarSign, Play, Loader2 } from 'lucide-react';
import api from '../services/api';

const GenerationPanel = ({ 
  selectedModel, 
  selectedPose, 
  uploads, 
  onGenerate, 
  isGenerating,
  generationProgress 
}) => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('flux_kontext');
  const [garmentDescription, setGarmentDescription] = useState('');
  const [embroideryDetails, setEmbroideryDetails] = useState({
    detail1: { position: 'chest_left', description: '' },
    detail2: { position: 'chest_center', description: '' },
    detail3: { position: 'back_center', description: '' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/generation/providers');
      setProviders(response.data.providers);
      
      // Set default provider to first active one
      const activeProvider = response.data.providers.find(p => p.status === 'active');
      if (activeProvider) {
        setSelectedProvider(activeProvider.id);
      }
    } catch (err) {
      console.error('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate()) return;

    const generationData = {
      modelId: selectedModel,
      pose: selectedPose,
      providerId: selectedProvider,
      garmentDescription,
      embroideryDetails: Object.entries(embroideryDetails)
        .filter(([key, detail]) => uploads[key] && detail.description.trim())
        .map(([key, detail]) => ({
          position: detail.position,
          description: detail.description
        }))
    };

    onGenerate(generationData, uploads);
  };

  const canGenerate = () => {
    return selectedModel && 
           selectedPose && 
           uploads.product && 
           selectedProvider && 
           !isGenerating;
  };

  const getProviderIcon = (providerId) => {
    switch (providerId) {
      case 'flux_kontext': return Zap;
      case 'chatgpt_image': return Cpu;
      case 'gemini_flash': return Clock;
      default: return Cpu;
    }
  };

  const getProviderCost = (providerId) => {
    const costs = {
      flux_kontext: '$0.045',
      chatgpt_image: '$0.080',
      gemini_flash: '$0.030'
    };
    return costs[providerId] || '$0.050';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Cpu className="w-5 h-5 mr-2" />
        Generation Settings
      </h3>

      <div className="space-y-6">
        {/* AI Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            AI Provider
          </label>
          <div className="grid grid-cols-1 gap-3">
            {providers.map((provider) => {
              const IconComponent = getProviderIcon(provider.id);
              const isSelected = selectedProvider === provider.id;
              const isAvailable = provider.status === 'active' && provider.hasApiKey;
              
              return (
                <div
                  key={provider.id}
                  onClick={() => isAvailable && setSelectedProvider(provider.id)}
                  className={`
                    relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${isSelected && isAvailable
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : isAvailable
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{provider.name}</h4>
                        <p className="text-xs text-gray-600">{provider.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{getProviderCost(provider.id)}</p>
                      <p className="text-xs text-gray-500">per generation</p>
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${provider.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : provider.status === 'coming_soon'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                      {provider.status.replace('_', ' ')}
                    </span>
                    
                    {provider.supportsImageInput && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Image Input
                      </span>
                    )}
                    
                    {!provider.hasApiKey && provider.status === 'active' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        No API Key
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Garment Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Garment Description (Optional)
          </label>
          <textarea
            value={garmentDescription}
            onChange={(e) => setGarmentDescription(e.target.value)}
            placeholder="e.g., Navy blue cotton t-shirt with regular fit..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to auto-detect from uploaded product image
          </p>
        </div>

        {/* Embroidery Details */}
        {(uploads.detail1 || uploads.detail2 || uploads.detail3) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Embroidery Details
            </label>
            <div className="space-y-3">
              {['detail1', 'detail2', 'detail3'].map(detailKey => 
                uploads[detailKey] && (
                  <div key={detailKey} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={URL.createObjectURL(uploads[detailKey])}
                        alt={`${detailKey} preview`}
                        className="w-12 h-12 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={embroideryDetails[detailKey].description}
                          onChange={(e) => setEmbroideryDetails({
                            ...embroideryDetails,
                            [detailKey]: {
                              ...embroideryDetails[detailKey],
                              description: e.target.value
                            }
                          })}
                          placeholder="e.g., Company logo, Text embroidery..."
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <select
                        value={embroideryDetails[detailKey].position}
                        onChange={(e) => setEmbroideryDetails({
                          ...embroideryDetails,
                          [detailKey]: {
                            ...embroideryDetails[detailKey],
                            position: e.target.value
                          }
                        })}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="chest_left">Chest Left</option>
                        <option value="chest_center">Chest Center</option>
                        <option value="chest_right">Chest Right</option>
                        <option value="back_center">Back Center</option>
                        <option value="sleeve">Sleeve</option>
                      </select>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <div className="border border-blue-200 rounded-md p-4 bg-blue-50">
            <div className="flex items-center space-x-3 mb-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <h5 className="font-medium text-blue-900">Generating Try-On Image</h5>
            </div>
            
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress.progress || 0}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-blue-700">
              {generationProgress.stage || 'Preparing generation...'}
            </p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate()}
          className={`
            w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-md font-medium transition-all duration-200
            ${canGenerate()
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Generate Try-On</span>
            </>
          )}
        </button>

        {/* Requirements Check */}
        {!canGenerate() && !isGenerating && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <h5 className="font-medium text-yellow-800 mb-2">Requirements</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              {!selectedModel && <li>• Select a model</li>}
              {!selectedPose && <li>• Choose a pose</li>}
              {!uploads.product && <li>• Upload product image</li>}
              {!selectedProvider && <li>• Select AI provider</li>}
            </ul>
          </div>
        )}

        {/* Cost Estimate */}
        {canGenerate() && (
          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Estimated Cost:</span>
              <span className="font-medium text-gray-900 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                {getProviderCost(selectedProvider)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationPanel;