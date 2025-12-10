import React, { useState, useCallback, useRef } from 'react';
import { Upload, Image, AlertCircle, CheckCircle, Eye, Palette, Tag, Zap, Loader } from 'lucide-react';

const ProductUploadSection = ({ 
  onFileSelect, 
  onAnalysisComplete, 
  analysisResult, 
  isAnalyzing = false,
  allowManualAdjustment = true 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analysisExpanded, setAnalysisExpanded] = useState(false);
  const [manualAdjustments, setManualAdjustments] = useState({});
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelection = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Notify parent component
    onFileSelect(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleManualAdjustment = (field, value) => {
    const newAdjustments = { ...manualAdjustments, [field]: value };
    setManualAdjustments(newAdjustments);
    
    if (onAnalysisComplete && analysisResult) {
      // Merge manual adjustments with analysis result
      const adjustedResult = {
        ...analysisResult,
        manualAdjustments: newAdjustments,
        adjusted: true
      };
      onAnalysisComplete(adjustedResult);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-orange-500 bg-orange-50'
            : previewUrl
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Product preview"
                className="max-w-xs max-h-48 rounded-lg shadow-md"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Analyzing product...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                Change Image
              </button>
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setManualAdjustments({});
                  onFileSelect(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium text-gray-900">Upload Product Image</p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your garment image here, or click to browse
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Choose File
            </button>
            <p className="text-xs text-gray-400">
              Supports JPG, PNG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div 
            className="p-4 cursor-pointer flex items-center justify-between"
            onClick={() => setAnalysisExpanded(!analysisExpanded)}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {analysisResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-medium text-gray-900">Product Analysis</h3>
              </div>
              
              {analysisResult.success && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className={`font-medium ${getConfidenceColor(analysisResult.confidence)}`}>
                      {getConfidenceLabel(analysisResult.confidence)} Confidence
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({(analysisResult.confidence * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
            
            <Eye className={`w-5 h-5 text-gray-400 transition-transform ${analysisExpanded ? 'rotate-180' : ''}`} />
          </div>

          {analysisExpanded && analysisResult.success && (
            <div className="border-t border-gray-200 p-4 space-y-6">
              {/* Color Analysis */}
              {analysisResult.colors && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <h4 className="font-medium text-gray-900">Color Analysis</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Dominant Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.colors.dominantColors?.slice(0, 5).map((color, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: color.hex }}
                              title={`${color.name} (${color.percentage}%)`}
                            />
                            <span className="text-xs text-gray-600">{color.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Primary Color</p>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: analysisResult.colors.primaryColor?.hex }}
                        />
                        <div>
                          <p className="text-sm font-medium">{analysisResult.colors.primaryColor?.name}</p>
                          <p className="text-xs text-gray-500">{analysisResult.colors.primaryColor?.hex}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {allowManualAdjustment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manual Color Override
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Navy Blue, Forest Green"
                        value={manualAdjustments.primaryColor || ''}
                        onChange={(e) => handleManualAdjustment('primaryColor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Branding Analysis */}
              {analysisResult.branding && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Branding & Text</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Brand Detection</p>
                      <p className="text-sm text-gray-600">
                        {analysisResult.branding.structured?.brand_name !== 'Unknown' 
                          ? analysisResult.branding.structured.brand_name
                          : 'No brand detected'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Text Elements</p>
                      <p className="text-sm text-gray-600">
                        {analysisResult.branding.structured?.has_text 
                          ? 'Text detected'
                          : 'No text detected'
                        }
                      </p>
                    </div>
                  </div>

                  {analysisResult.branding.structured?.logo_description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Logo Description</p>
                      <p className="text-sm text-gray-600">{analysisResult.branding.structured.logo_description}</p>
                    </div>
                  )}

                  {allowManualAdjustment && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Brand Name Override
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Nike, Adidas"
                          value={manualAdjustments.brandName || ''}
                          onChange={(e) => handleManualAdjustment('brandName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Logo Description Override
                        </label>
                        <textarea
                          placeholder="Describe the logo or text elements"
                          value={manualAdjustments.logoDescription || ''}
                          onChange={(e) => handleManualAdjustment('logoDescription', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Structured Analysis */}
              {analysisResult.structured && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Image className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium text-gray-900">Product Details</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Garment Type</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {analysisResult.structured.garmentType?.replace('_', ' ') || 'Not detected'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Style</p>
                      <p className="text-sm text-gray-600">
                        {analysisResult.structured.style || 'Standard'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pattern</p>
                      <p className="text-sm text-gray-600">
                        {analysisResult.structured.hasPattern ? 'Patterned' : 'Solid'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Material</p>
                      <p className="text-sm text-gray-600">
                        {analysisResult.structured.material || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {allowManualAdjustment && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Garment Type
                          </label>
                          <select
                            value={manualAdjustments.garmentType || ''}
                            onChange={(e) => handleManualAdjustment('garmentType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">Auto-detected</option>
                            <option value="t_shirt">T-Shirt</option>
                            <option value="polo_shirt">Polo Shirt</option>
                            <option value="hoodie">Hoodie</option>
                            <option value="jacket">Jacket</option>
                            <option value="uniform_shirt">Uniform Shirt</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Material
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Cotton, Polyester"
                            value={manualAdjustments.material || ''}
                            onChange={(e) => handleManualAdjustment('material', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quality Assessment */}
              {analysisResult.quality && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Quality Assessment</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Image Quality</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(analysisResult.quality.qualityScore || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {((analysisResult.quality.qualityScore || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    {analysisResult.quality.recommendations && analysisResult.quality.recommendations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Recommendations</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {analysisResult.quality.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Adjustments Summary */}
              {Object.keys(manualAdjustments).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Manual Adjustments Applied</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    {Object.entries(manualAdjustments).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex items-center space-x-2">
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span>{value}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {analysisExpanded && !analysisResult.success && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Analysis Failed</p>
                  <p className="text-sm text-red-700 mt-1">
                    {analysisResult.error || 'Unable to analyze the product image. Please try uploading a different image.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductUploadSection;