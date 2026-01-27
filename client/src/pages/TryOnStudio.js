import React, { useEffect, useState } from 'react';
import { StudioProvider, useStudio } from '../contexts/StudioContext';
import { StudioSidebar, StudioCanvas } from './studio';
import { SharedHeader } from '../components/shared/SharedHeader';
import storageService from '../services/storage';
import { Sparkles, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================
// TRY ON STUDIO - MAIN PAGE
// ============================================

function TryOnStudioContent() {
  const navigate = useNavigate();
  const studio = useStudio();

  const {
    setGenerationResults,
    activeTab,
    setActiveTab,
    galleryItems,
  } = studio;

  // Check for auth token on mount
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user')) || {};

    if (!token) {
      navigate('/signup');
      return;
    }

    // Check if profile is complete (name is required)
    if (!user.name) {
      navigate('/profile');
      return;
    }

    setIsChecking(false);

    // Load saved history on mount
    const savedHistory = storageService.getGenerationHistory();
    if (savedHistory.length > 0) {
      setGenerationResults(savedHistory);
    }
  }, [navigate, setGenerationResults]);

  // Tabs config
  const tabs = [
    {
      id: 'generate',
      label: 'Generate',
      icon: Sparkles,
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: History,
      badge: galleryItems.length > 0 ? galleryItems.length : null,
    },
  ];

  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Shared Header */}
      <SharedHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        showProfileDropdown={true}
      />

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
