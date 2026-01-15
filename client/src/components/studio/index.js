// ============================================
// STUDIO COMPONENTS - INDEX
// ============================================
// Central export point for all studio UI components

// Main Sidebar Container
export { default as StudioSidebar } from './StudioSidebar';

// Generate Tab Components
export { SelectedOptionsChips } from './SelectedOptionsChips';
export { AddOnsPrompt } from './AddOnsPrompt';
export { GeneratedPreview } from './GeneratedPreview';
export { AIProviderSelector } from './AIProviderSelector';

// Gallery Tab Components
export { GalleryGrid } from './GalleryGrid';
export { GalleryItem } from './GalleryItem';
export { GalleryFilters } from './GalleryFilters';

// Model & Pose Selection Components
// These only have default exports
export { default as ModelSelector } from './ModelSelector';
export { default as ModelModal } from './ModelModal';
export { default as PoseSelector } from './PoseSelector';

// Upload Components
// These only have default exports
export { default as GarmentUploader } from './GarmentUploader';
export { default as DetailsUploader } from './DetailsUploader';

// Additional default exports (for flexibility)
export { default as SelectedOptionsChipsDefault } from './SelectedOptionsChips';
export { default as AddOnsPromptDefault } from './AddOnsPrompt';
export { default as GeneratedPreviewDefault } from './GeneratedPreview';
export { default as AIProviderSelectorDefault } from './AIProviderSelector';
export { default as GalleryGridDefault } from './GalleryGrid';
export { default as GalleryItemDefault } from './GalleryItem';
export { default as GalleryFiltersDefault } from './GalleryFilters';
export { default as PoseSelectorDefault } from './PoseSelector';
