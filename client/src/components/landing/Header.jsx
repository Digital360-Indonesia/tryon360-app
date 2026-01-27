import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import './Header.css';

const Header = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Check for logged in user
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user')) || null;
    if (token && userData) {
      setUser(userData);
    } else {
      setUser(null);
    }
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = mobileMenuOpen ? '' : 'hidden';
  };

  const toggleLangDropdown = (e) => {
    e.stopPropagation();
    setLangDropdownOpen(!langDropdownOpen);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const handleTryOnClick = (e) => {
    e.preventDefault();
    if (user) {
      // Already logged in - go to studio
      navigate('/studio');
    } else {
      // Not logged in - go to signup
      navigate('/signup');
    }
    closeMobileMenu();
  };

  useEffect(() => {
    const closeDropdown = () => setLangDropdownOpen(false);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) closeMobileMenu();
        if (langDropdownOpen) setLangDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, langDropdownOpen]);

  return (
    <header className="site-header">
      <nav className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <img
            src="/assets/landing/logo/tryon360-logo.png"
            alt="TryOn360"
            className="logo-img"
          />
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
          onClick={toggleMobileMenu}
        >
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>

        {/* Navigation Links */}
        <ul className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <li className="nav-item">
            <div className="lang-switcher">
              <button
                className="lang-btn"
                aria-label="Language switcher"
                aria-expanded={langDropdownOpen}
                onClick={toggleLangDropdown}
              >
                <span className="lang-current">{language.toUpperCase()}</span>
                <svg
                  className="lang-arrow"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3 5L6 8L9 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <ul className={`lang-dropdown ${langDropdownOpen ? 'open' : ''}`}>
                <li>
                  <button
                    className={`lang-option ${language === 'en' ? 'active' : ''}`}
                    onClick={() => handleLanguageChange('en')}
                  >
                    English
                  </button>
                </li>
                <li>
                  <button
                    className={`lang-option ${language === 'id' ? 'active' : ''}`}
                    onClick={() => handleLanguageChange('id')}
                  >
                    Bahasa
                  </button>
                </li>
              </ul>
            </div>
          </li>
          <li className="nav-item">
            <Link to="/pricing" className="nav-link nav-link-pricing" onClick={closeMobileMenu}>
              {language === 'id' ? 'Harga' : 'Pricing'}
            </Link>
          </li>
          <li className="nav-item">
            <button
              onClick={handleTryOnClick}
              className="nav-link nav-link-tryon"
            >
              {user ? `Hi, ${user.name?.split(' ')[0]}!` : 'TryOn360'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
