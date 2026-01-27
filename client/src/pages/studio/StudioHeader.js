import React from 'react';
import { Image, Sparkles, History } from 'lucide-react';
import { useStudio } from '../../contexts/StudioContext';
import API_CONFIG from '../../config/api';

// ============================================
// STUDIO HEADER COMPONENT
// ============================================
// Header with logo and Generate/Gallery tabs

export function StudioHeader() {
  const { activeTab, setActiveTab, galleryItems } = useStudio();
  const galleryCount = galleryItems.length;

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
      badge: galleryCount > 0 ? galleryCount : null,
    },
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-center px-6 py-4 relative">
        {/* Logo - absolute left */}
        <div className="absolute left-6 flex items-center space-x-3">
          <img
            src={API_CONFIG.buildImageUrl('/try-on360-logo.png')}
            alt="Try-On 360"
            className="h-10 w-auto"
            onError={(e) => {
              // Fallback if logo fails
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback logo */}
          <div
            className="hidden items-center space-x-2"
            style={{ display: 'none' }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Image className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Try-On 360
            </span>
          </div>
        </div>

        {/* Tabs - centered */}
        <nav className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default StudioHeader;
