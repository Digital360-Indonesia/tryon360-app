import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    // TODO: Send phone number to backend
    try {
      // const response = await api.post('/auth/send-otp', { phoneNumber });
      console.log('Phone number submitted:', phoneNumber);

      // Navigate to OTP verification page
      // navigate('/verify-otp', { state: { phoneNumber } });

      // For now, just redirect to studio
      setTimeout(() => {
        navigate('/studio');
      }, 1000);
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    // Only allow numbers and some formatting characters
    const value = e.target.value.replace(/[^\d+\-\s()]/g, '');
    setPhoneNumber(value);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left Side - Form */}
        <div className="signup-form-side">
          <div className="signup-content">
            {/* Logo/Brand */}
            <div className="signup-logo">
              <img src="/try-on360-logo.png" alt="Try-On 360" />
            </div>

            <h1 className="signup-title">
              Start your 7-day free trial
            </h1>

            <p className="signup-subtitle">
              No credit card required. Cancel anytime.
            </p>

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="phone-input-group">
                <label htmlFor="phone" className="phone-label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="+62 812-3456-7890"
                  className="phone-input"
                  disabled={isLoading}
                />
                <p className="phone-hint">
                  We'll send you a verification code
                </p>
              </div>

              <button
                type="submit"
                className="continue-button"
                disabled={isLoading || !phoneNumber}
              >
                {isLoading ? (
                  'Sending...'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="arrow-icon" />
                  </>
                )}
              </button>
            </form>

            <p className="terms-text">
              By continuing, you agree to our{' '}
              <a href="/terms" className="terms-link">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="terms-link">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="signup-illustration-side">
          <div className="illustration-container">
            <img
              src="/assets/signup-illustration.png"
              alt="Signup Illustration"
              className="illustration-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
