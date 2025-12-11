import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Tag, Shirt, FileImage } from 'lucide-react';

const UploadSlots = ({ uploads, onUploadChange, onRemoveUpload }) => {
  const [draggedOver, setDraggedOver] = useState(null);
  
  // File input refs for fallback
  const productInputRef = useRef(null);
  const detail1InputRef = useRef(null);
  const detail2InputRef = useRef(null);
  const detail3InputRef = useRef(null);

  // Helper function to handle file selection
  const handleFileSelect = (slotType, files) => {
        if (files && files.length > 0) {
      const file = files[0];
            onUploadChange(slotType, file);
    }
  };

  // Create individual dropzones for each slot
  const productDropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: false,
    noKeyboard: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
            handleFileSelect('product', acceptedFiles);
      setDraggedOver(null);
    },
    onDragEnter: () => {
            setDraggedOver('product');
    },
    onDragLeave: () => {
            setDraggedOver(null);
    },
    onError: (err) => {
          }
  });

  const detail1Dropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
            handleFileSelect('detail1', acceptedFiles);
      setDraggedOver(null);
    },
    onDragEnter: () => setDraggedOver('detail1'),
    onDragLeave: () => setDraggedOver(null)
  });

  const detail2Dropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
            handleFileSelect('detail2', acceptedFiles);
      setDraggedOver(null);
    },
    onDragEnter: () => setDraggedOver('detail2'),
    onDragLeave: () => setDraggedOver(null)
  });

  const detail3Dropzone = useDropzone({
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
            handleFileSelect('detail3', acceptedFiles);
      setDraggedOver(null);
    },
    onDragEnter: () => setDraggedOver('detail3'),
    onDragLeave: () => setDraggedOver(null)
  });

  const getSlotIcon = (slotType) => {
    switch (slotType) {
      case 'product': return Shirt;
      case 'detail1': return Tag;
      case 'detail2': return Tag;
      case 'detail3': return Tag;
      default: return FileImage;
    }
  };

  const getSlotTitle = (slotType) => {
    switch (slotType) {
      case 'product': return 'Product Overview';
      case 'detail1': return 'Embroidery Detail 1';
      case 'detail2': return 'Embroidery Detail 2'; 
      case 'detail3': return 'Embroidery Detail 3';
      default: return 'Upload';
    }
  };

  const getSlotDescription = (slotType) => {
    switch (slotType) {
      case 'product': return 'Main garment image (required)';
      case 'detail1': return 'First embroidery/print detail';
      case 'detail2': return 'Second embroidery/print detail';
      case 'detail3': return 'Third embroidery/print detail';
      default: return 'Upload file';
    }
  };

  const getInputRef = (slotType) => {
    switch (slotType) {
      case 'product': return productInputRef;
      case 'detail1': return detail1InputRef;
      case 'detail2': return detail2InputRef;
      case 'detail3': return detail3InputRef;
      default: return null;
    }
  };

  const UploadSlot = ({ slotType, dropzone, isRequired = false }) => {
    const IconComponent = getSlotIcon(slotType);
    const hasFile = uploads[slotType];
    const isDragging = draggedOver === slotType;
    const inputRef = getInputRef(slotType);

    return (
      <div className="relative">
        {/* Hidden file input for fallback */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
                        handleFileSelect(slotType, e.target.files);
          }}
          style={{ display: 'none' }}
        />

        {/* Required indicator */}
        {isRequired && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Required
            </span>
          </div>
        )}

        <div
          {...dropzone.getRootProps()}
          onClick={(e) => {
            e.preventDefault();
                        if (inputRef.current) {
              inputRef.current.click();
            }
          }}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : hasFile 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }
            ${hasFile ? 'min-h-[200px]' : 'min-h-[150px]'}
          `}
        >
          <input {...dropzone.getInputProps()} style={{ display: 'none' }} />
          
          {hasFile ? (
            // File uploaded state
            <div className="space-y-3">
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                                    onRemoveUpload(slotType);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Preview */}
              <div className="flex justify-center">
                <img
                  src={URL.createObjectURL(hasFile)}
                  alt={`${slotType} preview`}
                  className="max-w-full max-h-32 object-contain rounded-md border"
                />
              </div>
              
              {/* File info */}
              <div className="text-sm">
                <p className="font-medium text-gray-900 truncate">{hasFile.name}</p>
                <p className="text-gray-500">{(hasFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              
              {/* Upload another */}
              <p className="text-xs text-gray-500">Click or drag to replace</p>
            </div>
          ) : (
            // Empty state
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
                {isDragging ? (
                  <Upload className="w-6 h-6 text-blue-500" />
                ) : (
                  <IconComponent className="w-6 h-6 text-gray-400" />
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">{getSlotTitle(slotType)}</h4>
                <p className="text-sm text-gray-600 mb-2">{getSlotDescription(slotType)}</p>
                
                {isDragging ? (
                  <p className="text-sm font-medium text-blue-600">Drop your image here</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Click to upload or drag and drop<br />
                    JPEG, PNG, WebP (max 10MB)
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Image className="w-5 h-5 mr-2" />
        Upload Images
      </h3>

      <div className="space-y-6">
        {/* Product Upload - Required */}
        <div>
          <UploadSlot 
            slotType="product" 
            dropzone={productDropzone}
            isRequired={true}
          />
        </div>

        {/* Detail Uploads - Optional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UploadSlot slotType="detail1" dropzone={detail1Dropzone} />
          <UploadSlot slotType="detail2" dropzone={detail2Dropzone} />
          <UploadSlot slotType="detail3" dropzone={detail3Dropzone} />
        </div>

        {/* Upload Summary */}
        <div className="bg-gray-50 rounded-md p-4">
          <h5 className="font-medium text-gray-900 mb-2">Upload Summary</h5>
          <div className="space-y-1 text-sm">
            <p className={uploads.product ? 'text-green-600' : 'text-gray-500'}>
              Product Image: {uploads.product ? '✓ Uploaded' : 'Required'}
            </p>
            <p className={uploads.detail1 ? 'text-green-600' : 'text-gray-500'}>
              Detail 1: {uploads.detail1 ? '✓ Uploaded' : 'Optional'}
            </p>
            <p className={uploads.detail2 ? 'text-green-600' : 'text-gray-500'}>
              Detail 2: {uploads.detail2 ? '✓ Uploaded' : 'Optional'}
            </p>
            <p className={uploads.detail3 ? 'text-green-600' : 'text-gray-500'}>
              Detail 3: {uploads.detail3 ? '✓ Uploaded' : 'Optional'}
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-blue-50 rounded-md p-3 text-sm">
          <p className="font-medium text-blue-900 mb-1">Debug Info:</p>
          <p className="text-blue-700">Current uploads: {Object.keys(uploads).length}</p>
          <p className="text-blue-700">Check browser console (F12) for upload logs</p>
        </div>
      </div>
    </div>
  );
};

export default UploadSlots;