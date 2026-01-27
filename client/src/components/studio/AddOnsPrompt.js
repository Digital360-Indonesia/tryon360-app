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
  maxLength = 100,
  suggestions = [
    'Add red hats',
    'Use sunglasses',
    'Make model do running pose'
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
      {/* Simplified Container - no card within card */}
      <div className="relative">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
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
        <div className="relative">
          <div
            className={`
              rounded-xl border-2 transition-all duration-200
              ${isFocused
                ? 'border-gray-400 ring-2 ring-gray-100'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
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
                w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400
                rounded-xl resize-none
                focus:outline-none focus:ring-0 focus:border-transparent
                bg-white transition-colors
                min-h-[44px] max-h-[120px] pr-10
              "
              style={{ height: isFocused && value ? 'auto' : '44px' }}
            />

            {/* Clear button */}
            {value.length > 0 && (
              <button
                onClick={handleClear}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-2 mt-2 text-xs text-gray-600">
          <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Click suggestions above or type custom enhancements for your garment</p>
        </div>
      </div>

      {/* Suggestions Dropdown - drops UP */}
      {showSuggestions && !value && (
        <div className="absolute z-10 w-full bottom-full mb-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 px-2 py-1">Quick suggestions:</p>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-start gap-2"
              >
                <Sparkles className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
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
