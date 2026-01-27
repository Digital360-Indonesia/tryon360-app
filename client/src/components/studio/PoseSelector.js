import React from 'react';
import {
  User,
  Armchair,
  Hand,
  Move,
  PersonStanding,
  Accessibility,
  Maximize,
  RotateCw,
} from 'lucide-react';

// ============================================
// POSE DEFINITIONS
// ============================================
// Maps backend pose IDs to display info with icons
const POSE_DEFINITIONS = [
  {
    id: 'professional_standing',
    name: 'Professional Standing',
    description: 'Formal standing pose',
    icon: PersonStanding,
    requiresBackPhoto: false,
  },
  {
    id: 'arms_crossed',
    name: 'Arms Crossed',
    description: 'Confident arms crossed',
    icon: Accessibility,
    requiresBackPhoto: false,
  },
  {
    id: 'hands_on_hips',
    name: 'Hands on Hips',
    description: 'Confident stance',
    icon: Accessibility,
    requiresBackPhoto: false,
  },
  {
    id: 'hands_in_pockets',
    name: 'Hands in Pockets',
    description: 'Casual relaxed pose',
    icon: Move,
    requiresBackPhoto: false,
  },
  {
    id: 'one_hand_on_hip',
    name: 'One Hand on Hip',
    description: 'Sassy confident pose',
    icon: Hand,
    requiresBackPhoto: false,
  },
  {
    id: 'hands_clasped',
    name: 'Hands Clasped',
    description: 'Professional greeting',
    icon: User,
    requiresBackPhoto: false,
  },
  {
    id: 'arms_at_sides',
    name: 'Arms at Sides',
    description: 'Natural standing pose',
    icon: PersonStanding,
    requiresBackPhoto: false,
  },
  {
    id: 'casual_standing',
    name: 'Casual Standing',
    description: 'Relaxed everyday pose',
    icon: Armchair,
    requiresBackPhoto: false,
  },
  {
    id: 'casual_confident',
    name: 'Casual Confident',
    description: 'Easy confident stance',
    icon: Maximize,
    requiresBackPhoto: false,
  },
  {
    id: 'look_over_shoulder',
    name: 'Look Over Shoulder',
    description: 'Dramatic back view',
    icon: RotateCw,
    requiresBackPhoto: true,
  },
  {
    id: 'side_flex',
    name: 'Side Flex',
    description: 'Dynamic side pose',
    icon: Move,
    requiresBackPhoto: false,
  },
];

// ============================================
// POSE SELECTOR COMPONENT
// ============================================
// Dropdown/Grid pose selector with icons

const PoseSelector = ({ selectedPose, onPoseChange, poses: propPoses }) => {
  // Use provided poses or default definitions
  const poseOptions = propPoses || POSE_DEFINITIONS;

  const currentPose = poseOptions.find(p => p.id === selectedPose);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Pose
      </label>

      {/* Compact Selected Pose Display */}
      <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
        {currentPose ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                {React.createElement(currentPose.icon, {
                  className: 'w-6 h-6 text-blue-600',
                })}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{currentPose.name}</h4>
                <p className="text-sm text-gray-600">{currentPose.description}</p>
                {currentPose.requiresBackPhoto && (
                  <div className="flex items-center space-x-1 mt-1">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    <p className="text-xs text-orange-600">Back photo recommended</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">Select a pose from the options below</p>
        )}
      </div>

      {/* Pose Grid */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {poseOptions.map((pose) => {
          const IconComponent = pose.icon;
          const isSelected = selectedPose === pose.id;

          return (
            <button
              key={pose.id}
              onClick={() => onPoseChange(pose.id)}
              className={`
                relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-150
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }
              `}
            >
              {/* Icon */}
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center mb-2
                ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>

              {/* Name */}
              <p className={`text-xs font-medium text-center leading-tight ${
                isSelected ? 'text-blue-900' : 'text-gray-700'
              }`}>
                {pose.name}
              </p>

              {/* Back Photo Indicator */}
              {pose.requiresBackPhoto && (
                <div className="absolute top-1 right-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" title="Back photo recommended"></span>
                </div>
              )}

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute bottom-1 right-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Pose Details */}
      {currentPose && currentPose.requiresBackPhoto && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">Back Photo Recommended</p>
              <p className="text-xs text-orange-700 mt-1">
                For the "{currentPose.name}" pose, uploading the back view of your garment will show the complete look.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoseSelector;
