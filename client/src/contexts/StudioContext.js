import React, { createContext, useContext, useReducer, useCallback } from 'react';

// ============================================
// STUDIO CONTEXT - Frontend State Management
// ============================================
// This context manages ALL TryOnStudio frontend state
// NO BACKEND MODIFICATIONS - Uses existing API endpoints

// ============================================
// INITIAL STATE
// ============================================
const initialState = {
  // Tab State
  activeTab: 'generate', // 'generate' | 'gallery'

  // Model Selection
  selectedModel: null,    // 'gunawan' | 'paul' | 'johny' | 'rachma' | 'louise' | 'jennie'
  selectedPose: null,     // 'professional_standing' | 'arms_crossed' | etc.

  // Upload State
  uploads: {
    product: null,        // File object
    detail1: null,        // File object
    detail2: null,        // File object (disabled in v2.6)
    detail3: null,        // File object (disabled in v2.6)
  },

  // Detail Configuration
  detailConfigs: {
    detail1: { position: 'chest_left', description: '' },
    detail2: { position: 'chest_center', description: '' },
    detail3: { position: 'back_center', description: '' },
  },

  // AI Generation Settings
  providerId: 'gemini_2_5_flash_image', // Default provider
  garmentDescription: '',                // Main garment description
  smartAddons: '',                       // Additional enhancements

  // Generation State
  isGenerating: false,
  generationProgress: {
    stage: '',
    progress: 0,
  },
  currentResult: null,                   // Latest generated result

  // Gallery/History State
  galleryItems: [],                      // All generated items
  galleryFilter: 'all',                  // 'all' | 'gunawan' | 'paul' | etc.

  // UI State
  showModelModal: false,
  showPoseModal: false,
  sidebarSection: 'provider',            // 'provider' | 'model' | 'upload' | 'details' | 'ai'
};

// ============================================
// ACTION TYPES
// ============================================
const ACTION_TYPES = {
  // Tab Actions
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',

  // Model Actions
  SET_MODEL: 'SET_MODEL',
  SET_POSE: 'SET_POSE',
  SHOW_MODEL_MODAL: 'SHOW_MODEL_MODAL',
  SHOW_POSE_MODAL: 'SHOW_POSE_MODAL',

  // Upload Actions
  SET_UPLOAD: 'SET_UPLOAD',
  REMOVE_UPLOAD: 'REMOVE_UPLOAD',
  CLEAR_UPLOADS: 'CLEAR_UPLOADS',

  // Detail Config Actions
  SET_DETAIL_CONFIG: 'SET_DETAIL_CONFIG',

  // AI Settings Actions
  SET_PROVIDER: 'SET_PROVIDER',
  SET_GARMENT_DESCRIPTION: 'SET_GARMENT_DESCRIPTION',
  SET_SMART_ADDONS: 'SET_SMART_ADDONS',

  // Generation Actions
  START_GENERATION: 'START_GENERATION',
  UPDATE_GENERATION_PROGRESS: 'UPDATE_GENERATION_PROGRESS',
  COMPLETE_GENERATION: 'COMPLETE_GENERATION',
  FAIL_GENERATION: 'FAIL_GENERATION',
  SET_CURRENT_RESULT: 'SET_CURRENT_RESULT',

  // Gallery Actions
  SET_GALLERY_ITEMS: 'SET_GALLERY_ITEMS',
  ADD_GALLERY_ITEM: 'ADD_GALLERY_ITEM',
  SET_GALLERY_FILTER: 'SET_GALLERY_FILTER',

  // UI Actions
  SET_SIDEBAR_SECTION: 'SET_SIDEBAR_SECTION',

  // Reset Actions
  RESET_GENERATION_STATE: 'RESET_GENERATION_STATE',
};

// ============================================
// REDUCER
// ============================================
function studioReducer(state, action) {
  console.log('🎯 Reducer action:', action.type, action.payload);
  const newState = (() => {
  switch (action.type) {
    // Tab Actions
    case ACTION_TYPES.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };

    // Model Actions
    case ACTION_TYPES.SET_MODEL:
      return { ...state, selectedModel: action.payload, selectedPose: null };
    case ACTION_TYPES.SET_POSE:
      return { ...state, selectedPose: action.payload };
    case ACTION_TYPES.SHOW_MODEL_MODAL:
      return { ...state, showModelModal: action.payload };
    case ACTION_TYPES.SHOW_POSE_MODAL:
      return { ...state, showPoseModal: action.payload };

    // Upload Actions
    case ACTION_TYPES.SET_UPLOAD: {
      const newUploads = { ...state.uploads, [action.payload.slot]: action.payload.file };
      console.log('📤 SET_UPLOAD:', {
        slot: action.payload.slot,
        hasFile: !!action.payload.file,
        fileName: action.payload.file?.name,
        newUploads
      });
      return {
        ...state,
        uploads: newUploads
      };
    }
    case ACTION_TYPES.REMOVE_UPLOAD: {
      const newUploads = { ...state.uploads };
      delete newUploads[action.payload];
      return { ...state, uploads: newUploads };
    }
    case ACTION_TYPES.CLEAR_UPLOADS:
      return { ...state, uploads: initialState.uploads };

    // Detail Config Actions
    case ACTION_TYPES.SET_DETAIL_CONFIG:
      return {
        ...state,
        detailConfigs: {
          ...state.detailConfigs,
          [action.payload.detail]: {
            ...state.detailConfigs[action.payload.detail],
            ...action.payload.config
          }
        }
      };

    // AI Settings Actions
    case ACTION_TYPES.SET_PROVIDER:
      return { ...state, providerId: action.payload };
    case ACTION_TYPES.SET_GARMENT_DESCRIPTION:
      return { ...state, garmentDescription: action.payload };
    case ACTION_TYPES.SET_SMART_ADDONS:
      return { ...state, smartAddons: action.payload };

    // Generation Actions
    case ACTION_TYPES.START_GENERATION:
      return {
        ...state,
        isGenerating: true,
        generationProgress: { stage: 'Starting...', progress: 0 }
      };
    case ACTION_TYPES.UPDATE_GENERATION_PROGRESS:
      return {
        ...state,
        generationProgress: action.payload
      };
    case ACTION_TYPES.COMPLETE_GENERATION:
      return {
        ...state,
        isGenerating: false,
        currentResult: action.payload,
        generationProgress: { stage: 'Complete', progress: 100 }
      };
    case ACTION_TYPES.FAIL_GENERATION:
      return {
        ...state,
        isGenerating: false,
        generationProgress: { stage: 'Failed', progress: 0 }
      };
    case ACTION_TYPES.SET_CURRENT_RESULT:
      return { ...state, currentResult: action.payload };

    // Gallery Actions
    case ACTION_TYPES.SET_GALLERY_ITEMS:
      return { ...state, galleryItems: action.payload };
    case ACTION_TYPES.ADD_GALLERY_ITEM:
      return {
        ...state,
        galleryItems: [action.payload, ...state.galleryItems]
      };
    case ACTION_TYPES.SET_GALLERY_FILTER:
      return { ...state, galleryFilter: action.payload };

    // UI Actions
    case ACTION_TYPES.SET_SIDEBAR_SECTION:
      return { ...state, sidebarSection: action.payload };

    // Reset Actions
    case ACTION_TYPES.RESET_GENERATION_STATE:
      return {
        ...state,
        isGenerating: false,
        generationProgress: initialState.generationProgress,
      };

    default:
      return state;
  }
  })();

  // Log important state changes
  if (action.type === ACTION_TYPES.SET_MODEL ||
      action.type === ACTION_TYPES.SET_POSE ||
      action.type === ACTION_TYPES.SET_UPLOAD) {
    console.log('✨ New state:', {
      selectedModel: newState.selectedModel,
      selectedPose: newState.selectedPose,
      uploads: {
        product: newState.uploads.product?.name || null,
        detail1: newState.uploads.detail1?.name || null,
        detail2: newState.uploads.detail2?.name || null,
        detail3: newState.uploads.detail3?.name || null,
      }
    });
  }

  return newState;
}

// ============================================
// CONTEXT CREATE
// ============================================
const StudioContext = createContext();

// ============================================
// PROVIDER COMPONENT
// ============================================
export function StudioProvider({ children }) {
  const [state, dispatch] = useReducer(studioReducer, initialState);

  // ============================================
  // ACTION CREATORS (Convenience methods)
  // ============================================

  const actions = {
    // Tab
    setActiveTab: useCallback((tab) => {
      dispatch({ type: ACTION_TYPES.SET_ACTIVE_TAB, payload: tab });
    }, []),

    // Model
    setSelectedModel: useCallback((modelId) => {
      dispatch({ type: ACTION_TYPES.SET_MODEL, payload: modelId });
    }, []),

    setSelectedPose: useCallback((poseId) => {
      dispatch({ type: ACTION_TYPES.SET_POSE, payload: poseId });
    }, []),

    showModelModal: useCallback((show) => {
      dispatch({ type: ACTION_TYPES.SHOW_MODEL_MODAL, payload: show });
    }, []),

    showPoseModal: useCallback((show) => {
      dispatch({ type: ACTION_TYPES.SHOW_POSE_MODAL, payload: show });
    }, []),

    // Uploads
    setUpload: useCallback((slot, file) => {
      dispatch({ type: ACTION_TYPES.SET_UPLOAD, payload: { slot, file } });
    }, []),

    removeUpload: useCallback((slot) => {
      dispatch({ type: ACTION_TYPES.REMOVE_UPLOAD, payload: slot });
    }, []),

    clearUploads: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_UPLOADS });
    }, []),

    // Detail Configs
    setDetailConfig: useCallback((detail, config) => {
      dispatch({ type: ACTION_TYPES.SET_DETAIL_CONFIG, payload: { detail, config } });
    }, []),

    // AI Settings
    setProvider: useCallback((providerId) => {
      dispatch({ type: ACTION_TYPES.SET_PROVIDER, payload: providerId });
    }, []),

    setGarmentDescription: useCallback((description) => {
      dispatch({ type: ACTION_TYPES.SET_GARMENT_DESCRIPTION, payload: description });
    }, []),

    setSmartAddons: useCallback((addons) => {
      dispatch({ type: ACTION_TYPES.SET_SMART_ADDONS, payload: addons });
    }, []),

    // Generation
    startGeneration: useCallback(() => {
      dispatch({ type: ACTION_TYPES.START_GENERATION });
    }, []),

    updateGenerationProgress: useCallback((progress) => {
      dispatch({ type: ACTION_TYPES.UPDATE_GENERATION_PROGRESS, payload: progress });
    }, []),

    completeGeneration: useCallback((result) => {
      dispatch({ type: ACTION_TYPES.COMPLETE_GENERATION, payload: result });
    }, []),

    failGeneration: useCallback(() => {
      dispatch({ type: ACTION_TYPES.FAIL_GENERATION });
    }, []),

    setCurrentResult: useCallback((result) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_RESULT, payload: result });
    }, []),

    // Gallery
    setGalleryItems: useCallback((items) => {
      dispatch({ type: ACTION_TYPES.SET_GALLERY_ITEMS, payload: items });
    }, []),

    addGalleryItem: useCallback((item) => {
      dispatch({ type: ACTION_TYPES.ADD_GALLERY_ITEM, payload: item });
    }, []),

    setGalleryFilter: useCallback((filter) => {
      dispatch({ type: ACTION_TYPES.SET_GALLERY_FILTER, payload: filter });
    }, []),

    // UI
    setSidebarSection: useCallback((section) => {
      dispatch({ type: ACTION_TYPES.SET_SIDEBAR_SECTION, payload: section });
    }, []),

    resetGenerationState: useCallback(() => {
      dispatch({ type: ACTION_TYPES.RESET_GENERATION_STATE });
    }, []),
  };

  // ============================================
  // COMPUTED VALUES (Derivations from state)
  // ============================================
  const computed = {
    canGenerate: !!(
      state.selectedModel &&
      state.selectedPose &&
      state.uploads.product &&
      state.providerId &&
      !state.isGenerating
    ),

    hasUploads: Object.values(state.uploads).some(file => file !== null),
    uploadCount: Object.values(state.uploads).filter(file => file !== null).length,

    activeDetailUploads: Object.entries(state.uploads)
      .filter(([key, file]) => key.startsWith('detail') && file !== null)
      .map(([key, file]) => ({ key, file })),

    filteredGalleryItems: state.galleryFilter === 'all'
      ? state.galleryItems
      : state.galleryItems.filter(item => item.modelId === state.galleryFilter),
  };

  // Debug canGenerate
  console.log('🔍 canGenerate check:', {
    canGenerate: computed.canGenerate,
    hasModel: !!state.selectedModel,
    hasPose: !!state.selectedPose,
    hasProduct: !!state.uploads.product,
    hasProvider: !!state.providerId,
    notGenerating: !state.isGenerating,
    productName: state.uploads.product?.name || 'null'
  });

  const value = {
    // State
    ...state,
    // Actions
    ...actions,
    // Computed
    ...computed,
  };

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

// ============================================
// CUSTOM HOOK
// ============================================
export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within StudioProvider');
  }
  return context;
}

// ============================================
// EXPORTS
// ============================================
export { StudioContext, ACTION_TYPES };
export default StudioContext;
