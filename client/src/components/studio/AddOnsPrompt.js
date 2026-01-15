import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Lightbulb } from 'lucide-react';

// ============================================
// ADD-ONS PROMPT COMPONENT
// ============================================
// Optional text input for custom enhancements
// Subtle single-line input that expands on focus

export function AddOnsPrompt({
  value = '',
  onChange,
  placeholder = "Add custom enhancements...",
  maxLength = 200,
  suggestions = [
    'Add golden embroidery on collar',
    'Pearl buttons on front placket',
    'Make fabric look like premium silk',
    'Add subtle shimmer effect',
    'Intricate lace trim on sleeves'
  ]
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    // Show suggestions only when empty
    if (!value) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay to allow suggestion clicks to register
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange?.(suggestion);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    onChange?.('');
    textareaRef.current?.focus();
  };

  const remainingChars = maxLength - value.length;

  return (
    <div ref={containerRef} className="relative">
      {/* Main Container */}
      <div
        className={`
          relative bg-white rounded-xl border-2 transition-all duration-200
          ${isFocused
            ? 'border-purple-400 ring-2 ring-purple-100 shadow-lg'
            : 'border-gray-200 hover:border-gray-300 shadow-sm'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">Smart Add-ons</h4>
          </div>

          {/* Character count */}
          {value.length > 0 && (
            <span className={`
              text-xs font-medium transition-colors
              ${remainingChars < 20 ? 'text-orange-500' : 'text-gray-400'}
            `}>
              {remainingChars} left
            </span>
          )}
        </div>

        {/* Input */}
        <div className="px-4 pb-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={1}
            className="
              w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-400
              border border-gray-200 rounded-lg resize-none
              focus:outline-none focus:ring-0 focus:border-transparent
              bg-gray-50 focus:bg-white transition-colors
              min-h-[44px] max-h-[120px]
            "
            style={{ height: isFocused && value ? 'auto' : '44px' }}
          />

          {/* Tip */}
          {isFocused && !value && (
            <div className="flex items-start gap-2 mt-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
              <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Click suggestions below or type custom enhancements for your garment</p>
            </div>
          )}

          {/* Clear button */}
          {value.length > 0 && (
            <button
              onClick={handleClear}
              className="absolute top-10 right-6 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && !value && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-purple-200 shadow-xl overflow-hidden">
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 px-2 py-1">Quick suggestions:</p>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors flex items-start gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddOnsPrompt;
