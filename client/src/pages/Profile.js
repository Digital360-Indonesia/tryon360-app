import React, { useState, useEffect } from 'react';
import { User, History, Lock, Save, Eye, EyeOff, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SharedHeader } from '../components/shared/SharedHeader';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [name, setName] = useState(user.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [tokens, setTokens] = useState(user.tokens || 0);
  const [role, setRole] = useState(user.role || 'user');

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Purchase history data
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Tabs config
  const tabs = [
    {
      id: 'account',
      label: 'Account',
      icon: User,
    },
    {
      id: 'history',
      label: 'Token History',
      icon: History,
    },
  ];

  // Load purchase history on mount
  useEffect(() => {
    if (activeTab === 'history') {
      loadPurchaseHistory();
    }
  }, [activeTab]);

  // Load current user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        navigate('/signup');
        return;
      }

      try {
        const response = await fetch('http://localhost:9901/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.user) {
          setTokens(data.user.tokens);
          setRole(data.user.role);
          setName(data.user.name || name);
          setPhoneNumber(data.user.phoneNumber || phoneNumber);

          // Update localStorage
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, [navigate]);

  const loadPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signup');
        return;
      }

      // Load user's token transactions from API
      const response = await api.get('/auth/token-history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHistoryData(response.data.transactions);
      }
    } catch (error) {
      console.error('Failed to load token history:', error);
      setMessage({ type: 'error', text: 'Failed to load token history' });
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    if (!name || name.trim().length < 2) {
      showMessage('error', 'Name must be at least 2 characters');
      return;
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      showMessage('error', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await api.put('/auth/profile', {
        name,
        phoneNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update localStorage
      const updatedUser = { ...user, name, phoneNumber };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      await api.put('/auth/password', {
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showMessage('success', 'Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderAccountTab = () => (
    <div className="profile-content profile-content-grid">
      {/* Profile Setup Notice */}
      {(!user.name || !user.phoneNumber) && (
        <div className="profile-setup-notice">
          <p>Please complete your profile before generating.</p>
        </div>
      )}

      {/* Personal Information - Left */}
      <section className="profile-section profile-section-left">
        <h2 className="section-title">Personal Information</h2>
        <form onSubmit={handleProfileSave} className="profile-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').substring(0, 13))}
              placeholder="6281234567890"
              className="form-input"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="save-button"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </section>

      {/* Change Password - Right */}
      <section className="profile-section profile-section-right">
        <h2 className="section-title">
          <Lock className="w-5 h-5" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="profile-form">
          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showPasswords.new ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="form-input"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="toggle-password-btn"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">
              Confirm New Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="form-input"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="toggle-password-btn"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="save-button"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : (
              <>
                <Lock className="w-4 h-4" />
                Update Password
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="profile-content">
      <section className="profile-section">
        {/* Token Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">💰 Current Balance</p>
              <p className="text-4xl font-bold mt-1">{tokens}</p>
              <p className="text-blue-100 text-sm mt-2">tokens available</p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Top Up
            </button>
          </div>
        </div>

        <div className="history-header">
          <h2 className="section-title">Token History</h2>
        </div>

        {historyLoading ? (
          <div className="loading-state">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p>Loading token history...</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="empty-state">
            <History className="w-16 h-16 text-gray-300" />
            <p className="empty-state-text">No token history yet</p>
            <button
              onClick={() => navigate('/pricing')}
              className="start-generating-btn"
            >
              Top Up Tokens
            </button>
          </div>
        ) : (
          <div className="history-list">
            {historyData.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-details">
                  <h3 className="history-item-name">
                    {item.description || (item.type === 'added' ? 'Tokens Added' : item.type === 'used' ? 'Generation' : 'Refund')}
                  </h3>
                  <p className="history-item-date">
                    {new Date(item.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="history-item-right">
                  <p className={`history-item-amount ${item.type === 'added' ? 'text-green-600' : item.type === 'used' ? 'text-red-600' : 'text-blue-600'}`}>
                    {item.type === 'added' ? '+' : item.type === 'used' ? '-' : ''}{item.amount} tokens
                  </p>
                  <span className={`history-badge ${item.type}`}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  return (
    <div className="profile-page-full">
      {/* Shared Header */}
      <SharedHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        showProfileDropdown={true}
      />

      {/* Message */}
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Content - Non-scrollable */}
      <div className="profile-container-full">
        {activeTab === 'account' ? renderAccountTab() : renderHistoryTab()}
      </div>
    </div>
  );
};

export default Profile;
