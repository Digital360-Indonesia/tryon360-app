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
    setGalleryItems,
    activeTab,
    setActiveTab,
    galleryItems,
  } = studio;

  // Check for auth token on mount
  const [isChecking, setIsChecking] = useState(true);

  // Store generate handler from GenerateTab to pass to StudioSidebar
  // Use useRef to avoid re-renders when function changes
  const generateHandlerRef = React.useRef(null);

  // Store the handler when ready
  const setGenerateHandler = React.useCallback((handler) => {
    console.log('🔄 Setting generateHandler:', {
      exists: !!handler,
      type: typeof handler
    });
    generateHandlerRef.current = handler;
    console.log('✅ generateHandler stored in ref');
  }, []);

  useEffect(() => {
    console.log('🔍 TryOnStudio: Checking auth...');
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    console.log('📦 Token:', token ? 'exists' : 'missing');
    console.log('👤 User:', userStr);

    const user = userStr ? JSON.parse(userStr) : {};

    if (!token) {
      console.log('❌ No token, redirecting to signup');
      navigate('/signup');
      return;
    }

    // Check if profile is complete (name is required)
    if (!user.name) {
      console.log('❌ No name in user, redirecting to profile');
      navigate('/profile');
      return;
    }

    console.log('✅ Auth check passed, user:', user.name);
    setIsChecking(false);

    // NOTE: Gallery items now loaded from database via GalleryTab
    // No need to load from localStorage anymore
    console.log('ℹ️ Gallery items will be loaded from database via GalleryTab');
  }, [navigate]);

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
        {/* Sidebar - always show on Generate tab, uses ref to avoid re-renders */}
        {activeTab === 'generate' && (
          <StudioSidebar
            onGenerate={() => {
              const handler = generateHandlerRef.current;
              if (handler) {
                console.log('✅ Calling generateHandler from ref');
                handler();
              } else {
                console.log('⚠️ Generate handler not ready in ref yet');
              }
            }}
          />
        )}

        {/* Canvas - shows GenerateTab or GalleryTab */}
        <StudioCanvas onGenerateReady={setGenerateHandler} />
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
