import React, { useMemo, useState, useEffect } from 'react';
import {
  User,
  Camera,
  PersonStanding,
  Accessibility,
  Move,
  Hand,
  Armchair,
  Maximize,
  RotateCw,
  Package
} from 'lucide-react';
import api from '../../services/api';
import API_CONFIG from '../../config/api';

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
  // Fetch models to get avatar data
  const [models, setModels] = useState([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await api.get('/models');
        setModels(response.data.models || []);
      } catch (err) {
        console.error('Failed to load models:', err);
        setModels([]);
      }
    };
    fetchModels();
  }, []);

  // Get upload preview URL
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

  // Get model data - look up from fetched models if only ID is provided
  const modelData = useMemo(() => {
    if (!selectedModel) return null;
    if (typeof selectedModel === 'object') return selectedModel;
    const foundModel = models.find(m => m.id === selectedModel);
    if (foundModel) {
      return {
        id: foundModel.id,
        name: foundModel.name,
        avatar: foundModel.avatar || foundModel.imageUrl || null
      };
    }
    return { id: selectedModel, name: selectedModel, avatar: null };
  }, [selectedModel, models]);

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

  const chips = [];

  // AI Provider chip
  if (providerId) {
    chips.push({
      type: 'provider',
      label: 'AI Provider',
      value: providerId,
      section: 'provider',
      icon: null
    });
  }

  // Model chip
  if (modelData) {
    const avatarUrl = modelData.avatar ? API_CONFIG.buildImageUrl(modelData.avatar) : null;
    chips.push({
      type: 'model',
      label: 'Model',
      value: modelData.name || modelData.id,
      image: avatarUrl,
      section: 'model'
    });
  }

  // Pose chip
  if (selectedPose && poseIcon) {
    chips.push({
      type: 'pose',
      icon: poseIcon,
      label: 'Pose',
      value: poseDisplayName,
      section: 'model'
    });
  }

  // Upload chip
  if (hasProductUpload) {
    chips.push({
      type: 'upload',
      label: 'Product',
      value: 'Uploaded',
      image: uploadPreviewUrl,
      section: 'upload'
    });
  }

  // Detail upload chips
  ['detail1', 'detail2', 'detail3'].forEach((detailKey, index) => {
    const detailFile = uploads?.[detailKey];
    if (detailFile && (detailFile instanceof File || detailFile instanceof Blob)) {
      try {
        const detailPreviewUrl = URL.createObjectURL(detailFile);
        chips.push({
          type: `detail${index + 1}`,
          label: `Detail ${index + 1}`,
          value: 'Uploaded',
          image: detailPreviewUrl,
          section: 'upload'
        });
      } catch (e) {
        console.error(`Failed to create object URL for ${detailKey}:`, e);
      }
    }
  });

  // Truncate long text
  const truncateText = (text, maxLength = 10) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex items-center gap-6 px-6 py-4 bg-gray-50">
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
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-md group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              {chip.image ? (
                <img
                  src={chip.image}
                  alt={chip.label}
                  className="w-full h-full object-cover"
                />
              ) : Icon ? (
                <Icon className="w-6 h-6 text-gray-600" />
              ) : (
                <Package className="w-6 h-6 text-gray-600" />
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
    </div>
  );
}

export default SelectedOptionsChips;
