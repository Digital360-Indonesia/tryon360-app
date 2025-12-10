import React, { useState, useEffect } from 'react';
import { Bell, Settings, User, CreditCard, Wand2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import apiService from '../services/api';

const Header = () => {
  const [queueStatus, setQueueStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    // Fetch queue status on mount
    fetchQueueStatus();
    
    // Set up interval to refresh queue status
    const interval = setInterval(fetchQueueStatus, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchQueueStatus = async () => {
    try {
      const response = await apiService.getQueueStatus();
      setQueueStatus(response);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching queue status:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and Navigation */}
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Kustompedia Try-On Platform
            </h1>
            <p className="text-sm text-gray-500">
              AI-Powered Garment Visualization Tool
            </p>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-4">
            <Link 
              to="/generate" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' || location.pathname === '/generate' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Wand2 className="h-4 w-4" />
              <span>Generator</span>
            </Link>
            
            <Link 
              to="/credits" 
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/credits' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Credits</span>
            </Link>
          </nav>
          
          {/* Queue Status Indicator */}
          {queueStatus && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">
                  {queueStatus.totalSlots - queueStatus.availableSlots}/{queueStatus.totalSlots} slots active
                </span>
              </div>
              
              {queueStatus.queueLength > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">
                    {queueStatus.queueLength} in queue
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Stats and Controls */}
        <div className="flex items-center space-x-4">
          {/* Performance Stats */}
          {queueStatus && (
            <div className="text-sm text-gray-600">
              <span>✅ {queueStatus.completedToday}</span>
              <span className="mx-2">•</span>
              <span>❌ {queueStatus.failedToday}</span>
            </div>
          )}
          
          {/* Last Updated */}
          <div className="text-xs text-gray-400">
            Updated: {formatTime(lastUpdated)}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
