import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Zap,
  Target,
  Eye,
  Layers,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';

const GenerationProgressSection = ({ 
  isGenerating = false,
  progress = 0,
  currentStage = null,
  stageProgress = 0,
  retryAttempt = 0,
  maxRetries = 3,
  validationResults = null,
  errorMessage = null,
  onCancel = null,
  onRetry = null,
  estimatedTimeRemaining = null,
  qualityTier = 'standard',
  generationHistory = []
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Generation stages configuration
  const stages = {
    'analyzing': {
      name: 'Analyzing Product',
      description: 'Extracting product details and characteristics',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    'stage1': {
      name: 'Model Generation',
      description: 'Generating model with consistent appearance',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    'stage2': {
      name: 'Product Application',
      description: 'Applying product to model while preserving features',
      icon: Layers,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    'validating': {
      name: 'Quality Validation',
      description: 'Checking consistency and accuracy',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    'retrying': {
      name: 'Adaptive Retry',
      description: 'Adjusting parameters and retrying generation',
      icon: RefreshCw,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    'completed': {
      name: 'Generation Complete',
      description: 'Image generated successfully',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    'failed': {
      name: 'Generation Failed',
      description: 'Unable to generate satisfactory result',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  };

  // Animate progress bar
  useEffect(() => {
    if (progress !== animatedProgress) {
      const increment = (progress - animatedProgress) / 20;
      const animate = () => {
        setAnimatedProgress(prev => {
          const newValue = prev + increment;
          if (Math.abs(newValue - progress) < 0.5) {
            return progress;
          }
          return newValue;
        });
      };
      
      const interval = setInterval(animate, 50);
      return () => clearInterval(interval);
    }
  }, [progress, animatedProgress]);

  // Track elapsed time
  useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentStageInfo = () => {
    return stages[currentStage] || stages['analyzing'];
  };

  const getQualityTierInfo = () => {
    const tiers = {
      basic: { name: 'Basic', color: 'text-gray-600', estimatedTime: '20-40s' },
      standard: { name: 'Standard', color: 'text-blue-600', estimatedTime: '30-60s' },
      premium: { name: 'Premium', color: 'text-purple-600', estimatedTime: '60-120s' },
      ultra: { name: 'Ultra', color: 'text-orange-600', estimatedTime: '120-300s' }
    };
    return tiers[qualityTier] || tiers.standard;
  };

  const stageInfo = getCurrentStageInfo();
  const tierInfo = getQualityTierInfo();
  const StageIcon = stageInfo.icon;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${stageInfo.bgColor}`}>
            <StageIcon className={`w-6 h-6 ${stageInfo.color} ${isGenerating ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isGenerating ? stageInfo.name : 'Generation Ready'}
            </h3>
            <p className="text-sm text-gray-600">
              {isGenerating ? stageInfo.description : 'Configure settings and start generation'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Quality Tier Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color} bg-gray-100`}>
            {tierInfo.name}
          </div>
          
          {/* Cancel Button */}
          {isGenerating && onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Cancel Generation"
            >
              <Square className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(animatedProgress)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          
          {/* Stage Progress */}
          {currentStage && stageProgress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">
                  {stageInfo.name}
                </span>
                <span className="text-xs text-gray-600">
                  {Math.round(stageProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    stageInfo.color.replace('text-', 'bg-').replace('-600', '-500')
                  }`}
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Retry Information */}
      {retryAttempt > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              Retry Attempt {retryAttempt} of {maxRetries}
            </span>
          </div>
          <p className="text-sm text-yellow-700">
            Adjusting parameters based on previous validation results to improve quality.
          </p>
          
          {/* Retry Progress */}
          <div className="mt-3">
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(retryAttempt / maxRetries) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Time Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
            <Clock className="w-4 h-4" />
            <span>Elapsed</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatTime(elapsedTime)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
            <Zap className="w-4 h-4" />
            <span>Estimated</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {estimatedTimeRemaining ? formatTime(estimatedTimeRemaining) : tierInfo.estimatedTime}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
            <Target className="w-4 h-4" />
            <span>Quality</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {validationResults?.overallQuality ? 
              `${Math.round(validationResults.overallQuality * 100)}%` : 
              '--'
            }
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Attempts</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {retryAttempt || 1}
          </div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Generation Stages</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {['analyzing', 'stage1', 'stage2', 'validating'].map((stage, index) => {
            const stageConfig = stages[stage];
            const StageIcon = stageConfig.icon;
            const isActive = currentStage === stage;
            const isCompleted = progress > (index + 1) * 25;
            const isPending = progress <= index * 25;
            
            return (
              <div
                key={stage}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                  isActive 
                    ? `${stageConfig.bgColor} border-current ${stageConfig.color}` 
                    : isCompleted
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                <StageIcon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium whitespace-nowrap">
                  {stageConfig.name}
                </span>
                {isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Stage Information */}
      {showDetails && (
        <div className="mb-6 space-y-3">
          {['analyzing', 'stage1', 'stage2', 'validating'].map((stage, index) => {
            const stageConfig = stages[stage];
            const StageIcon = stageConfig.icon;
            const isActive = currentStage === stage;
            const isCompleted = progress > (index + 1) * 25;
            
            return (
              <div
                key={stage}
                className={`p-3 rounded-lg border ${
                  isActive 
                    ? `${stageConfig.bgColor} border-current` 
                    : isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <StageIcon className={`w-5 h-5 ${
                    isActive ? `${stageConfig.color} animate-pulse` :
                    isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="flex-1">
                    <h5 className={`font-medium ${
                      isActive ? stageConfig.color :
                      isCompleted ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {stageConfig.name}
                    </h5>
                    <p className={`text-sm ${
                      isActive ? stageConfig.color.replace('-600', '-700') :
                      isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {stageConfig.description}
                    </p>
                  </div>
                  {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {isActive && (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">Generation Error</h4>
              <p className="text-sm text-red-700">{errorMessage}</p>
              
              {onRetry && retryAttempt < maxRetries && (
                <button
                  onClick={onRetry}
                  className="mt-3 flex items-center space-x-2 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Generation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generation History */}
      {generationHistory.length > 0 && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Recent Attempts</h4>
            <span className="text-sm text-gray-600">
              {generationHistory.length} attempt{generationHistory.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {generationHistory.slice(-5).reverse().map((attempt, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  {attempt.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-700">
                    Attempt {generationHistory.length - index}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  {attempt.qualityScore && (
                    <span>Quality: {Math.round(attempt.qualityScore * 100)}%</span>
                  )}
                  <span>{formatTime(attempt.duration || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips and Information */}
      {!isGenerating && !errorMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Generation Tips</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Higher quality tiers provide better results but take longer</li>
                <li>• Enable retry for automatic quality improvement</li>
                <li>• Clear, well-lit product images work best</li>
                <li>• Consider your priority settings for optimal results</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerationProgressSection;