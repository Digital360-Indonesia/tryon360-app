import React, { useState, useEffect } from 'react';
import { Upload, Wand2, AlertCircle, CheckCircle, Clock, Download, ChevronDown, ChevronRight } from 'lucide-react';
import apiService from '../services/api';
import QualityControlSection from '../components/QualityControlSection';

const TryOnGenerator = () => {
  const [models, setModels] = useState([]);
  const [garmentTypes, setGarmentTypes] = useState([]);
  const [qualitySettings, setQualitySettings] = useState([]);
  const [generativeModels, setGenerativeModels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    modelId: '',
    garmentType: '',
    garmentColor: '',
    logoDescription: '',
    logoPosition: '',
    pose: 'Arms Crossed',
    quality: 'standard',
    priority: 'normal',
    additionalDetails: '',
    logoFocusEnabled: false,
    generativeModel: 'flux'
  });
  
  // Quality control settings
  const [qualityControlSettings, setQualityControlSettings] = useState({
    qualityTier: 'standard',
    consistencyPriority: 0.7,
    accuracyPriority: 0.7,
    enableRetry: true,
    maxRetries: 3,
    costLimit: 1.0,
    generationMode: 'auto',
    validationThreshold: 0.6
  });
  
  // UI state for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    contentType: true,
    visualIntensity: true,
    composition: true,
    logoFocus: false,
    generativeModel: true,
    qualityControl: false
  });
  
  // Generation history
  const [generationHistory, setGenerationHistory] = useState([]);
  
  // Pose options
  const poseOptions = [
    'Arms Crossed',
    'Contrapposto', 
    'Clasping Hands',
    'Hands On Chest',
    'Holding One Arm',
    'Hands in Pockets'
  ];
  
  // Logo position options
  const logoPositions = [
    'Left Chest',
    'Right Chest', 
    'Left Arm',
    'Right Arm',
    'Middle Chest'
  ];
  
  const [garmentFile, setGarmentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Job tracking
  const [currentJob, setCurrentJob] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Poll for job status when we have an active job
    if (currentJob && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed') {
      const interval = setInterval(checkJobStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [currentJob, jobStatus]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [modelsRes, garmentTypesRes, qualityRes, generativeRes] = await Promise.all([
        apiService.getModels(),
        apiService.getGarmentTypes(), 
        apiService.getQualitySettings(),
        apiService.getGenerativeModels()
      ]);
      
      setModels(modelsRes.models || []);
      setGarmentTypes(garmentTypesRes.garments || []);
      setQualitySettings(qualityRes.qualities || []);
      setGenerativeModels(generativeRes.models || []);
      
      // Set default values
      if (modelsRes.models && modelsRes.models.length > 0) {
        setFormData(prev => ({ ...prev, modelId: modelsRes.models[0].id }));
      }
      if (garmentTypesRes.garments && garmentTypesRes.garments.length > 0) {
        setFormData(prev => ({ ...prev, garmentType: garmentTypesRes.garments[0].id }));
      }
      if (generativeRes.defaultModel) {
        setFormData(prev => ({ ...prev, generativeModel: generativeRes.defaultModel }));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update pose when model changes
    if (name === 'modelId') {
      const selectedModel = models.find(m => m.id === value);
      if (selectedModel && selectedModel.poses && selectedModel.poses.length > 0) {
        setFormData(prev => ({ ...prev, pose: selectedModel.poses[0] }));
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGarmentFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const checkJobStatus = async () => {
    if (!currentJob) return;
    
    try {
      const response = await apiService.getJobStatus(currentJob);
      setJobStatus(response);
      
      if (response.status === 'completed') {
        const newGeneration = {
          id: Date.now(),
          ...response.result,
          timestamp: new Date(),
          model: selectedModel,
          quality: formData.quality,
          pose: formData.pose
        };
        setGeneratedImage(response.result);
        setGenerationHistory(prev => [newGeneration, ...prev]);
        setIsGenerating(false);
        setCurrentJob(null);
      } else if (response.status === 'failed') {
        setError(response.error || 'Generation failed');
        setIsGenerating(false);
        setCurrentJob(null);
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const handleQualityControlChange = (settings) => {
    setQualityControlSettings(settings);
  };

  const handleGenerate = async () => {
    if (!formData.modelId) {
      setError('Please select a model');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedImage(null);
      
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add quality control settings
      Object.keys(qualityControlSettings).forEach(key => {
        if (qualityControlSettings[key] !== undefined && qualityControlSettings[key] !== '') {
          submitData.append(key, qualityControlSettings[key]);
        }
      });
      
      // Set default garment type if not selected
      if (!formData.garmentType) {
        submitData.append('garmentType', 't_shirt');
      }
      
      if (garmentFile) {
        submitData.append('garmentImage', garmentFile);
        console.log('Uploading garment file:', garmentFile.name);
      }
      
      console.log('Submitting form data:', Object.fromEntries(submitData.entries()));
      
      const response = await apiService.generateTryOn(submitData);
      
      if (response.success) {
        setCurrentJob(response.jobId);
        setJobStatus({
          jobId: response.jobId,
          status: response.status,
          queuePosition: response.queuePosition,
          progress: 0
        });
      } else {
        throw new Error(response.error || 'Failed to start generation');
      }
    } catch (error) {
      console.error('Error starting generation:', error);
      setError(error.response?.data?.error || error.message || 'Failed to start generation. Please check if the backend is running.');
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      modelId: models.length > 0 ? models[0].id : '',
      garmentType: garmentTypes.length > 0 ? garmentTypes[0].id : '',
      garmentColor: '',
      logoDescription: '',
      logoPosition: '',
      pose: 'Arms Crossed',
      quality: 'hd',
      priority: 'normal',
      additionalDetails: '',
      logoFocusEnabled: false,
      generativeModel: generativeModels.length > 0 ? (generativeModels.find(m => m.default)?.id || generativeModels[0].id) : 'flux'
    });
    setGarmentFile(null);
    setPreviewUrl(null);
    setGeneratedImage(null);
    setCurrentJob(null);
    setJobStatus(null);
    setError(null);
    setIsGenerating(false);
    setGenerationHistory([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kustom-600"></div>
        <span className="ml-3 text-gray-600">Loading platform data...</span>
      </div>
    );
  }

  const selectedModel = models.find(m => m.id === formData.modelId);
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Controls */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Try-On Generator</span>
          </div>
        </div>
        
        <div className="p-4 space-y-4">

          {/* Generative Model Selection */}
          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('generativeModel')}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <span>AI Model</span>
              {expandedSections.generativeModel ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {expandedSections.generativeModel && (
              <div className="space-y-3 pl-4">
                <div>
                  <select 
                    name="generativeModel" 
                    value={formData.generativeModel} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {generativeModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {generativeModels.find(m => m.id === formData.generativeModel) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {generativeModels.find(m => m.id === formData.generativeModel).description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quality Settings */}
          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('quality')}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <span>Quality</span>
              {expandedSections.quality ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {expandedSections.quality && (
              <div className="space-y-3 pl-4">
                <div>
                  <select 
                    name="quality" 
                    value={formData.quality} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {qualitySettings.map(setting => (
                      <option key={setting.id} value={setting.id}>
                        {setting.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Model Selection */}
          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('model')}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <span>Model</span>
              {expandedSections.model ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {expandedSections.model && (
              <div className="space-y-3 pl-4">
                <div>
                  <select 
                    name="modelId" 
                    value={formData.modelId} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Model</option>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Show selected model preview */}
                {selectedModel && (
                  <div className="text-center">
                    <div className="w-16 h-20 mx-auto mb-2 rounded overflow-hidden bg-gray-100">
                      <img 
                        src={selectedModel.avatar} 
                        alt={selectedModel.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder-model.png';
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600">{selectedModel.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Pose Selection */}
          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('pose')}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <span>Pose</span>
              {expandedSections.pose ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {expandedSections.pose && (
              <div className="space-y-3 pl-4">
                <div>
                  <select 
                    name="pose" 
                    value={formData.pose} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {poseOptions.map(pose => (
                      <option key={pose} value={pose}>
                        {pose}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>


          {/* Product Reference */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Reference</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                {previewUrl ? (
                  <div className="space-y-2">
                    <img src={previewUrl} alt="Preview" className="mx-auto h-20 w-20 object-cover rounded-lg" />
                    <button
                      onClick={() => {
                        setGarmentFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <label className="cursor-pointer text-sm text-primary-600 hover:text-primary-500">
                      <span>Upload Product</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                        name="garmentImage"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Upload garment image</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Logo Focus Enhancement */}
          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('logoFocus')}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <span>Logo Focus</span>
              {expandedSections.logoFocus ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {expandedSections.logoFocus && (
              <div className="space-y-3 pl-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    name="logoFocusEnabled"
                    checked={formData.logoFocusEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoFocusEnabled: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-500"
                  />
                  <span className="text-sm text-gray-700">Enable logo enhancement</span>
                </div>
                
                {formData.logoFocusEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo Position</label>
                      <select 
                        name="logoPosition" 
                        value={formData.logoPosition}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select position</option>
                        {logoPositions.map(position => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo Upload</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                        <Upload className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                        <label className="cursor-pointer text-xs text-primary-600 hover:text-primary-500">
                          <span>Upload logo</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                          />
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quality Control */}
          <div className="space-y-2">
            <button 
              onClick={() => toggleSection('qualityControl')}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <span>Quality Control</span>
              {expandedSections.qualityControl ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {expandedSections.qualityControl && (
              <div className="pl-4">
                <QualityControlSection
                  onSettingsChange={handleQualityControlChange}
                  initialSettings={qualityControlSettings}
                  showAdvanced={true}
                  costTransparency={true}
                />
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.modelId}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Generation Status */}
          {(isGenerating || jobStatus) && (
            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {jobStatus && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {jobStatus.status === 'pending' && (
                      <>
                        <Clock className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium">In Queue</span>
                        {jobStatus.queuePosition && (
                          <span className="text-xs text-gray-500">
                            Position: {jobStatus.queuePosition}
                          </span>
                        )}
                      </>
                    )}
                    
                    {jobStatus.status === 'processing' && (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        <span className="text-sm font-medium">Generating...</span>
                      </>
                    )}
                    
                    {jobStatus.status === 'completed' && (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">Completed</span>
                      </>
                    )}
                    
                    {jobStatus.status === 'failed' && (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium">Failed</span>
                      </>
                    )}
                  </div>
                  
                  {jobStatus.progress !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${jobStatus.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isGenerating && !generatedImage && generationHistory.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start generating images</h3>
              <p className="text-gray-600">Configure your settings and click Generate to create your first try-on image.</p>
            </div>
          )}

          {/* Generation History */}
          <div className="space-y-6">
            {/* Current Generation */}
            {generatedImage && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="aspect-[2/3] w-full max-w-md mx-auto">
                  <img 
                    src={`http://localhost:3001${generatedImage.imageUrl}`}
                    alt="Generated try-on"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Latest Generation</h4>
                    <a 
                      href={`http://localhost:3001${generatedImage.imageUrl}`}
                      download
                      className="text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-sm">Download</span>
                    </a>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Model:</strong> {selectedModel?.name || 'Unknown'}</p>
                    <p><strong>Pose:</strong> {formData.pose}</p>
                    <p><strong>Quality:</strong> {formData.quality}</p>
                    {generatedImage.cost && <p><strong>Cost:</strong> ${generatedImage.cost}</p>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Previous Generations */}
            {generationHistory.map((generation, index) => (
              <div key={generation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="aspect-[2/3] w-full max-w-md mx-auto">
                  <img 
                    src={`http://localhost:3001${generation.imageUrl}`}
                    alt={`Generation ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Generation History</h4>
                    <span className="text-xs text-gray-500">
                      {generation.timestamp.toLocaleDateString()} {generation.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Model:</strong> {generation.model?.name || 'Unknown'}</p>
                    <p><strong>Pose:</strong> {generation.pose}</p>
                    <p><strong>Quality:</strong> {generation.quality}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TryOnGenerator;
