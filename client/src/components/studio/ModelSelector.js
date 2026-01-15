import React, { useState, useEffect } from 'react';
import { User, Edit2 } from 'lucide-react';
import api from '../../services/api';
import API_CONFIG from '../../config/api';
import ModelModal from './ModelModal';

// ============================================
// MODEL SELECTOR COMPONENT
// ============================================
// Small circular preview that opens modal on click

const ModelSelector = ({ selectedModel, onModelChange, models: propModels }) => {
  const [models, setModels] = useState(propModels || []);
  const [loading, setLoading] = useState(!propModels);
  const [showModal, setShowModal] = useState(false);

  // Fetch models if not provided as prop
  useEffect(() => {
    if (!propModels) {
      fetchModels();
    }
  }, [propModels]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/models');
      setModels(response.data.models || []);
    } catch (err) {
      console.error('Failed to load models:', err);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = (model) => {
    onModelChange(model);
    setShowModal(false);
  };

  // Get current model data
  const currentModel = typeof selectedModel === 'object' ? selectedModel : (models || []).find(m => m.id === selectedModel);
  const hasSelection = !!currentModel;

  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Model
        </label>

        {/* Circular Preview Button */}
        <button
          onClick={() => setShowModal(true)}
          className={`
            w-full flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200
            ${hasSelection
              ? 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          {/* Circular Preview */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden border-2 border-gray-200 shadow-sm">
              {hasSelection && (currentModel.avatar || currentModel.imageUrl) ? (
                <img
                  src={API_CONFIG.buildImageUrl(currentModel.avatar || currentModel.imageUrl)}
                  alt={currentModel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>

            {/* Edit Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
              <Edit2 className="w-3.5 h-3.5 text-gray-600" />
            </div>
          </div>

          {/* Model Info */}
          <div className="flex-1 text-left">
            {hasSelection ? (
              <>
                <h4 className="font-bold text-gray-900">{currentModel.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{currentModel.type || currentModel.gender}</p>
                {currentModel.isPrimary && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Primary
                  </span>
                )}
              </>
            ) : (
              <>
                <h4 className="font-bold text-gray-700">Choose a Model</h4>
                <p className="text-sm text-gray-500">Click to select from {loading ? '...' : (models?.length || 0)} models</p>
              </>
            )}
          </div>

          {/* Arrow */}
          <div className="text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Model Modal */}
      <ModelModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        models={models}
        selectedModelId={currentModel?.id}
        onSelect={handleSelectModel}
      />
    </>
  );
};

export default ModelSelector;
