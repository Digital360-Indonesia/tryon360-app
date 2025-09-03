const express = require('express');
const axios = require('axios');

const router = express.Router();

// GET /api/test/models
// Test which OpenAI models are available
router.get('/models', async (req, res) => {
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    
    // Filter for image generation models
    const imageModels = response.data.data.filter(model => 
      model.id.includes('dall-e') || 
      model.id.includes('gpt-image') || 
      model.id.includes('image')
    );
    
    res.json({
      success: true,
      availableImageModels: imageModels.map(m => m.id),
      allModels: response.data.data.map(m => m.id)
    });
  } catch (error) {
    console.error('Error fetching models:', error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// GET /api/test/generate
// Test image generation with different models
router.get('/generate', async (req, res) => {
  try {
    const testPrompt = "A simple red apple on a white background";
    
    // Test GPT Image 1 first
    try {
      const gptResponse = await axios.post('https://api.openai.com/v1/images/generations', {
        model: 'gpt-image-1',
        prompt: testPrompt,
        size: '1024x1024',
        n: 1
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return res.json({
        success: true,
        message: 'GPT Image 1 is available!',
        model: 'gpt-image-1',
        testResult: 'SUCCESS'
      });
    } catch (gptError) {
      console.log('GPT Image 1 failed:', gptError.response?.data?.error?.message);
      
      // Test DALL-E 3 as fallback
      try {
        const dalleResponse = await axios.post('https://api.openai.com/v1/images/generations', {
          model: 'dall-e-3',
          prompt: testPrompt,
          quality: 'standard',
          size: '1024x1024',
          n: 1
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        return res.json({
          success: true,
          message: 'GPT Image 1 not available, but DALL-E 3 works',
          model: 'dall-e-3',
          testResult: 'FALLBACK_SUCCESS',
          gptError: gptError.response?.data?.error?.message
        });
      } catch (dalleError) {
        throw dalleError;
      }
    }
  } catch (error) {
    console.error('All image generation failed:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
      testResult: 'FAILED'
    });
  }
});

// GET /api/test/simple
// Test simple image generation without file saving
router.get('/simple', async (req, res) => {
  try {
    const OpenAIService = require('../services/openai');
    const openAI = new OpenAIService();
    
    const testPrompt = "Indonesian male model, 25 years old, wearing a navy blue t-shirt, professional studio photo";
    
    console.log('🧪 Testing simple image generation...');
    
    const result = await openAI.generateImage(testPrompt, {
      quality: 'standard',
      size: '1024x1024'
    });
    
    res.json({
      success: result.success,
      result: result,
      prompt: testPrompt
    });
  } catch (error) {
    console.error('Simple test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
