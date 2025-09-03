const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { AI_PROVIDERS, GENERATION_SETTINGS } = require('../config/aiProviders');
const PromptBuilder = require('./promptBuilder');

class AIService {
  constructor() {
    this.providers = AI_PROVIDERS;
    this.settings = GENERATION_SETTINGS;
    this.promptBuilder = new PromptBuilder();
    
    // Initialize API keys from environment
    this.apiKeys = {
      flux_kontext: process.env.FLUX_API_KEY,
      chatgpt_image: process.env.OPENAI_API_KEY,
      gemini_flash: process.env.GEMINI_API_KEY
    };
  }

  /**
   * Generate try-on image using specified AI provider
   * @param {Object} request - Generation request
   * @param {string} request.providerId - AI provider to use
   * @param {string} request.modelId - Model ID
   * @param {string} request.pose - Pose selection
   * @param {string} request.garmentDescription - Garment description
   * @param {Array} request.embroideryDetails - Embroidery details
   * @param {Array} request.uploadedImages - Array of uploaded image paths
   * @returns {Object} Generation result
   */
  async generateTryOn(request) {
    const { providerId, modelId, pose, garmentDescription, embroideryDetails = [], uploadedImages = [] } = request;
    
    // Validate provider
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`AI provider ${providerId} not found`);
    }
    
    if (provider.status !== 'active') {
      throw new Error(`AI provider ${providerId} is not currently active`);
    }

    // Build prompt with product analysis if available
    const prompt = this.promptBuilder.buildTryOnPrompt({
      modelId,
      pose,
      garmentDescription,
      embroideryDetails,
      productAnalysis: request.productAnalysis || null
    });

    // Generate based on provider
    switch (providerId) {
      case 'flux_kontext':
        return await this.generateWithFlux(prompt, uploadedImages, request);
      
      case 'chatgpt_image':
        return await this.generateWithChatGPT(prompt, request);
      
      case 'gemini_flash':
        throw new Error('Gemini Flash 2.5 is not yet available');
      
      default:
        throw new Error(`Unsupported provider: ${providerId}`);
    }
  }

  /**
   * Generate image using Flux Kontext API
   * @param {string} prompt - Generation prompt
   * @param {Array} uploadedImages - Uploaded image paths
   * @param {Object} request - Original request
   * @returns {Object} Generation result
   */
  async generateWithFlux(prompt, uploadedImages, request) {
    const apiKey = this.apiKeys.flux_kontext;
    if (!apiKey) {
      throw new Error('Flux API key not configured');
    }

    // NEW APPROACH: Create composite image
    const ImageComposer = require('./imageComposer');
    const composer = new ImageComposer();
    
    // Get model reference photo
    const modelPhotoPath = path.join(__dirname, `../../../../model-list-new/${request.modelId}-1.png`);
    if (!fs.existsSync(modelPhotoPath)) {
      throw new Error(`Model reference photo not found: ${modelPhotoPath}`);
    }
    
    console.log('Creating composite image for FLUX...');
    
    // Get product image buffer
    let productBuffer = null;
    if (request.originalProductBuffer) {
      productBuffer = request.originalProductBuffer;
    } else if (uploadedImages.length > 0) {
      productBuffer = fs.readFileSync(uploadedImages[0]);
    } else {
      throw new Error('No product image provided');
    }
    
    // Get detail image buffer if available
    let detailBuffer = null;
    if (request.originalDetailBuffer) {
      detailBuffer = request.originalDetailBuffer;
    } else if (uploadedImages.length > 1) {
      detailBuffer = fs.readFileSync(uploadedImages[1]);
    }
    
    // Create composite image (face + product + detail)
    const compositeBuffer = await composer.combineFromBuffers(
      fs.readFileSync(modelPhotoPath),
      productBuffer,
      detailBuffer
    );
    
    // SAVE COMPOSITE FOR DEBUGGING - so you can see what's sent to FLUX
    const timestamp = Date.now();
    const compositeDebugPath = path.join(__dirname, '../../generated', `composite_debug_${timestamp}.jpg`);
    await composer.saveComposite(compositeBuffer, compositeDebugPath);
    console.log(`🔍 COMPOSITE SAVED FOR REVIEW: ${compositeDebugPath}`);
    
    // Convert to base64
    const compositeBase64 = composer.bufferToBase64(compositeBuffer);
    console.log('Composite image created successfully');
    
    // Build enhanced prompt for composite image
    const enhancedPrompt = this.buildCompositePrompt(request);
    
    // FLUX.1 Kontext Pro API format with composite
    const requestData = {
      prompt: enhancedPrompt,
      input_image: compositeBase64, // Single composite image
      aspect_ratio: '9:16', // Match our composite ratio
      safety_tolerance: 6, // More permissive for fashion content
      output_format: 'jpeg'
    };
    
    console.log('=== FLUX Kontext Pro Composite Request ===');
    console.log('Endpoint:', this.providers.flux_kontext.endpoint);
    console.log('Composite dimensions: 752x1392 (9:16)');
    console.log('Sections: Face (top) | Product (middle) | Detail (bottom)');
    console.log('Prompt length:', requestData.prompt.length);
    
    const config = {
      method: 'post',
      url: this.providers.flux_kontext.endpoint,
      headers: {
        'X-Key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Try-On-App/2.0'
      },
      data: requestData,
      timeout: this.settings.flux_kontext.timeout
    };

    try {
      const response = await axios(config);
      console.log('Black Forest Labs API response:', response.data);
      
      // FLUX Kontext Pro returns task ID and polling URL
      if (response.data.id && response.data.polling_url) {
        console.log('Task ID:', response.data.id);
        console.log('Polling URL:', response.data.polling_url);
        
        // Poll for completion using the provided polling_url
        const completedResponse = await this.pollFluxKontextGeneration(response.data.polling_url, apiKey);
        const imageUrl = completedResponse.result?.sample || completedResponse.sample;
        
        if (!imageUrl) {
          throw new Error('No image URL returned from Black Forest Labs API');
        }
        
        return {
          success: true,
          provider: 'flux_kontext',
          imageUrl: imageUrl,
          imagePath: await this.downloadAndSaveImage(imageUrl),
          prompt: prompt,
          metadata: {
            modelId: request.modelId,
            pose: request.pose,
            taskId: response.data.id,
            cost: this.calculateCost('flux_kontext', 'hd')
          }
        };
      } else {
        throw new Error('Invalid response from Black Forest Labs API');
      }
    } catch (error) {
      console.error('Black Forest Labs API error:', error.response?.data || error.message);
      throw new Error(`Flux generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image using ChatGPT/DALL-E API
   * @param {string} prompt - Generation prompt
   * @param {Object} request - Original request
   * @returns {Object} Generation result
   */
  async generateWithChatGPT(prompt, request) {
    const apiKey = this.apiKeys.chatgpt_image;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const config = {
      method: 'post',
      url: this.providers.chatgpt_image.endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'dall-e-3',
        prompt: prompt,
        quality: 'hd',
        size: '1024x1024',
        response_format: 'url',
        n: 1
      },
      timeout: this.settings.chatgpt_image.timeout
    };

    try {
      const response = await axios(config);
      const imageUrl = response.data.data[0].url;
      
      return {
        success: true,
        provider: 'chatgpt_image',
        imageUrl: imageUrl,
        imagePath: await this.downloadAndSaveImage(imageUrl),
        prompt: prompt,
        metadata: {
          modelId: request.modelId,
          pose: request.pose,
          revisedPrompt: response.data.data[0].revised_prompt,
          cost: this.calculateCost('chatgpt_image', 'hd')
        }
      };
    } catch (error) {
      throw new Error(`ChatGPT generation failed: ${error.message}`);
    }
  }

  /**
   * Download and save generated image locally
   * @param {string} imageUrl - URL of generated image
   * @returns {string} Local file path
   */
  async downloadAndSaveImage(imageUrl) {
    const timestamp = Date.now();
    const filename = `tryon_${timestamp}.jpg`;
    const filepath = path.join(__dirname, '../../generated', filename);
    
    // Ensure generated directory exists
    const generatedDir = path.dirname(filepath);
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filepath));
      writer.on('error', reject);
    });
  }

  /**
   * Calculate generation cost
   * @param {string} providerId - AI provider ID
   * @param {string} quality - Quality setting
   * @returns {number} Estimated cost in USD
   */
  calculateCost(providerId, quality) {
    const costs = {
      flux_kontext: { hd: 0.045, standard: 0.025 },
      chatgpt_image: { hd: 0.080, standard: 0.040 },
      gemini_flash: { hd: 0.030, standard: 0.015 }
    };

    return costs[providerId]?.[quality] || 0.05;
  }

  /**
   * Get available AI providers
   * @returns {Array} Array of available providers
   */
  getAvailableProviders() {
    return Object.values(this.providers)
      .filter(provider => provider.status === 'active')
      .map(provider => ({
        id: provider.id,
        name: provider.name,
        description: provider.description,
        supportsImageInput: provider.supportsImageInput
      }));
  }

  /**
   * Validate provider capabilities for request
   * @param {string} providerId - Provider ID
   * @param {Object} request - Generation request
   * @returns {Object} Validation result
   */
  validateProviderCapabilities(providerId, request) {
    const provider = this.providers[providerId];
    const errors = [];

    if (!provider) {
      errors.push(`Provider ${providerId} not found`);
      return { isValid: false, errors };
    }

    if (provider.status !== 'active') {
      errors.push(`Provider ${providerId} is not currently active`);
    }

    if (request.uploadedImages && request.uploadedImages.length > 0) {
      if (!provider.supportsImageInput) {
        errors.push(`Provider ${providerId} does not support image input`);
      }
    }

    if (!this.apiKeys[providerId]) {
      errors.push(`API key not configured for ${providerId}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get provider status and health
   * @param {string} providerId - Provider ID
   * @returns {Object} Provider status
   */
  async getProviderStatus(providerId) {
    const provider = this.providers[providerId];
    if (!provider) {
      return { status: 'not_found' };
    }

    // Basic health check - can be enhanced with actual API ping
    return {
      id: providerId,
      name: provider.name,
      status: provider.status,
      hasApiKey: !!this.apiKeys[providerId],
      rateLimit: provider.rateLimit,
      capabilities: {
        supportsImageInput: provider.supportsImageInput,
        maxImageSize: provider.maxImageSize,
        supportedFormats: provider.supportedFormats
      }
    };
  }

  /**
   * Poll FLUX Kontext Pro API for generation completion using polling_url
   * @param {string} pollingUrl - Polling URL from BFL API response
   * @param {string} apiKey - API key for authentication
   * @returns {Object} Completed generation result
   */
  async pollFluxKontextGeneration(pollingUrl, apiKey) {
    const maxAttempts = 90; // 90 attempts = 3 minutes max (BFL guidance: images expire in 10 minutes)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(pollingUrl, {
          headers: {
            'x-key': apiKey, // BFL uses lowercase x-key
            'User-Agent': 'Try-On-App/2.0'
          }
        });
        
        console.log(`Polling attempt ${attempts + 1}:`, response.data.status);
        
        if (response.data.status === 'Ready') {
          // Immediately download the image (URLs expire in 10 minutes)
          await this.downloadImageImmediately(response.data.result.sample);
          return response.data;
        } else if (response.data.status === 'Error') {
          throw new Error(`Generation failed: ${response.data.error || 'Unknown error'}`);
        } else if (response.data.status === 'Pending') {
          // Continue polling for Pending status
        } else {
          console.log('Unknown status:', response.data.status);
        }
        
        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
        
      } catch (error) {
        if (error.response?.status === 429) {
          // Rate limited - wait longer
          console.log('Rate limited, waiting 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          continue;
        } else if (error.response?.status === 404) {
          // Task not found yet, continue polling
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          continue;
        }
        throw error;
      }
    }
    
    throw new Error('Generation timeout: Task did not complete within 3 minutes');
  }

  /**
   * Download image immediately to avoid expiration (BFL guidance: 10 minute expiry)
   * @param {string} imageUrl - Image URL from BFL API
   */
  async downloadImageImmediately(imageUrl) {
    console.log('Downloading image immediately to avoid expiration:', imageUrl);
    // Note: downloadAndSaveImage method will handle this
  }

  /**
   * Convert image file to base64 data URL
   * @param {string} imagePath - Path to image file
   * @returns {string} Base64 data URL
   */
  async uploadImageToBase64(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
      
      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  /**
   * Build composite image prompt for section-based references
   * @param {Object} request - Generation request
   * @returns {string} Composite prompt
   */
  buildCompositePrompt(request) {
    const { PROFESSIONAL_MODELS } = require('../config/models');
    const model = PROFESSIONAL_MODELS[request.modelId];
    
    if (!model) {
      throw new Error(`Model ${request.modelId} not found`);
    }

    const gender = model.type === 'female' ? 'her' : 'him';
    const garmentType = request.garmentDescription || 'garment';
    
    // Use the detailed description from model config
    const modelDescription = model.detailedDescription || model.basePrompt;
    
    // CRITICAL: Emphasize exact facial replication first
    let prompt = `CRITICAL: Use the EXACT face from the top section - replicate ${model.name}'s face with 100% accuracy including facial features, skin tone, expression, and hair. This is the primary reference face that must be matched precisely.\n\n`;
    
    prompt += `Generate a professional portrait showing this exact person wearing the garment from the middle section of the reference image. Frame: head to just below the knees (3/4 body shot, DO NOT show feet).\n\n`;
    
    prompt += `**EXACT Model Face Requirements:**\n${modelDescription}\n`;
    prompt += `- MUST match the face from top section exactly - same facial structure, eyes, nose, mouth, skin tone\n`;
    prompt += `- Same hair style and color as shown in top reference\n`;
    prompt += `- Same expression and facial characteristics\n`;
    prompt += `- Proportional head size (not oversized)\n\n`;
    
    prompt += `**Garment Requirements:**\n`;
    prompt += `- Exact garment from middle section: colors, patterns, style, fit\n`;
    if (request.embroideryDetails && request.embroideryDetails.length > 0) {
      prompt += `- Include detail from bottom section: ${request.embroideryDetails[0].description}\n`;
    }
    prompt += `- Dark dress pants/trousers for professional look\n`;
    prompt += `- Proper garment fit and drape\n\n`;
    
    prompt += `**Composition & Framing:**\n`;
    prompt += `- 3/4 body portrait: head to just below knees (STOP at knees, no feet visible)\n`;
    prompt += `- Athletic build with confident professional stance\n`;
    prompt += `- Hands either at sides or casually in pockets\n`;
    prompt += `- Direct forward-facing pose\n\n`;
    
    prompt += `**Technical Specifications:**\n`;
    prompt += `- Professional studio photography with soft even lighting\n`;
    prompt += `- Clean white seamless background\n`;
    prompt += `- High-resolution commercial quality\n`;
    prompt += `- Sharp focus throughout\n`;
    prompt += `- Natural color reproduction\n\n`;
    
    prompt += `Create ONE seamless portrait that combines the exact face from top section with the exact garment from middle section. Ignore the vertical stacking layout - generate a single professional portrait. Priority: EXACT face matching is most critical.`;
    
    return prompt;
  }
}

module.exports = AIService;