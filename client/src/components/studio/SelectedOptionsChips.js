import React, { useMemo } from 'react';
import {
  User,
  Camera,
  Sparkles,
  PersonStanding,
  Accessibility,
  Move,
  Hand,
  Armchair,
  Maximize,
  RotateCw,
  Package
} from 'lucide-react';

// ============================================
// POSE DEFINITIONS (copied from PoseSelector)
// ============================================
const POSE_DEFINITIONS = [
  { id: 'professional_standing', icon: PersonStanding },
  { id: 'arms_crossed', icon: Accessibility },
  { id: 'hands_on_hips', icon: Accessibility },
  { id: 'hands_in_pockets', icon: Move },
  { id: 'one_hand_on_hip', icon: Hand },
  { id: 'hands_clasped', icon: User },
  { id: 'arms_at_sides', icon: PersonStanding },
  { id: 'casual_standing', icon: Armchair },
  { id: 'casual_confident', icon: Maximize },
  { id: 'look_over_shoulder', icon: RotateCw },
  { id: 'side_flex', icon: Move },
];

// Provider icons mapping
const PROVIDER_ICONS = {
  'flux_kontext': '/flux_icon.svg',
  'gemini_2_5_flash_image': '/gemini_icon.png',
  'imagen_4_ultra': '/imagen_icon.png',
};

// ============================================
// SELECTED OPTIONS CHIPS COMPONENT
// ============================================

export function SelectedOptionsChips({
  selectedModel,
  selectedPose,
  uploads,
  providerId,
  onChipClick
}) {
  // Simple render debug - FIRST thing to run
  console.log('🎯 SelectedOptionsChips RENDERED!');
  console.log('📦 Props:', { selectedModel, selectedPose, uploads, providerId });

  // Get upload preview URL - must be BEFORE useEffect
  const uploadPreviewUrl = useMemo(() => {
    const productFile = uploads?.product;
    if (productFile && (productFile instanceof File || productFile instanceof Blob)) {
      try {
        return URL.createObjectURL(productFile);
      } catch (e) {
        console.error('Failed to create object URL:', e);
        return null;
      }
    }
    return null;
  }, [uploads]);

  // Debug logging - NOW after uploadPreviewUrl is defined
  React.useEffect(() => {
    console.log('=== SelectedOptionsChips DEBUG ===');
    console.log('uploads:', uploads);
    console.log('uploads?.product:', uploads?.product);
    console.log('uploads?.product type:', typeof uploads?.product);
    console.log('uploads?.product instanceof File:', uploads?.product instanceof File);
    console.log('hasProductUpload:', !!(uploads?.product));
    console.log('uploadPreviewUrl:', uploadPreviewUrl);
  }, [uploads, uploadPreviewUrl]);

  // Get model data
  const modelData = useMemo(() => {
    if (!selectedModel) return null;
    if (typeof selectedModel === 'object') return selectedModel;
    return { id: selectedModel, name: selectedModel, avatar: null };
  }, [selectedModel]);

  // Get pose icon
  const poseIcon = useMemo(() => {
    if (!selectedPose) return null;
    const poseDef = POSE_DEFINITIONS.find(p => p.id === selectedPose);
    return poseDef?.icon || Camera;
  }, [selectedPose]);

  // Get pose display name
  const poseDisplayName = useMemo(() => {
    if (!selectedPose) return null;
    return selectedPose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [selectedPose]);

  // Check if we have any upload
  const hasProductUpload = !!(uploads?.product);

  // Get provider icon
  const providerIcon = useMemo(() => {
    if (!providerId) return null;
    return PROVIDER_ICONS[providerId] || null;
  }, [providerId]);

  // Get provider display name
  const providerDisplayName = useMemo(() => {
    if (!providerId) return null;
    return providerId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [providerId]);

  const chips = [];

  console.log('=== Building chips ===');
  console.log('modelData:', modelData);
  console.log('selectedPose:', selectedPose);
  console.log('poseIcon:', poseIcon);
  console.log('hasProductUpload:', hasProductUpload);

  // Model chip
  if (modelData) {
    chips.push({
      type: 'model',
      label: 'Model',
      value: modelData.name || modelData.id,
      image: modelData.avatar,
      section: 'model'
    });
  }

  // Pose chip - with specific icon
  if (selectedPose && poseIcon) {
    chips.push({
      type: 'pose',
      icon: poseIcon,
      label: 'Pose',
      value: poseDisplayName,
      section: 'pose'
    });
  }

  // Upload chip - show actual image if available
  if (hasProductUpload) {
    chips.push({
      type: 'upload',
      label: 'Product',
      value: uploadPreviewUrl ? 'Uploaded' : 'Ready',
      image: uploadPreviewUrl,
      section: 'upload'
    });
  }

  // Truncate long text
  const truncateText = (text, maxLength = 10) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex items-center gap-6 px-6 py-4 bg-gray-50 border-b border-gray-200">
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <button
            key={chip.type}
            onClick={() => onChipClick?.(chip.section)}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer min-w-0"
            title={`${chip.label}: ${chip.value}`}
          >
            {/* Circular chip */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              {chip.image ? (
                <img
                  src={chip.image}
                  alt={chip.label}
                  className="w-full h-full object-cover"
                />
              ) : Icon ? (
                <Icon className="w-6 h-6 text-white" />
              ) : (
                <Package className="w-6 h-6 text-white" />
              )}
            </div>

            {/* Label */}
            <div className="flex flex-col items-center min-w-0">
              <span className="text-xs font-medium text-gray-600 text-center leading-tight">
                {chip.label}
              </span>
              <span className="text-xs font-semibold text-gray-900 text-center leading-tight max-w-[60px] truncate">
                {truncateText(chip.value, 10)}
              </span>
            </div>
          </button>
        );
      })}

      {/* AI Provider chip - with icon or sparkles fallback */}
      {providerId && (
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl min-w-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
            {providerIcon ? (
              <img
                src={providerIcon}
                alt="Provider"
                className="w-6 h-6"
              />
            ) : (
              <Sparkles className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex flex-col items-center min-w-0">
            <span className="text-xs font-medium text-gray-600 text-center leading-tight">
              AI Ready
            </span>
            <span className="text-xs font-semibold text-gray-900 text-center leading-tight max-w-[60px] truncate">
              {truncateText(providerDisplayName, 10)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectedOptionsChips;
