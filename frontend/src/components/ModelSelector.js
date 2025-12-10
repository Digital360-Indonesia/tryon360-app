import React, { useState, useEffect } from 'react';
import { User, Check } from 'lucide-react';
import api from '../services/api';
import API_CONFIG from '../config/api';

const ModelSelector = ({ selectedModel, onModelSelect, selectedPose, onPoseSelect }) => {
  const [models, setModels] = useState([]);
  const [poses, setPoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (selectedModel) {
      loadPosesForModel(selectedModel);
    }
  }, [selectedModel]);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/models');
      setModels(response.data.models);
      setError(null);
    } catch (err) {
      setError('Failed to load models');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPosesForModel = async (modelId) => {
    try {
      const response = await api.get(`/models/${modelId}/poses`);
      setPoses(response.data.poses);
    } catch (err) {
      console.error('Error loading poses:', err);
      setPoses([]);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Model</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadModels}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <User className="w-5 h-5 mr-2" />
        Select Model
      </h3>
      
      {/* Model Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {models.map((model) => (
          <div
            key={model.id}
            onClick={() => onModelSelect(model.id)}
            className={`
              relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
              ${selectedModel === model.id 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
            `}
          >
            {/* Selection indicator */}
            {selectedModel === model.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            
            {/* Model avatar */}
            <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md mb-3 overflow-hidden">
              {model.avatar ? (
                <img
                  src={API_CONFIG.buildImageUrl(model.avatar)}
                  alt={model.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    console.log('Failed to load model image:', model.avatar);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="w-full h-full flex items-center justify-center" style={{display: model.avatar ? 'none' : 'flex'}}>
                <User className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            
            {/* Model info */}
            <div>
              <h4 className="font-medium text-gray-900">{model.name}</h4>
              <p className="text-sm text-gray-600 capitalize">{model.type}</p>
              <p className="text-xs text-gray-500 mt-1">{model.description}</p>
              {model.isPrimary && (
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Primary
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pose Selection */}
      {selectedModel && poses.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Select Pose</h4>
          <div className="grid grid-cols-1 gap-2">
            {poses.map((pose) => (
              <div
                key={pose.id}
                onClick={() => onPoseSelect(pose.id)}
                className={`
                  cursor-pointer rounded-md border px-4 py-3 transition-all duration-150
                  ${selectedPose === pose.id
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pose.name}</p>
                    <p className="text-xs text-gray-600">{pose.description}</p>
                    {pose.requiresBackPhoto && (
                      <div className="mt-1 flex items-center text-xs text-orange-600">
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                        Back photo recommended
                      </div>
                    )}
                  </div>
                  {selectedPose === pose.id && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Details */}
      {selectedModel && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h5 className="font-medium text-gray-900 mb-2">Selected Model Details</h5>
          {(() => {
            const model = models.find(m => m.id === selectedModel);
            return (
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {model.name}</p>
                <p><span className="font-medium">Type:</span> {model.type}</p>
                <p><span className="font-medium">Available Poses:</span> {model.availablePoses.length}</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;