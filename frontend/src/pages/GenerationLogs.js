import React, { useState, useEffect } from 'react';
import { History, Trash2, Download, Calendar, DollarSign, BarChart3, Filter, Search } from 'lucide-react';
import storageService from '../services/storage';

const GenerationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');

  // Pricing per generation
  const PRICING = {
    'flux_kontext': 0.039,
    'gemini_2_5_flash_image': 0.039, // Gemini 2.5 Flash Image
    'nano_banana': 0.136, // Gemini 3 Pro Image
    'imagen_4_ultra': 0.06 // Imagen 4.0 Ultra
  };

  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const savedLogs = storageService.getGenerationLogs();
    setLogs(savedLogs);
  };

  const clearAllLogs = () => {
    if (window.confirm('Are you sure you want to clear all generation logs? This cannot be undone.')) {
      storageService.clearGenerationLogs();
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.modelId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.pose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.providerId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvider = filterProvider === 'all' || log.providerId === filterProvider;

    return matchesSearch && matchesProvider;
  });

  // Calculate totals
  const totalGenerations = filteredLogs.length;
  const totalCost = filteredLogs.reduce((sum, log) => {
    return sum + (PRICING[log.providerId] || 0);
  }, 0);

  // Format currency
  const formatCost = (cost) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(cost);
  };

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Get provider display name
  const getProviderName = (providerId) => {
    const names = {
      'flux_kontext': 'Flux Kontext',
      'gemini_2_5_flash_image': 'Gemini 2.5 Flash Image',
      'nano_banana': 'Nano Banana Gemini 3 Pro',
      'imagen_4_ultra': 'Imagen 4.0 Ultra'
    };
    return names[providerId] || providerId;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Generation Logs</h1>
            </div>
            <button
              onClick={clearAllLogs}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Generations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalGenerations}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCost(totalCost)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Cost</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {totalGenerations > 0 ? formatCost(totalCost / totalGenerations) : '$0.000'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by model, pose, or provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Providers</option>
                <option value="flux_kontext">Flux Kontext</option>
                <option value="gemini_2_5_flash_image">Gemini 2.5 Flash Image</option>
                <option value="nano_banana">Nano Banana Gemini 3 Pro</option>
                <option value="imagen_4_ultra">Imagen 4.0 Ultra</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.modelId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.pose?.replace('_', ' ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getProviderName(log.providerId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCost(PRICING[log.providerId] || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.imageUrl && (
                          <button
                            onClick={() => window.open(log.imageUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="View Image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No generation logs found</h3>
              <p className="text-gray-500">Start generating images to see logs here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationLogs;