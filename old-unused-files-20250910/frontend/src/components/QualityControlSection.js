import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Sliders, 
  Target, 
  DollarSign, 
  Clock, 
  Zap, 
  Shield, 
  TrendingUp,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const QualityControlSection = ({ 
  onSettingsChange, 
  initialSettings = {},
  showAdvanced = false,
  costTransparency = true 
}) => {
  const [settings, setSettings] = useState({
    qualityTier: 'standard',
    consistencyPriority: 0.7,
    accuracyPriority: 0.7,
    enableRetry: true,
    maxRetries: 3,
    costLimit: 1.0,
    generationMode: 'auto',
    validationThreshold: 0.6,
    ...initialSettings
  });

  const [expandedSection, setExpandedSection] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(0.08);
  const [estimatedTime, setEstimatedTime] = useState(45);

  // Quality tier configurations
  const qualityTiers = {
    basic: {
      name: 'Basic',
      description: 'Fast generation with basic quality',
      cost: 0.04,
      time: 30,
      features: ['Single-pass generation', 'Basic validation', '1 retry attempt'],
      color: 'bg-gray-100 border-gray-300 text-gray-700'
    },
    standard: {
      name: 'Standard',
      description: 'Balanced quality and speed',
      cost: 0.08,
      time: 45,
      features: ['Enhanced generation', 'Multi-stage support', '2 retry attempts'],
      color: 'bg-blue-100 border-blue-300 text-blue-700',
      recommended: true
    },
    premium: {
      name: 'Premium',
      description: 'High quality with advanced features',
      cost: 0.16,
      time: 75,
      features: ['Multi-stage generation', 'Advanced validation', '3 retry attempts'],
      color: 'bg-purple-100 border-purple-300 text-purple-700'
    },
    ultra: {
      name: 'Ultra',
      description: 'Maximum quality with all features',
      cost: 0.32,
      time: 120,
      features: ['Multi-stage generation', 'Comprehensive validation', '5 retry attempts'],
      color: 'bg-orange-100 border-orange-300 text-orange-700'
    }
  };

  const generationModes = {
    auto: { name: 'Auto', description: 'Automatically choose the best method' },
    standard: { name: 'Standard', description: 'Single-pass generation' },
    enhanced: { name: 'Enhanced', description: 'Multi-stage with validation' },
    'model-first': { name: 'Model Priority', description: 'Prioritize model consistency' },
    'product-first': { name: 'Product Priority', description: 'Prioritize product accuracy' },
    balanced: { name: 'Balanced', description: 'Equal priority for both' }
  };

  useEffect(() => {
    // Calculate estimated cost and time based on settings
    const baseTier = qualityTiers[settings.qualityTier];
    let cost = baseTier.cost;
    let time = baseTier.time;

    // Adjust for retry settings
    if (settings.enableRetry) {
      const retryMultiplier = 1 + (settings.maxRetries * 0.3);
      cost *= retryMultiplier;
      time *= (1 + settings.maxRetries * 0.2);
    }

    // Adjust for priority settings
    const avgPriority = (settings.consistencyPriority + settings.accuracyPriority) / 2;
    if (avgPriority > 0.8) {
      cost *= 1.2;
      time *= 1.15;
    }

    setEstimatedCost(Math.round(cost * 100) / 100);
    setEstimatedTime(Math.round(time));
  }, [settings]);

  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key, value) => {
    handleSettingChange(key, parseFloat(value));
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const resetToDefaults = () => {
    setSettings({
      qualityTier: 'standard',
      consistencyPriority: 0.7,
      accuracyPriority: 0.7,
      enableRetry: true,
      maxRetries: 3,
      costLimit: 1.0,
      generationMode: 'auto',
      validationThreshold: 0.6
    });
  };

  const applyPreset = (preset) => {
    const presets = {
      fast: {
        qualityTier: 'basic',
        consistencyPriority: 0.6,
        accuracyPriority: 0.6,
        enableRetry: false,
        maxRetries: 1,
        generationMode: 'standard'
      },
      balanced: {
        qualityTier: 'standard',
        consistencyPriority: 0.7,
        accuracyPriority: 0.7,
        enableRetry: true,
        maxRetries: 2,
        generationMode: 'auto'
      },
      quality: {
        qualityTier: 'premium',
        consistencyPriority: 0.8,
        accuracyPriority: 0.8,
        enableRetry: true,
        maxRetries: 3,
        generationMode: 'enhanced'
      },
      maximum: {
        qualityTier: 'ultra',
        consistencyPriority: 0.9,
        accuracyPriority: 0.9,
        enableRetry: true,
        maxRetries: 5,
        generationMode: 'enhanced'
      }
    };

    if (presets[preset]) {
      setSettings(prev => ({ ...prev, ...presets[preset] }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Quality Control</h3>
        </div>
        
        {costTransparency && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">${estimatedCost}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{estimatedTime}s</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Quick Presets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { id: 'fast', name: 'Fast', icon: Zap, desc: 'Speed focused' },
            { id: 'balanced', name: 'Balanced', icon: Target, desc: 'Recommended' },
            { id: 'quality', name: 'Quality', icon: Shield, desc: 'Quality focused' },
            { id: 'maximum', name: 'Maximum', icon: TrendingUp, desc: 'Best quality' }
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="p-3 text-left border border-gray-200 rounded-md hover:border-orange-300 hover:bg-orange-50 transition-colors"
            >
              <div className="flex items-center space-x-2 mb-1">
                <preset.icon className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-sm">{preset.name}</span>
              </div>
              <p className="text-xs text-gray-600">{preset.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quality Tier Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-purple-600" />
          <span>Quality Tier</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(qualityTiers).map(([tier, config]) => (
            <div
              key={tier}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.qualityTier === tier
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSettingChange('qualityTier', tier)}
            >
              {config.recommended && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  Recommended
                </div>
              )}
              
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-medium text-gray-900">{config.name}</h5>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </div>
                
                {costTransparency && (
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">${config.cost}</div>
                    <div className="text-gray-500">{config.time}s</div>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                {config.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority Sliders */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('priorities')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">Priority Settings</span>
          </div>
          <div className="text-sm text-gray-600">
            Consistency: {(settings.consistencyPriority * 100).toFixed(0)}% | 
            Accuracy: {(settings.accuracyPriority * 100).toFixed(0)}%
          </div>
        </button>

        {expandedSection === 'priorities' && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Model Consistency Priority
                  </label>
                  <span className="text-sm text-gray-600">
                    {(settings.consistencyPriority * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.consistencyPriority}
                  onChange={(e) => handleSliderChange('consistencyPriority', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lower</span>
                  <span>Higher</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Product Accuracy Priority
                  </label>
                  <span className="text-sm text-gray-600">
                    {(settings.accuracyPriority * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.accuracyPriority}
                  onChange={(e) => handleSliderChange('accuracyPriority', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lower</span>
                  <span>Higher</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Priority Balance</p>
                  <p>Higher consistency priority focuses on maintaining model appearance. Higher accuracy priority focuses on product details and colors.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Retry Settings */}
      <div className="space-y-4">
        <button
          onClick={() => toggleSection('retry')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-900">Retry & Fallback</span>
          </div>
          <div className="text-sm text-gray-600">
            {settings.enableRetry ? `${settings.maxRetries} retries` : 'Disabled'}
          </div>
        </button>

        {expandedSection === 'retry' && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Adaptive Retry</label>
                <p className="text-xs text-gray-500">Automatically retry failed generations with adjusted parameters</p>
              </div>
              <button
                onClick={() => handleSettingChange('enableRetry', !settings.enableRetry)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableRetry ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableRetry ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.enableRetry && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Maximum Retry Attempts
                    </label>
                    <span className="text-sm text-gray-600">{settings.maxRetries}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={settings.maxRetries}
                    onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>5</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Cost Limit per Job
                    </label>
                    <span className="text-sm text-gray-600">${settings.costLimit}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={settings.costLimit}
                    onChange={(e) => handleSliderChange('costLimit', e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>$0.50</span>
                    <span>$3.00</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Advanced Settings</span>
            </div>
            <span className="text-sm text-gray-600">
              {generationModes[settings.generationMode]?.name}
            </span>
          </button>

          {expandedSection === 'advanced' && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generation Mode
                </label>
                <select
                  value={settings.generationMode}
                  onChange={(e) => handleSettingChange('generationMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                >
                  {Object.entries(generationModes).map(([mode, config]) => (
                    <option key={mode} value={mode}>
                      {config.name} - {config.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Validation Threshold
                  </label>
                  <span className="text-sm text-gray-600">
                    {(settings.validationThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="0.9"
                  step="0.05"
                  value={settings.validationThreshold}
                  onChange={(e) => handleSliderChange('validationThreshold', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Lenient</span>
                  <span>Strict</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cost Warning */}
      {costTransparency && estimatedCost > 0.20 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Higher Cost Settings</p>
              <p>Current settings may result in higher costs (${estimatedCost}). Consider adjusting quality tier or retry settings to optimize costs.</p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default QualityControlSection;