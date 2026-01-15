# TryOnStudio - Props Interfaces Documentation

## FRONTEND ONLY - NO BACKEND MODIFICATIONS

This document defines all component props interfaces for the redesigned TryOnStudio page.

---

## 📦 CONTEXT API: StudioContext

### Provider Props
```typescript
interface StudioProviderProps {
  children: React.ReactNode;
}
```

### Context Value (useStudio hook return)
```typescript
interface StudioContextValue {
  // ===== STATE =====
  // Tab State
  activeTab: 'generate' | 'gallery';

  // Model Selection
  selectedModel: ModelId | null;
  selectedPose: PoseId | null;

  // Upload State
  uploads: {
    product: File | null;
    detail1: File | null;
    detail2: File | null;  // disabled in v2.6
    detail3: File | null;  // disabled in v2.6
  };

  // Detail Configuration
  detailConfigs: {
    detail1: { position: string; description: string };
    detail2: { position: string; description: string };
    detail3: { position: string; description: string };
  };

  // AI Generation Settings
  providerId: ProviderId;
  garmentDescription: string;
  smartAddons: string;

  // Generation State
  isGenerating: boolean;
  generationProgress: {
    stage: string;
    progress: number; // 0-100
  };
  currentResult: GenerationResult | null;

  // Gallery/History State
  galleryItems: GenerationResult[];
  galleryFilter: ModelId | 'all';

  // UI State
  showModelModal: boolean;
  showPoseModal: boolean;
  sidebarSection: 'model' | 'pose' | 'upload' | 'details' | 'ai';

  // ===== ACTIONS =====
  setActiveTab: (tab: 'generate' | 'gallery') => void;

  setSelectedModel: (modelId: ModelId) => void;
  setSelectedPose: (poseId: PoseId) => void;
  showModelModal: (show: boolean) => void;
  showPoseModal: (show: boolean) => void;

  setUpload: (slot: UploadSlot, file: File) => void;
  removeUpload: (slot: UploadSlot) => void;
  clearUploads: () => void;

  setDetailConfig: (detail: DetailSlot, config: { position?: string; description?: string }) => void;

  setProvider: (providerId: ProviderId) => void;
  setGarmentDescription: (description: string) => void;
  setSmartAddons: (addons: string) => void;

  startGeneration: () => void;
  updateGenerationProgress: (progress: { stage: string; progress: number }) => void;
  completeGeneration: (result: GenerationResult) => void;
  failGeneration: () => void;
  setCurrentResult: (result: GenerationResult | null) => void;

  setGalleryItems: (items: GenerationResult[]) => void;
  addGalleryItem: (item: GenerationResult) => void;
  setGalleryFilter: (filter: ModelId | 'all') => void;

  setSidebarSection: (section: SidebarSection) => void;
  resetGenerationState: () => void;

  // ===== COMPUTED =====
  canGenerate: boolean;
  hasUploads: boolean;
  uploadCount: number;
  activeDetailUploads: Array<{ key: string; file: File }>;
  filteredGalleryItems: GenerationResult[];
}
```

---

## 📄 PAGE COMPONENTS

### StudioHeader
```typescript
// NO PROPS - Uses useStudio() hook
export function StudioHeader();
```

### StudioSidebar
```typescript
interface StudioSidebarProps {
  children: React.ReactNode; // Sidebar content based on active section
}
```

### StudioCanvas
```typescript
// NO PROPS - Uses useStudio() hook to switch between tabs
export function StudioCanvas();
```

### GenerateTab
```typescript
// NO PROPS - Uses useStudio(), useGeneration(), useGallery() hooks
export function GenerateTab();
```

### GalleryTab
```typescript
// NO PROPS - Uses useStudio(), useGallery() hooks
export function GalleryTab();
```

---

## 🎨 STUDIO COMPONENTS (To Be Created)

### ModelSelector
```typescript
interface ModelSelectorProps {
  selectedModel: ModelId | null;
  onModelSelect: (modelId: ModelId) => void;
  selectedPose: PoseId | null;
  onPoseSelect: (poseId: PoseId) => void;
  // Optional: Show/hide pose selection
  showPoses?: boolean;
  // Optional: Filter models by type
  modelType?: 'male' | 'female' | 'all';
}
```

### ModelModal (Fullscreen Model Selection)
```typescript
interface ModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (modelId: ModelId) => void;
  currentSelection?: ModelId | null;
}
```

### PoseSelector
```typescript
interface PoseSelectorProps {
  modelId: ModelId;
  selectedPose: PoseId | null;
  onPoseSelect: (poseId: PoseId) => void;
  // Optional: Grid layout
  layout?: 'grid' | 'list';
}
```

### GarmentUploader
```typescript
interface GarmentUploaderProps {
  upload: File | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  // Optional: Max file size
  maxSize?: number; // in bytes
  // Optional: Accepted formats
  accept?: string; // e.g., "image/jpeg,image/png"
}
```

### DetailsUploader
```typescript
interface DetailsUploaderProps {
  uploads: {
    detail1: File | null;
    detail2: File | null;
    detail3: File | null;
  };
  onUpload: (slot: 'detail1' | 'detail2' | 'detail3', file: File) => void;
  onRemove: (slot: 'detail1' | 'detail2' | 'detail3') => void;
  detailConfigs: {
    detail1: { position: string; description: string };
    detail2: { position: string; description: string };
    detail3: { position: string; description: string };
  };
  onConfigChange: (slot: string, config: { position?: string; description?: string }) => void;
}
```

### AIProviderSelector
```typescript
interface AIProviderSelectorProps {
  selectedProvider: ProviderId;
  onProviderSelect: (providerId: ProviderId) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}
```

### SelectedOptionsChips
```typescript
interface SelectedOptionsChipsProps {
  modelId: ModelId | null;
  poseId: PoseId | null;
  uploadCount: number;
  // Optional: On chip click to edit
  onEditModel?: () => void;
  onEditPose?: () => void;
}
```

### AddOnsPrompt
```typescript
interface AddOnsPromptProps {
  value: string;
  onChange: (value: string) => void;
  // Optional: Placeholder text
  placeholder?: string;
  // Optional: Max length
  maxLength?: number;
}
```

### GeneratedPreview
```typescript
interface GeneratedPreviewProps {
  result: GenerationResult | null;
  isGenerating: boolean;
  progress: { stage: string; progress: number };
  onDownload: (imageUrl: string) => void;
  onNew: () => void;
}
```

### GalleryGrid
```typescript
interface GalleryGridProps {
  items: GenerationResult[];
  onItemClick: (item: GenerationResult) => void;
  onItemDownload: (item: GenerationResult) => void;
  // Optional: Grid columns
  columns?: 2 | 3 | 4;
}
```

---

## 🪝 HOOKS

### useGeneration
```typescript
interface UseGenerationReturn {
  generateTryOn: (data: GenerationData, files: Uploads) => Promise<GenerationResponse>;
  getJobStatus: (jobId: string) => Promise<JobStatusResponse>;
  cancelJob: (jobId: string) => Promise<CancelResponse>;
  saveGeneration: (result: GenerationResult) => boolean;
  saveGenerationLog: (log: GenerationLog) => boolean;
}

// NO PARAMS - Uses existing API methods
function useGeneration(): UseGenerationReturn;
```

### useGallery
```typescript
interface UseGalleryReturn {
  loadGallery: () => GenerationResult[];
  loadGalleryOnMount: () => GenerationResult[];
  addToGallery: (result: GenerationResult) => GenerationResult;
  clearGallery: () => boolean;
  deleteItem: (itemId: string) => boolean;
  filterByModel: (items: GenerationResult[], modelId: ModelId | 'all') => GenerationResult[];
  getGalleryModels: (items: GenerationResult[]) => ModelId[];
  getGalleryStats: (items: GenerationResult[]) => GalleryStats;
}

// NO PARAMS - Uses localStorage
function useGallery(): UseGalleryReturn;
```

### useStudioState
```typescript
interface UseStudioStateReturn extends StudioContextValue {
  // Additional helper methods
  selectModel: (modelId: ModelId) => void;
  selectPose: (poseId: PoseId) => void;
  handleUpload: (slot: UploadSlot, file: File) => void;
  handleRemoveUpload: (slot: UploadSlot) => void;
  prepareGenerationData: () => GenerationData;
  resetForNewGeneration: () => void;
  goToSection: (section: SidebarSection) => void;
  switchTab: (tab: 'generate' | 'gallery') => void;
  getValidationError: () => string | null;
  getProgressSteps: () => ProgressStep[];
  getSelectedModelInfo: () => ModelInfo | null;
}

// NO PARAMS - Wraps useStudio() with convenience methods
function useStudioState(): UseStudioStateReturn;
```

---

## 📋 TYPE DEFINITIONS

### Model IDs
```typescript
type ModelId =
  | 'gunawan'  // Male, primary
  | 'paul'     // Male
  | 'johny'    // Male
  | 'rachma'   // Female, primary
  | 'louise'   // Female
  | 'jennie';  // Female
```

### Pose IDs
```typescript
type PoseId =
  | 'professional_standing'
  | 'arms_crossed'
  | 'hands_on_hips'
  | 'hands_in_pockets'
  | 'one_hand_on_hip'
  | 'hands_clasped'
  | 'arms_at_sides'
  | 'casual_standing'
  | 'casual_confident'
  | 'look_over_shoulder'
  | 'side_flex';
```

### Provider IDs
```typescript
type ProviderId =
  | 'flux_kontext'
  | 'gemini_2_5_flash_image'
  | 'nano_banana'
  | 'imagen_4_ultra';
```

### Upload Slots
```typescript
type UploadSlot = 'product' | 'detail1' | 'detail2' | 'detail3';
type DetailSlot = 'detail1' | 'detail2' | 'detail3';
```

### Sidebar Sections
```typescript
type SidebarSection = 'model' | 'pose' | 'upload' | 'details' | 'ai';
```

### Generation Result
```typescript
interface GenerationResult {
  id: string;
  imageUrl: string;
  imagePath: string;
  provider: ProviderId;
  prompt: string;
  metadata: {
    modelId: ModelId;
    pose: PoseId;
    cost?: number;
    processingTime?: number;
  };
  generatedAt: string;
  savedAt: string;
}
```

### Generation Data (for API)
```typescript
interface GenerationData {
  modelId: ModelId;
  pose: PoseId;
  providerId: ProviderId;
  garmentDescription: string;
  embroideryDetails?: Array<{
    position: string;
    description: string;
  }>;
}
```

---

## 🔗 EXISTING BACKEND API (DO NOT MODIFY)

These endpoints are already implemented - just use them:

```typescript
// GET /api/models
interface GetModelsResponse {
  success: boolean;
  models: ModelInfo[];
}

// GET /api/models/:modelId/poses
interface GetModelPosesResponse {
  success: boolean;
  poses: PoseInfo[];
}

// POST /api/generation/try-on
interface GenerateTryOnRequest {
  modelId: ModelId;
  pose: PoseId;
  providerId: ProviderId;
  garmentDescription: string;
  // + FormData with images
}

interface GenerateTryOnResponse {
  success: boolean;
  jobId: string;
  result?: GenerationResult;
  error?: string;
  processingTime?: number;
}

// GET /api/generation/status/:jobId
interface GetJobStatusResponse {
  success: boolean;
  job: {
    jobId: string;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    imageUrl?: string;
    error?: string;
  };
}

// GET /api/generation/providers
interface GetProvidersResponse {
  success: boolean;
  providers: ProviderInfo[];
}

// GET /api/generation/history
interface GetHistoryResponse {
  success: boolean;
  data: GenerationResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

---

## 📝 NOTES FOR OTHER CLIs

### ⚠️ CRITICAL REMINDERS

1. **BACKEND IS OFF-LIMITS**
   - DO NOT modify server.js
   - DO NOT modify src/ (backend source)
   - DO NOT modify API routes
   - DO NOT modify database
   - DO NOT modify .env

2. **ONLY WORK IN client/ FOLDER**
   - client/src/pages/
   - client/src/components/
   - client/src/contexts/
   - client/src/hooks/
   - client/src/services/ (only frontend services)

3. **USE EXISTING API**
   - Import from '../services/api'
   - Do not create new API endpoints
   - Do not modify request/response formats

4. **FOLLOW THE ARCHITECTURE**
   - Use StudioContext for state management
   - Use custom hooks for API calls
   - Components should be mostly presentational
   - Keep business logic in hooks/services

---

## 🚀 NEXT STEPS

Remaining components to create in `client/src/components/studio/`:

1. **ModelModal.js** - Fullscreen model selection modal
2. **PoseSelector.js** - Dedicated pose selector component
3. **DetailsUploader.js** - Detail image uploads with position/description
4. **AIProviderSelector.js** - Provider selection with cost info
5. **SelectedOptionsChips.js** - Circular chips showing current selections
6. **GeneratedPreview.js** - Result preview with download/new actions
7. **GalleryGrid.js** - Responsive gallery grid component

---

*Remember: We're beautifying the UI, not touching the working backend!*
