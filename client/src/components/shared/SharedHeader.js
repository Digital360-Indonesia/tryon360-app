import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, LogOut, Image, Sparkles, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import api from '../../services/api'; // Not currently used

// ============================================
// SHARED HEADER COMPONENT
// ============================================
// Reusable header for Studio and Profile pages

export function SharedHeader({ activeTab, setActiveTab, tabs = [], showProfileDropdown = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    {
      label: 'Profile',
      description: 'Manage your account',
      onClick: () => navigate('/profile'),
    },
    // Show Users & Token menu only for admin
    ...(user.role === 'admin' ? [
      {
        label: 'Users & Token',
        description: 'Manage users and tokens',
        onClick: () => navigate('/admin/users-management'),
      },
    ] : []),
    {
      label: 'TryOn360',
      description: 'Go to generate tab',
      onClick: () => {
        setIsOpen(false);
        navigate('/studio');
      },
    },
    {
      label: 'Logout',
      description: 'Sign out of your account',
      onClick: handleLogout,
      icon: LogOut,
      isDanger: true,
    },
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-center px-6 py-4 relative">
        {/* Logo - absolute left */}
        <div
          className="absolute left-6 flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        >
          <img
            src="/try-on360-logo.png"
            alt="Try-On 360"
            className="h-10 w-auto"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback logo */}
          <div
            className="hidden items-center space-x-2"
            style={{ display: 'none' }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Image className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Try-On 360
            </span>
          </div>
        </div>

        {/* Center Tabs */}
        {tabs.length > 0 && (
          <nav className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && tab.badge !== undefined && (
                    <span className={`
                      ml-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Side - Profile Dropdown - absolute right */}
        {showProfileDropdown && (
          <div className="absolute right-6 flex items-center">
            <div ref={dropdownRef} className="relative">
              {/* Profile Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.name || 'Account'}
                    </p>
                    <p className="text-xs text-gray-500">{user.phoneNumber || 'Manage your settings'}</p>
                  </div>
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        item.onClick();
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        item.isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <div className="text-left">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className={`text-xs ${item.isDanger ? 'text-red-400' : 'text-gray-500'}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default SharedHeader;
