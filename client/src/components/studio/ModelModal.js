import React, { useState } from 'react';
import { X, User, Check } from 'lucide-react';
import API_CONFIG from '../../config/api';

// ============================================
// MODEL CATEGORIES
// ============================================
const MODEL_CATEGORIES = [
  { id: 'all', label: 'All Models', icon: User },
  { id: 'male', label: 'Male', icon: User },
  { id: 'female', label: 'Female', icon: User },
];

// ============================================
// MODEL MODAL COMPONENT
// ============================================
// Fullscreen modal for model selection with categories

const ModelModal = ({ isOpen, onClose, models, selectedModelId, onSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Filter models by category (using 'type' field from backend)
  const filteredModels = selectedCategory === 'all'
    ? models
    : models.filter(model => model.type === selectedCategory);

  // Group models by category for display
  const groupedModels = selectedCategory === 'all'
    ? [
        { category: 'Male', models: models.filter(m => m.type === 'male') },
        { category: 'Female', models: models.filter(m => m.type === 'female') },
      ].filter(g => g.models.length > 0)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Model</h2>
            <p className="text-sm text-gray-600 mt-1">Choose a model for your try-on generation</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
          {MODEL_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            const count = category.id === 'all'
              ? models.length
              : models.filter(m => m.type === category.id).length;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Model Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedCategory === 'all' ? (
            // Show grouped by category
            groupedModels.map((group) => (
              <div key={group.category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {group.category} Models
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {group.models.map((model) => {
                    const isSelected = selectedModelId === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => onSelect(model)}
                        className={`
                          relative group cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }
                        `}
                      >
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        )}

                        {/* Model Image */}
                        <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-3">
                          {model.avatar || model.imageUrl ? (
                            <img
                              src={API_CONFIG.buildImageUrl(model.avatar || model.imageUrl)}
                              alt={model.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full items-center justify-center" style={{ display: (model.avatar || model.imageUrl) ? 'none' : 'flex' }}>
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>

                        {/* Model Info */}
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{model.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            {model.isPrimary && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Primary
                              </span>
                            )}
                            {model.availablePoses && (
                              <span className="text-xs text-gray-500">
                                {model.availablePoses.length} poses
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            // Show filtered models
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredModels.map((model) => {
                const isSelected = selectedModelId === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => onSelect(model)}
                    className={`
                      relative group cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }
                    `}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Model Image */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden mb-3">
                      {model.avatar || model.imageUrl ? (
                        <img
                          src={API_CONFIG.buildImageUrl(model.avatar || model.imageUrl)}
                          alt={model.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full items-center justify-center" style={{ display: (model.avatar || model.imageUrl) ? 'none' : 'flex' }}>
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    </div>

                    {/* Model Info */}
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{model.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {model.isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Primary
                          </span>
                        )}
                        {model.availablePoses && (
                          <span className="text-xs text-gray-500">
                            {model.availablePoses.length} poses
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredModels.length === 0 && (
            <div className="text-center py-16">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No models in this category</p>
              <p className="text-gray-400 text-sm mt-1">Try selecting a different category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelModal;
