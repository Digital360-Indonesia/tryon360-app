import React, { useState } from 'react';
import { Cpu, User, Upload as UploadIcon, ChevronDown } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';
import { AIProviderSelector } from './AIProviderSelector';
import ModelSelector from './ModelSelector';
import PoseSelector from './PoseSelector';
import GarmentUploader from './GarmentUploader';
import DetailsUploader from './DetailsUploader';

// ============================================
// STUDIO SIDEBAR - TABBED VERSION
// ============================================

const TABS = [
  { id: 'provider', label: 'AI Provider', icon: Cpu },
  { id: 'model', label: 'Model & Pose', icon: User },
  { id: 'upload', label: 'Upload', icon: UploadIcon },
];

const StudioSidebar = ({ onGenerate }) => {
  const [activeTab, setActiveTab] = useState('provider');
  const {
    selectedModel,
    setSelectedModel,
    selectedPose,
    setSelectedPose,
    providerId,
    setProvider,
    uploads,
    setUpload,
    isGenerating,
    canGenerate,
  } = useStudio();

  const handleModelChange = (model) => {
    setSelectedModel(model);
  };

  const handleGarmentUpload = (file) => {
    setUpload('product', file);
  };

  const handleDetailsChange = (details) => {
    details.forEach((detail, index) => {
      const slotKey = `detail${index + 1}`;
      setUpload(slotKey, detail.file);
    });
  };

  const handleGenerateClick = () => {
    console.log('Generate clicked from sidebar');
    if (canGenerate && !isGenerating) {
      // Call the parent's onGenerate which will execute handleGenerate from GenerateTab
      onGenerate?.();
    } else {
      console.log('Cannot generate:', { canGenerate, isGenerating });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'provider':
        return (
          <AIProviderSelector
            selectedProvider={providerId}
            onProviderSelect={setProvider}
            onGenerate={handleGenerateClick}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
          />
        );

      case 'model':
        return (
          <div className="space-y-6">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
            />
            <PoseSelector
              selectedPose={selectedPose}
              onPoseChange={setSelectedPose}
            />
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <GarmentUploader
              onUpload={handleGarmentUpload}
              preview={uploads.product ? URL.createObjectURL(uploads.product) : null}
              isRequired={true}
            />
            <DetailsUploader
              details={[]}
              onDetailsChange={handleDetailsChange}
              maxSlots={3}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getTabStatus = (tabId) => {
    switch (tabId) {
      case 'provider':
        return !!providerId;
      case 'model':
        return !!selectedModel && !!selectedPose;
      case 'upload':
        return !!uploads.product;
      default:
        return false;
    }
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 bg-white">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isComplete = getTabStatus(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 relative px-3 py-3 text-xs font-medium border-b-2 transition-colors
                ${isActive
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title={tab.label}
            >
              <div className="flex flex-col items-center space-y-1">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {isComplete && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full absolute top-2 right-2" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderTabContent()}
      </div>

      {/* Generate Button Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleGenerateClick}
          disabled={!canGenerate || isGenerating}
          className={`
            w-full py-3 px-6 rounded-xl font-semibold text-white
            flex items-center justify-center gap-2
            transition-all duration-200
            ${canGenerate && !isGenerating
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <span>Generate Try-On</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {!canGenerate && !isGenerating && (
          <div className="mt-2 text-xs text-center text-gray-600">
            Complete: Provider • Model • Pose • Image
          </div>
        )}
      </div>
    </aside>
  );
};

export default StudioSidebar;
