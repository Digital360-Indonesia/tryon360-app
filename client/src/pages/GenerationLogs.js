import React, { useState, useEffect } from 'react';
import { History, Trash2, Download, Calendar, DollarSign, BarChart3, Filter, Search, RefreshCw, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import apiMethods from '../services/api';

const GenerationLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(50);

  // Pricing per generation
  const PRICING = {
    'gemini_2_5_flash_image': 0.039, // Gemini 2.5 Flash Image
    'nano_banana': 0.136 // Gemini 3 Pro Image (Nano Banana)
  };

  // Load logs on mount and when page changes
  useEffect(() => {
    loadLogs();
  }, [currentPage]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading logs from API...');

      const response = await apiMethods.get(`/generation/logs?limit=${limit}&page=${currentPage}`);

      console.log('📦 Full API Response:', response);
      console.log('📦 Response.data:', response.data);
      console.log('✅ Response.data.success:', response.data?.success);
      console.log('📊 Response.data.data length:', response.data?.data?.length);

      // Axios wraps the response in response.data
      if (response.data && response.data.success) {
        setLogs(response.data.data || []);
        setTotalRecords(response.data.pagination?.total || 0);
        console.log('✅ Logs loaded successfully, total:', response.data.data?.length);
      } else {
        console.error('❌ API returned success=false or invalid response');
        setError('Failed to load logs');
      }
    } catch (err) {
      console.error('❌ Error loading logs:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      setError('Error loading logs: ' + err.message);
    } finally {
      setLoading(false);
      console.log('🏁 Loading finished');
    }
  };

  const clearAllLogs = async () => {
    if (window.confirm('Are you sure you want to clear all generation logs? This cannot be undone.')) {
      try {
        await apiMethods.delete('/generation/logs');
        setLogs([]);
        setTotalRecords(0);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error clearing logs:', err);
        alert('Failed to clear logs');
      }
    }
  };

  // Client-side filtering for current page
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.modelId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.pose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.provider?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvider = filterProvider === 'all' || log.provider === filterProvider;

    return matchesSearch && matchesProvider;
  });

  // Calculate totals based on total records from API
  const totalGenerations = totalRecords;
  const totalCost = logs.reduce((sum, log) => {
    return sum + (PRICING[log.provider] || 0);
  }, 0);

  // Calculate total pages
  const totalPages = Math.ceil(totalRecords / limit);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Format currency - Indonesian format with comma decimal separator
  const formatCost = (cost) => {
    return new Intl.NumberFormat('id-ID', {
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
  const getProviderName = (provider) => {
    const names = {
      'gemini_2_5_flash_image': 'Gemini 2.5 Flash Image',
      'nano_banana': 'Nano Banana Gemini 3 Pro'
    };
    return names[provider] || provider;
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.href = '/app'}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to App</span>
              </button>
              <button
                onClick={loadLogs}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={clearAllLogs}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

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
              <option value="gemini_2_5_flash_image">Gemini 2.5 Flash Image</option>
              <option value="nano_banana">Nano Banana Gemini 3 Pro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading logs...</h3>
            </div>
          ) : filteredLogs.length > 0 ? (
            <>
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
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.modelId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.pose?.replace('_', ' ') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getProviderName(log.provider)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCost(PRICING[log.provider] || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.status === 'completed' ? 'Success' : log.status === 'failed' ? 'Failed' : 'Processing'}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="First Page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Next Page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Last Page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
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