import React, { useRef } from 'react';
import { X, Image, Tag, Shirt } from 'lucide-react';

const SimpleUpload = ({ uploads, onUploadChange, onRemoveUpload, selectedPoseInfo }) => {
  const productRef = useRef(null);
  const detail1Ref = useRef(null);
  const detail2Ref = useRef(null);
  const detail3Ref = useRef(null);

  const handleFileChange = (slotType, event) => {
    const file = event.target.files[0];
    if (file) {
            onUploadChange(slotType, file);
    }
  };

  const UploadSlot = ({ slotType, inputRef, icon: Icon, title, description, required = false, disabled = false }) => {
    const hasFile = uploads[slotType];
    const isDisabled = disabled || (slotType === 'detail2' || slotType === 'detail3'); // v2.6: disable detail2 & detail3

    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => handleFileChange(slotType, e)}
          style={{ display: 'none' }}
          disabled={isDisabled}
        />

        {required && !isDisabled && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Required
            </span>
          </div>
        )}

        {isDisabled && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              v2.6+
            </span>
          </div>
        )}

        <div
          onClick={() => !isDisabled && inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${isDisabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
              : hasFile 
                ? 'border-green-500 bg-green-50 cursor-pointer' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
            }
            min-h-[150px]
          `}
        >
          {hasFile ? (
            <div className="space-y-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveUpload(slotType);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex justify-center">
                <img
                  src={URL.createObjectURL(hasFile)}
                  alt={`${slotType} preview`}
                  className="max-w-full max-h-32 object-contain rounded border"
                />
              </div>
              
              <div className="text-sm">
                <p className="font-medium text-gray-900">{hasFile.name}</p>
                <p className="text-gray-500">{(hasFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
                <Icon className="w-6 h-6 text-gray-400" />
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600 mb-2">{description}</p>
                <p className="text-sm text-blue-600 font-medium">Click to upload image</p>
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
        Upload Images (Simple Mode)
      </h3>

      <div className="space-y-6">
        <UploadSlot 
          slotType="product"
          inputRef={productRef}
          icon={Shirt}
          title="Product Overview"
          description={
            selectedPoseInfo?.requiresBackPhoto 
              ? "Main garment image (required) - Upload back view for Look Over Shoulder pose"
              : "Main garment image (required)"
          }
          required={true}
        />
        
        {selectedPoseInfo?.requiresBackPhoto && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-block w-2 h-2 bg-orange-400 rounded-full"></span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800">
                  Back Photo Recommended
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  For the "{selectedPoseInfo.name}" pose, upload the back view of your garment to show the complete look.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UploadSlot 
            slotType="detail1"
            inputRef={detail1Ref}
            icon={Tag}
            title="Detail 1"
            description="Embroidery/print detail"
          />
          <UploadSlot 
            slotType="detail2"
            inputRef={detail2Ref}
            icon={Tag}
            title="Detail 2"
            description="Embroidery/print detail"
          />
          <UploadSlot 
            slotType="detail3"
            inputRef={detail3Ref}
            icon={Tag}
            title="Detail 3"
            description="Embroidery/print detail"
          />
        </div>

        <div className="bg-green-50 rounded-md p-3 text-sm">
          <p className="font-medium text-green-900">✓ Simple Upload Mode Active</p>
          <p className="text-green-700">Uploads: {Object.keys(uploads).length} files selected</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleUpload;