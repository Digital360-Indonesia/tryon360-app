import React from 'react';
import { GenerateTab } from './GenerateTab';
import { GalleryTab } from './GalleryTab';
import { useStudio } from '../../contexts/StudioContext';

// ============================================
// STUDIO CANVAS COMPONENT
// ============================================
// Main canvas area with tab switching

export function StudioCanvas({ onGenerateReady }) {
  const { activeTab } = useStudio();

  return (
    <main className="flex-1 overflow-hidden bg-gray-50">
      {activeTab === 'generate' && <GenerateTab onGenerateReady={onGenerateReady} />}
      {activeTab === 'gallery' && <GalleryTab />}
    </main>
  );
}

export default StudioCanvas;
