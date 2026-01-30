import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Signup.css';

const WHATSAPP_NUMBER = '6285156858298';
const WHATSAPP_MESSAGE = 'Halo kak saya mau buat akun untuk tryon360';

const Signup = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userExists, setUserExists] = useState(null); // null = not checked, true = exists, false = new
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    // Limit to 13 digits (max Indonesia phone number length)
    return numbers.substring(0, 13);
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
    // Reset user check when phone changes
    if (userExists !== null) {
      setUserExists(null);
    }
  };

  const checkPhoneNumber = async (e) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 8) {
      showMessage('error', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Check if phone number exists
      const response = await api.post('/auth/check-phone', {
        phoneNumber: phoneNumber
      });

      if (response.data.exists) {
        // User exists - show password field
        setUserExists(true);
        // Pre-fill name if available
        if (response.data.user?.name) {
          setName(response.data.user.name);
        }
      } else {
        // New user - redirect to WhatsApp
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
        window.open(whatsappUrl, '_blank');
        showMessage('info', 'Please contact us via WhatsApp to create your account');
      }
    } catch (error) {
      console.error('Error checking phone:', error);
      // If API fails, redirect to WhatsApp as fallback
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
      window.open(whatsappUrl, '_blank');
      showMessage('info', 'Please contact us via WhatsApp to create your account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 8) {
      showMessage('error', 'Please enter a valid phone number');
      return;
    }

    if (!password || password.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        phoneNumber: phoneNumber,
        password
      });

      // Store auth token and user data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Check if profile is complete
      if (!response.data.user.name) {
        navigate('/profile');
      } else {
        navigate('/studio');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('error', error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Logo */}
        <div className="signup-logo">
          <img
            src="/try-on360-logo.png"
            alt="Try-On 360"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* Heading */}
        <h1 className="signup-title">
          {userExists ? `Welcome back!` : 'Login/Signup to continue'}
        </h1>

        {/* Message */}
        {message.text && (
          <div className={`auth-message auth-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={userExists ? handleLogin : checkPhoneNumber} className="signup-form">
          {/* Phone Number Input */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="6281234567890"
              className="form-input"
              disabled={isLoading}
              autoComplete="tel"
            />
          </div>

          {/* Password Input - only show if user exists */}
          {userExists && (
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password-btn"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Name Display - read-only when logging in */}
          {userExists && name && (
            <div className="form-group">
              <label className="form-label">Name</label>
              <div className="name-display">
                <User className="w-4 h-4" />
                <span>{name}</span>
              </div>
            </div>
          )}

          {/* Continue/Login Button */}
          <button
            type="submit"
            className="continue-button"
            disabled={isLoading || !phoneNumber || (userExists && !password)}
          >
            {isLoading ? (
              'Checking...'
            ) : userExists ? (
              <>
                Login
                <ArrowRight className="arrow-icon" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="arrow-icon" />
              </>
            )}
          </button>
        </form>

        {/* Terms - only show for new users */}
        {!userExists && (
          <p className="terms-text">
            By continuing, you agree to our{' '}
            <a href="/terms" className="terms-link">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="terms-link">Privacy Policy</a>
          </p>
        )}

        {/* Back to home */}
        <p className="terms-text" style={{ marginTop: '16px' }}>
          <a href="/" className="terms-link">← Back to home</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
