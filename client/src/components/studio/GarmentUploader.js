import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Check } from 'lucide-react';

// ============================================
// GARMENT UPLOADER COMPONENT
// ============================================
// Drag & drop zone for main garment (required)

// Truncate filename with ellipsis
const truncateFilename = (filename, maxLength = 30) => {
  if (!filename || filename.length <= maxLength) return filename;
  const ext = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - ext.length - 4);
  return `${truncatedName}...${ext}`;
};

const GarmentUploader = ({ onUpload, preview: propPreview, isRequired = true }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(propPreview || null);
  const [file, setFile] = useState(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFile(selectedFile);
      onUpload(selectedFile);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUpload(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Main Garment {isRequired && <span className="text-red-500">*</span>}
        </label>
        {file && (
          <span className="text-xs text-green-600 font-medium flex items-center">
            <Check className="w-3.5 h-3.5 mr-1" />
            Ready
          </span>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : preview
              ? 'border-green-400 bg-green-50 hover:border-green-500'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            {/* Preview Image */}
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Garment preview"
                className="max-w-full max-h-48 object-contain rounded-lg shadow-sm mx-auto"
              />
              <button
                onClick={handleRemove}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* File Info */}
            <div>
              <p className="font-medium text-gray-900 truncate" title={file.name}>
                {truncateFilename(file.name)}
              </p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {/* Change Link */}
            <p className="text-sm text-blue-600 font-medium hover:text-blue-700">
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
              isDragging ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {isDragging ? (
                <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>

            {/* Upload Text */}
            <div>
              <p className="font-semibold text-gray-900">
                {isDragging ? 'Drop your image here' : 'Upload Garment Image'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG, or WebP (max 10MB)
              </p>
            </div>

            {/* Required Badge */}
            {isRequired && (
              <div className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                Required
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Tips:</span> Use a high-quality image with good lighting for best results. Front view works best for most poses.
        </p>
      </div>
    </div>
  );
};

export default GarmentUploader;
