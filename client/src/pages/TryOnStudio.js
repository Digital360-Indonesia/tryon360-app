import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, History, Trash2, BarChart3, Home } from 'lucide-react';
import ModelSelector from '../components/ModelSelector';
import SimpleUpload from '../components/SimpleUpload';
import GenerationPanel from '../components/GenerationPanel';
import { apiMethods, createGenerationFormData } from '../services/api';
import storageService from '../services/storage';
import API_CONFIG from '../config/api';

const TryOnStudio = () => {
  // Core state
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedPose, setSelectedPose] = useState(null);
  const [selectedPoseInfo, setSelectedPoseInfo] = useState(null);
  const [uploads, setUploads] = useState({});

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({});

  // Results state
  const [generationResults, setGenerationResults] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // UI state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load history from database on mount
  useEffect(() => {
    loadHistoryFromDatabase();
  }, []);

  const loadHistoryFromDatabase = async () => {
    try {
      console.log('🔄 Loading history from database...');
      const response = await apiMethods.get('/generation/logs?limit=10&status=completed');

      console.log('📦 API Response:', response);
      console.log('✅ Response.data:', response.data);

      if (response && response.success) {
        const completedGenerations = response.data || [];
        console.log('📊 Completed generations:', completedGenerations.length);

        // Transform database records to match the expected format
        const transformedResults = completedGenerations.map(gen => ({
          id: gen.id,
          jobId: gen.jobId,
          imageUrl: gen.imageUrl,
          imagePath: gen.imagePath,
          modelInfo: gen.modelId,
          poseInfo: gen.pose,
          provider: gen.provider,
          createdAt: gen.createdAt,
          prompt: gen.prompt
        }));

        console.log('✅ Transformed results:', transformedResults.length);
        setGenerationResults(transformedResults);
      } else {
        console.warn('⚠️ Response success is false or no data');
      }
    } catch (err) {
      console.error('❌ Failed to load history from database:', err);
      // Fallback to localStorage if database fails
      const savedHistory = storageService.getGenerationHistory();
      if (savedHistory.length > 0) {
        console.log('📦 Using localStorage fallback:', savedHistory.length);
        setGenerationResults(savedHistory);
      }
    }
  };

  // Refresh history when showing history panel
  useEffect(() => {
    if (showHistory) {
      loadHistoryFromDatabase();
    }
  }, [showHistory]);

  const handleUploadChange = (slotType, file) => {
      setUploads(prev => ({
      ...prev,
      [slotType]: file
    }));
    
    // Clear any previous errors
    setError(null);
  };

  const handleRemoveUpload = (slotType) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[slotType];
      return newUploads;
    });
  };

  const handlePoseSelect = async (poseId) => {
    setSelectedPose(poseId);
    
    // Fetch pose details to get requirements
    try {
      const response = await apiMethods.get(`/models/${selectedModel}/poses`);
      const poseInfo = response.data.poses.find(p => p.id === poseId);
      setSelectedPoseInfo(poseInfo);
    } catch (error) {
            setSelectedPoseInfo(null);
    }
  };

  const handleGenerate = async (generationData, uploadFiles) => {
    // Log the generation attempt
    const logData = {
      modelId: selectedModel,
      pose: selectedPose,
      providerId: generationData.providerId,
      garmentDescription: generationData.garmentDescription,
      success: false // Will update to true if successful
    };

    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);
      setGenerationProgress({ stage: 'Preparing...', progress: 0 });

      // Create form data
      const formData = createGenerationFormData(generationData, uploadFiles);

      // Start generation
      const response = await apiMethods.generateTryOn(formData);

      if (response.success) {
        const resultWithMetadata = {
          ...response.result,
          generatedAt: new Date().toISOString(),
          modelInfo: selectedModel,
          poseInfo: selectedPose
        };

        setCurrentResult(resultWithMetadata);
        setSuccess('Try-on generated successfully!');

        // Add to results history and save to local storage
        const newHistory = [resultWithMetadata, ...generationResults.slice(0, 49)];
        setGenerationResults(newHistory);
        storageService.saveGeneration(resultWithMetadata);

        // Save successful log
        storageService.saveGenerationLog({
          ...logData,
          success: true,
          imageUrl: response.result.imageUrl,
          metadata: response.result.metadata
        });

        setGenerationProgress({ stage: 'Complete', progress: 100 });
      } else {
        throw new Error(response.error || 'Generation failed');
      }

    } catch (err) {
            setError(err.message || 'Failed to generate try-on image');

      // Save failed log
      storageService.saveGenerationLog({
        ...logData,
        success: false,
        error: err.message || 'Failed to generate try-on image'
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress({});
      }, 3000);
    }
  };

  const handleDownload = (imageUrl, filename = null) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || `tryon_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRetry = () => {
    if (currentResult) {
      // Retry with same parameters
      const lastGeneration = generationResults[0];
      if (lastGeneration && lastGeneration.metadata) {
        // Re-trigger generation with same settings
        setError(null);
        setSuccess(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/try-on360-logo.png" 
              alt="Try-On 360" 
              className="h-12 w-auto"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Home"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => window.location.href = '/logs'}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Generation Logs"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="History"
            >
              <History className="w-5 h-5" />
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">v2.6</p>
              <p className="text-xs text-gray-500">Enhanced</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Model Selection */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelSelect={setSelectedModel}
              selectedPose={selectedPose}
              onPoseSelect={handlePoseSelect}
            />

            {/* Upload Slots */}
            <SimpleUpload
              uploads={uploads}
              onUploadChange={handleUploadChange}
              onRemoveUpload={handleRemoveUpload}
              selectedPoseInfo={selectedPoseInfo}
            />

            {/* Generation Panel */}
            <GenerationPanel
              selectedModel={selectedModel}
              selectedPose={selectedPose}
              uploads={uploads}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
            />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            
            {/* Current Result */}
            {currentResult && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Result</h3>
                
                <div className="space-y-4">
                  {/* Generated Image */}
                  <div className="relative">
                    <img
                      src={API_CONFIG.buildImageUrl(currentResult.imageUrl)}
                      alt="Generated try-on"
                      className="w-full rounded-lg border shadow-sm"
                    />
                    
                    {/* Action buttons overlay */}
                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={() => handleDownload(API_CONFIG.buildImageUrl(currentResult.imageUrl))}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-700" />
                      </button>
                      
                      <button
                        onClick={handleRetry}
                        disabled={isGenerating}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors disabled:opacity-50"
                        title="Retry"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* Generation Info */}
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium">{currentResult.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{currentResult.metadata?.modelId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost:</span>
                      <span className="font-medium">${currentResult.metadata?.cost?.toFixed(3)}</span>
                    </div>
                    {currentResult.metadata?.processingTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{(currentResult.metadata.processingTime / 1000).toFixed(1)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Results History */}
            {generationResults.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Results</h3>
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all saved history?')) {
                        storageService.clearGenerationHistory();
                        setGenerationResults([]);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {generationResults.slice(1, 9).map((result, index) => (
                    <div
                      key={result.id || index}
                      onClick={() => setCurrentResult(result)}
                      className="relative cursor-pointer group"
                    >
                      <img
                        src={API_CONFIG.buildImageUrl(result.imageUrl)}
                        alt={`Result ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-md border group-hover:shadow-md transition-shadow"
                      />
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-md transition-colors">
                        {result.generatedAt && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <span className="text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
                              {new Date(result.generatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {generationResults.length > 9 && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    {generationResults.length} total saved • Showing recent 8
                  </p>
                )}
              </div>
            )}

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-1">Generation Error</h4>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-1">Success</h4>
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Instructions */}
            {!currentResult && !isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 mb-3">How to Use</h3>
                <ol className="text-sm text-blue-800 space-y-2">
                  <li>1. Select a professional model</li>
                  <li>2. Choose a pose for the model</li>
                  <li>3. Upload your product image</li>
                  <li>4. Add embroidery details (optional)</li>
                  <li>5. Select AI provider and generate</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TryOnStudio;