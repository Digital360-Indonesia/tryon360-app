// Debug script to test backend components
require('dotenv').config();
console.log('🔍 Debugging backend...');

try {
  // Test basic imports
  console.log('1. Testing basic imports...');
  const express = require('express');
  const cors = require('cors');
  console.log('✅ Express and CORS imported');

  // Test config imports
  console.log('2. Testing config imports...');
  const { KUSTOMPEDIA_MODELS, GARMENT_TYPES, QUALITY_SETTINGS } = require('./src/config/models');
  console.log('✅ Config imported');
  console.log('📊 Models count:', Object.keys(KUSTOMPEDIA_MODELS).length);
  console.log('📊 Garment types count:', Object.keys(GARMENT_TYPES).length);
  console.log('📊 Quality settings count:', Object.keys(QUALITY_SETTINGS).length);

  // Test OpenAI service
  console.log('3. Testing OpenAI service...');
  const OpenAIService = require('./src/services/openai');
  const openAI = new OpenAIService();
  console.log('✅ OpenAI service initialized');

  // Test routes
  console.log('4. Testing route imports...');
  const modelsRoutes = require('./src/routes/models');
  const tryOnRoutes = require('./src/routes/tryOn');
  console.log('✅ Routes imported');

  console.log('🎉 All components loaded successfully!');
  
} catch (error) {
  console.error('❌ Error during debug:', error);
  console.error('Stack trace:', error.stack);
}