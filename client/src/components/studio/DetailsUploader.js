import React, { useRef, useState } from 'react';
import { Plus, X, Tag, Upload as UploadIcon } from 'lucide-react';

// ============================================
// POSITION OPTIONS (from backend schema)
// ============================================
const POSITION_OPTIONS = [
  { id: 'chest_left', name: 'Chest Left', description: 'Left side of chest' },
  { id: 'chest_center', name: 'Chest Center', description: 'Center of chest' },
  { id: 'chest_right', name: 'Chest Right', description: 'Right side of chest' },
  { id: 'back_center', name: 'Back Center', description: 'Center of back' },
  { id: 'sleeve', name: 'Sleeve', description: 'Sleeve area' },
];

// ============================================
// DETAIL UPLOAD SLOT COMPONENT
// ============================================
const DetailSlot = ({ index, detail, onUpdate, onRemove }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdate({ ...detail, file: selectedFile, preview: reader.result });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUploadZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(index);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center">
          <Tag className="w-4 h-4 mr-1.5 text-purple-500" />
          Detail {index + 1}
        </h4>
        {detail.file && (
          <button
            onClick={handleRemove}
            className="p-1 hover:bg-red-50 rounded transition-colors"
            aria-label="Remove detail"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onClick={handleUploadZoneClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-purple-500 bg-purple-50'
            : detail.file
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
        />

        {detail.preview ? (
          <div className="space-y-2">
            <img
              src={detail.preview}
              alt={`Detail ${index + 1}`}
              className="max-w-full max-h-32 object-contain mx-auto rounded"
            />
            <p className="text-xs text-gray-600">Click or drag to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadIcon className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-medium text-gray-700">Upload detail image</p>
            <p className="text-xs text-gray-500">Click or drag & drop</p>
          </div>
        )}
      </div>

      {/* Position Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Position
        </label>
        <select
          value={detail.position}
          onChange={(e) => onUpdate({ ...detail, position: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          onClick={(e) => e.stopPropagation()}
        >
          {POSITION_OPTIONS.map((pos) => (
            <option key={pos.id} value={pos.id}>
              {pos.name}
            </option>
          ))}
        </select>
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={detail.description}
          onChange={(e) => onUpdate({ ...detail, description: e.target.value })}
          placeholder="e.g., Company logo, Embroidery..."
          className="w-full border border-gray-300 rounded-md px-2.5 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

// ============================================
// DETAILS UPLOADER COMPONENT
// ============================================
// Optional detail uploads with position/description (max 3 slots)

const DetailsUploader = ({ details = [], onDetailsChange, maxSlots = 3 }) => {
  const initializedDetails = Array.isArray(details) ? details : [];

  const handleAddSlot = () => {
    if (initializedDetails.length >= maxSlots) return;

    const newDetail = {
      file: null,
      preview: null,
      position: 'chest_left',
      description: '',
    };

    onDetailsChange([...initializedDetails, newDetail]);
  };

  const handleUpdateSlot = (index, updatedDetail) => {
    const newDetails = [...initializedDetails];
    newDetails[index] = updatedDetail;
    onDetailsChange(newDetails);
  };

  const handleRemoveSlot = (index) => {
    const newDetails = initializedDetails.filter((_, i) => i !== index);
    onDetailsChange(newDetails);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Detail Images <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <span className="text-xs text-gray-500">
          {initializedDetails.length} / {maxSlots} slots
        </span>
      </div>

      {/* Detail Slots */}
      <div className="space-y-3">
        {initializedDetails.map((detail, index) => (
          <DetailSlot
            key={detail.id || index}
            index={index}
            detail={detail}
            onUpdate={(updated) => handleUpdateSlot(index, updated)}
            onRemove={handleRemoveSlot}
          />
        ))}
      </div>

      {/* Add Slot Button */}
      {initializedDetails.length < maxSlots && (
        <button
          onClick={handleAddSlot}
          className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/30 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">Add Detail Slot</span>
        </button>
      )}

      {/* Usage Tips */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Usage Tips:</span> Upload close-up images of logos, embroidery, or prints. Specify where they should appear on the garment.
        </p>
      </div>
    </div>
  );
};

export default DetailsUploader;
