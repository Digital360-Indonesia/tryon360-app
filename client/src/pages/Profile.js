import React, { useState, useEffect } from 'react';
import { User, History, Lock, Save, Eye, EyeOff, CreditCard, ArrowRight } from 'lucide-react';
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
      label: 'Purchase History',
      icon: History,
    },
  ];

  // Load purchase history on mount
  useEffect(() => {
    if (activeTab === 'history') {
      loadPurchaseHistory();
    }
  }, [activeTab]);

  const loadPurchaseHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signup');
        return;
      }

      // TODO: Replace with actual API call
      // const response = await api.get('/auth/purchases', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setHistoryData(response.data.purchases);

      // Mock data for now
      setHistoryData([
        // Empty initially
      ]);
    } catch (error) {
      console.error('Failed to load purchase history:', error);
      setMessage({ type: 'error', text: 'Failed to load purchase history' });
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
        <div className="history-header">
          <h2 className="section-title">Purchase History</h2>
          <button
            onClick={() => navigate('/pricing')}
            className="topup-button"
          >
            <CreditCard className="w-4 h-4" />
            Top Up
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {historyLoading ? (
          <div className="loading-state">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p>Loading purchase history...</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="empty-state">
            <History className="w-16 h-16 text-gray-300" />
            <p className="empty-state-text">No purchase history yet</p>
            <button
              onClick={() => navigate('/pricing')}
              className="start-generating-btn"
            >
              Top Up Credits
            </button>
          </div>
        ) : (
          <div className="history-list">
            {historyData.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-image">
                  <img src={item.image} alt={item.item} onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                  }} />
                </div>
                <div className="history-item-details">
                  <h3 className="history-item-name">{item.item}</h3>
                  <p className="history-item-date">{item.date}</p>
                </div>
                <div className="history-item-right">
                  <p className="history-item-amount">{item.amount}</p>
                  <span className={`history-status ${item.status}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
