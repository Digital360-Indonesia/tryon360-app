import React from 'react';
import { Users } from 'lucide-react';

const ModelGallery = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-kustom-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Model Gallery</h2>
              <p className="text-sm text-gray-600">View and manage your available models</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Model Gallery</h3>
            <p className="mt-1 text-sm text-gray-500">
              Browse your 7 consistent models here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelGallery;
