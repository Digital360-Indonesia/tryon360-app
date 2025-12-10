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
      gemini_flash: process.env.GEMINI_API_KEY,
      nano_banana: process.env.GEMINI_API_KEY, // Uses same Gemini API key
      gemini_2_5_flash_image: process.env.GEMINI_API_KEY, // Uses same Gemini API key
      imagen_4_ultra: process.env.GEMINI_API_KEY // Uses same Gemini API key
    };

    // Ensure generated directory exists
    this.ensureDirectoriesExist();
  }

  /**
   * Get the correct generated directory path based on environment
   */
  getGeneratedDir() {
    return process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, '../../data/generated')  // In production, use /app/data/generated
      : path.join(__dirname, '../../generated');      // In development, use /app/generated
  }

  /**
   * Create a hash code from a string for deterministic seeds
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectoriesExist() {
    const generatedDir = this.getGeneratedDir();
    
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
      console.log(`📁 Created generated directory: ${generatedDir}`);
    }
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

    // Generate based on provider with retry logic
    const retrySettings = this.settings[providerId];
    switch (providerId) {
      case 'flux_kontext':
        return await this.retryWithBackoff(
          () => this.generateWithFlux(prompt, uploadedImages, request),
          retrySettings.retries,
          providerId
        );
      
      case 'chatgpt_image':
        return await this.generateWithChatGPT(prompt, request);
      
      case 'gemini_2_5_flash_image':
      case 'nano_banana':
        return await this.retryWithBackoff(
          () => this.generateWithNanoBanana(prompt, uploadedImages, request),
          retrySettings.retries,
          providerId
        );

      case 'imagen_4_ultra':
        return await this.retryWithBackoff(
          () => this.generateWithImagen4Ultra(prompt, uploadedImages, request),
          retrySettings.retries,
          providerId
        );
      
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
    
    // Get model reference photo (check for both .jpg and .png)
    const modelPhotoPathJpg = path.join(__dirname, `../../models/${request.modelId}-reference.jpg`);
    const modelPhotoPathPng = path.join(__dirname, `../../models/${request.modelId}-reference.png`);
    let modelPhotoPath = null;

    if (fs.existsSync(modelPhotoPathJpg)) {
      modelPhotoPath = modelPhotoPathJpg;
    } else if (fs.existsSync(modelPhotoPathPng)) {
      modelPhotoPath = modelPhotoPathPng;
    }

    if (!modelPhotoPath) {
      throw new Error(`Model reference photo not found: Tried ${modelPhotoPathJpg} and ${modelPhotoPathPng}`);
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
    const compositeDebugPath = path.join(this.getGeneratedDir(), `composite_debug_${timestamp}.jpg`);
    await composer.saveComposite(compositeBuffer, compositeDebugPath);
    console.log(`🔍 COMPOSITE SAVED FOR REVIEW: ${compositeDebugPath}`);
    
    // Convert to base64 - Flux needs raw base64 without data URL prefix
    const compositeBase64WithPrefix = composer.bufferToBase64(compositeBuffer);
    // Remove the data URL prefix for Flux API
    const compositeBase64 = compositeBase64WithPrefix.replace(/^data:image\/\w+;base64,/, '');
    console.log('Composite image created successfully');
    console.log('Base64 format: raw (no data URL prefix)');
    
    // Build enhanced prompt for composite image
    const enhancedPrompt = this.buildCompositePrompt(request);
    
    // FLUX.1 Kontext Pro API format with composite
    const fluxParams = this.settings.flux_kontext.parameters;
    
    // Create truly deterministic seed from image + prompt content
    const imageHash = this.hashCode(compositeBase64.slice(0, 1000)); // Use first 1000 chars of image
    const promptHash = this.hashCode(enhancedPrompt);
    const seed = Math.abs(imageHash + promptHash) % 2147483647;
    
    const requestData = {
      prompt: enhancedPrompt,
      input_image: compositeBase64, // Raw base64 without prefix
      aspect_ratio: '9:16', // Match our composite ratio
      safety_tolerance: 6, // More permissive for fashion content
      output_format: 'jpeg',
      seed: seed // Deterministic seed based on actual image + prompt content
    };
    
    console.log('=== FLUX Kontext Pro Composite Request ===');
    console.log('Endpoint:', this.providers.flux_kontext.endpoint);
    console.log('Composite dimensions: 752x1392 (9:16)');
    console.log('Sections: Face (top) | Product (middle) | Detail (bottom)');
    console.log('Base64 length:', compositeBase64.length, 'characters');
    console.log('Prompt length:', requestData.prompt.length);
    console.log('Generation Parameters:', {
      seed: requestData.seed,
      guidance_scale: requestData.guidance_scale,
      num_inference_steps: requestData.num_inference_steps,
      strength: requestData.strength,
      safety_tolerance: requestData.safety_tolerance,
      aspect_ratio: requestData.aspect_ratio,
      output_format: requestData.output_format
    });
    console.log('\n=== FULL PROMPT BEING SENT TO FLUX ===');
    console.log(requestData.prompt);
    console.log('=== END OF PROMPT ===\n');
    
    // SAVE PROMPT TO FILE FOR REVIEW (use SAME timestamp as composite debug)
    const promptFilePath = path.join(this.getGeneratedDir(), `prompt_${timestamp}.txt`);
    fs.writeFileSync(promptFilePath, `Generation Timestamp: ${new Date().toISOString()}\n` +
                                     `Model: ${request.modelId}\n` +
                                     `Pose: ${request.pose || 'professional_standing'}\n` +
                                     `Composite Image: composite_debug_${timestamp}.jpg\n` +
                                     `\n=== PROMPT SENT TO FLUX ===\n\n` +
                                     requestData.prompt);
    console.log(`📝 PROMPT SAVED FOR REVIEW: ${promptFilePath}`);
    
    // Add session consistency to reduce server-switching issues
    const sessionId = `${request.modelId}_${Date.now()}`;
    const config = {
      method: 'post',
      url: this.providers.flux_kontext.endpoint,
      headers: {
        'x-key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': `Try-On-App/2.0-${sessionId}`,
        'x-request-id': sessionId
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
      
      // Check if it's a retryable error
      const isRetryable = this.isRetryableError(error);
      if (isRetryable) {
        console.log('Error is retryable, will be handled by retry logic');
      }
      
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
   * Generate image using Nano Banana (Gemini 2.5 Flash Image Preview) API
   * @param {string} prompt - Generation prompt
   * @param {Array} uploadedImages - Uploaded image paths
   * @param {Object} request - Original request
   * @returns {Object} Generation result
   */
  async generateWithNanoBanana(prompt, uploadedImages, request) {
    const apiKey = this.apiKeys.nano_banana;
    if (!apiKey) {
      throw new Error('Gemini API key not configured for Nano Banana');
    }

    // Create composite image similar to Flux approach
    const ImageComposer = require('./imageComposer');
    const composer = new ImageComposer();
    
    // Get model reference photo (check for both .jpg and .png)
    const modelPhotoPathJpg = path.join(__dirname, `../../models/${request.modelId}-reference.jpg`);
    const modelPhotoPathPng = path.join(__dirname, `../../models/${request.modelId}-reference.png`);
    let modelPhotoPath = null;

    if (fs.existsSync(modelPhotoPathJpg)) {
      modelPhotoPath = modelPhotoPathJpg;
    } else if (fs.existsSync(modelPhotoPathPng)) {
      modelPhotoPath = modelPhotoPathPng;
    }

    if (!modelPhotoPath) {
      throw new Error(`Model reference photo not found: Tried ${modelPhotoPathJpg} and ${modelPhotoPathPng}`);
    }
    
    console.log('Creating composite image for Nano Banana...');
    
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
    
    // Save composite for debugging
    const timestamp = Date.now();
    const compositeDebugPath = path.join(this.getGeneratedDir(), `composite_nanobana_${timestamp}.jpg`);
    await composer.saveComposite(compositeBuffer, compositeDebugPath);
    console.log(`🍌 NANO BANANA COMPOSITE SAVED: ${compositeDebugPath}`);
    
    // Convert to base64 without data URL prefix (Gemini expects raw base64)
    const compositeBase64 = compositeBuffer.toString('base64');
    
    // Build enhanced prompt for composite image
    const enhancedPrompt = this.buildCompositePrompt(request);
    
    // Nano Banana API request format
    const requestData = {
      contents: [{
        parts: [
          {
            text: `${enhancedPrompt}\n\nIMPORTANT: Generate a high-quality, photorealistic image based on the composite input. The result should be a single cohesive image showing the model wearing the garment with all specified details.`
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: compositeBase64
            }
          }
        ]
      }],
      generationConfig: {
        temperature: this.settings.nano_banana?.parameters?.temperature || 0.7,
        candidateCount: this.settings.nano_banana?.parameters?.candidate_count || 1,
        responseModalities: ["TEXT", "IMAGE"]
      },
      safetySettings: this.settings.nano_banana?.parameters?.safety_settings || []
    };
    
    console.log('=== NANO BANANA (Gemini 2.5 Flash Image) Request ===');
    console.log('Endpoint:', this.providers.nano_banana.endpoint);
    console.log('Composite dimensions: 752x1392 (9:16)');
    console.log('Sections: Face (top) | Product (middle) | Detail (bottom)');
    console.log('Prompt length:', enhancedPrompt.length);
    
    // Save prompt to file for review
    const promptFilePath = path.join(this.getGeneratedDir(), `prompt_nanobana_${timestamp}.txt`);
    fs.writeFileSync(promptFilePath, `Generation Timestamp: ${new Date().toISOString()}\n` +
                                     `Model: ${request.modelId}\n` +
                                     `Pose: ${request.pose || 'professional_standing'}\n` +
                                     `Composite Image: composite_nanobana_${timestamp}.jpg\n` +
                                     `\n=== PROMPT SENT TO NANO BANANA ===\n\n` +
                                     enhancedPrompt);
    console.log(`🍌 NANO BANANA PROMPT SAVED: ${promptFilePath}`);
    
    const config = {
      method: 'post',
      url: this.providers.nano_banana.endpoint,
      headers: {
        'x-goog-api-key': apiKey, // Gemini uses different header format
        'Content-Type': 'application/json'
      },
      data: requestData,
      timeout: this.settings.nano_banana.timeout
    };

    try {
      const response = await axios(config);
      console.log('Nano Banana API response received');
      console.log('📋 FULL RESPONSE STRUCTURE:', JSON.stringify(response.data, null, 2));
      
      // Extract generated image from response
      if (response.data?.candidates?.[0]?.content?.parts) {
        const parts = response.data.candidates[0].content.parts;
        
        // Look through all parts to find an image
        for (const part of parts) {
          // Check if we got an image response (try both possible field names)
          if (part.inline_data?.data || part.inlineData?.data) {
            // Convert base64 to buffer and save
            const imageData = part.inline_data?.data || part.inlineData?.data;
            const imageBuffer = Buffer.from(imageData, 'base64');
            const outputPath = path.join(this.getGeneratedDir(), `tryon_nanobana_${timestamp}.jpg`);
            fs.writeFileSync(outputPath, imageBuffer);
            
            console.log(`✅ Nano Banana generation successful: ${outputPath}`);
            
            return {
              success: true,
              provider: 'nano_banana',
              imageUrl: null, // Nano Banana returns base64, not URL
              imagePath: outputPath,
              prompt: enhancedPrompt,
              metadata: {
                modelId: request.modelId,
                pose: request.pose,
                cost: this.providers.nano_banana?.pricing?.costPerImage || 0.039
              }
            };
          }
        }
        
        // If we only got text responses, log them all
        const textParts = parts.filter(part => part.text).map(part => part.text);
        if (textParts.length > 0) {
          console.error('Nano Banana returned only text, no image:', textParts.join('\n'));
          throw new Error(`Nano Banana did not generate an image. Response: ${textParts.join(' ')}`);
        }
      }
      
      throw new Error('Unexpected response format from Nano Banana API');
      
    } catch (error) {
      console.error('Nano Banana generation error:', error.response?.data || error.message);
      
      // Handle specific Gemini API errors
      if (error.response?.status === 400) {
        throw new Error(`Nano Banana request invalid: ${error.response.data?.error?.message || 'Bad request'}`);
      }
      if (error.response?.status === 403) {
        throw new Error('Nano Banana API key invalid or quota exceeded');
      }
      if (error.response?.status === 429) {
        throw new Error('Nano Banana rate limit exceeded. Please try again later.');
      }
      
      throw new Error(`Nano Banana generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image using Imagen 4.0 Ultra API
   * @param {string} prompt - Generation prompt
   * @param {Array} uploadedImages - Uploaded image paths
   * @param {Object} request - Generation request data
   * @returns {Object} Generation result
   */
  async generateWithImagen4Ultra(prompt, uploadedImages, request) {
    const timestamp = Date.now();
    const apiKey = this.apiKeys.imagen_4_ultra;

    if (!apiKey) {
      throw new Error('Imagen 4.0 Ultra API key not configured');
    }

    try {
      // Prepare request data for Imagen 4.0 Ultra
      const requestData = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ['image', 'text'],
          aspectRatio: '1:1',
          safetySettings: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      };

      // Save prompt to file for review
      const promptFilePath = path.join(this.getGeneratedDir(), `prompt_imagen4ultra_${timestamp}.txt`);
      fs.writeFileSync(promptFilePath, `Generation Timestamp: ${new Date().toISOString()}\n` +
                                   `Model: ${request.modelId}\n` +
                                   `Pose: ${request.pose || 'professional_standing'}\n` +
                                   `Provider: imagen_4_ultra\n\n` +
                                   `=== PROMPT SENT TO IMAGEN 4.0 ULTRA ===\n\n` +
                                   prompt);
      console.log(`🖼️ IMAGEN 4.0 ULTRA PROMPT SAVED: ${promptFilePath}`);

      const config = {
        method: 'post',
        url: this.providers.imagen_4_ultra.endpoint,
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        data: requestData,
        timeout: this.settings.imagen_4_ultra.timeout
      };

      const response = await axios(config);
      console.log('Imagen 4.0 Ultra API response received');

      // Extract generated image from response
      if (response.data?.candidates?.[0]?.content?.parts) {
        const parts = response.data.candidates[0].content.parts;

        // Look through all parts to find an image
        for (const part of parts) {
          if (part.inlineData?.data) {
            // Found base64 image data
            const base64Data = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/jpeg';

            // Save the image
            const filename = `imagen4ultra_${timestamp}.jpg`;
            const imagePath = path.join(this.getGeneratedDir(), filename);
            const imageBuffer = Buffer.from(base64Data, 'base64');

            // Save composite image for reference
            fs.writeFileSync(imagePath, imageBuffer);
            console.log(`🖼️ IMAGEN 4.0 ULTRA IMAGE SAVED: ${imagePath}`);

            // Calculate metadata
            const metadata = {
              ...response.data.candidates[0],
              generationTimestamp: timestamp,
              modelUsed: 'imagen-4.0-ultra-generate-001',
              provider: 'imagen_4_ultra',
              cost: this.providers.imagen_4_ultra.pricing.costPerImage,
              promptTokens: prompt.length,
              outputFile: filename
            };

            // Save metadata
            const metadataPath = path.join(this.getGeneratedDir(), `metadata_imagen4ultra_${timestamp}.json`);
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

            return {
              success: true,
              result: {
                imageUrl: `/generated/${filename}`,
                metadata: metadata,
                savedImagePath: imagePath
              }
            };
          }
        }
      }

      throw new Error('No image generated in Imagen 4.0 Ultra response');

    } catch (error) {
      console.error('Imagen 4.0 Ultra generation error:', error);
      throw new Error(`Imagen 4.0 Ultra generation failed: ${error.message}`);
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
    const filepath = path.join(this.getGeneratedDir(), filename);
    
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
    const maxAttempts = 150; // 150 attempts = 5 minutes max (BFL guidance: images expire in 10 minutes)
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
    
    throw new Error('Generation timeout: Task did not complete within 5 minutes');
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
    
    // Use the exact model descriptions specified by user
    const modelDescriptions = {
      'gunawan': 'Indonesian male model with warm medium skin tone, black hair styled back with natural texture, almond-shaped dark brown eyes, well-defined thick eyebrows, straight nose with slightly rounded tip, light facial hair including mustache and beard stubble with moderate density, defined jawline, natural lip color, subtle smile lines, professional studio lighting creating natural skin luminosity.',
      'paul': 'Indonesian male model with medium-warm skin tone, dark brown hair styled back with volume, hazel-brown eyes with depth, thick well-defined eyebrows, straight nose with strong bridge, clean-shaven with smooth skin, strong defined jawline, natural lip tone, confident expression, mature masculine features, professional studio lighting with even illumination.',
      'rachma': 'Indonesian female model wearing hijab, warm light skin tone with natural glow, almond-shaped dark brown eyes with defined lashes, well-groomed arched eyebrows, straight nose with delicate bridge, natural pink lip color with subtle shine, gentle smile showing warmth, smooth complexion, hijab draped naturally around face covering hair completely, professional studio lighting creating luminous skin finish.',
      'johny': 'Indonesian male model with warm light-medium skin tone, black hair styled back and slightly textured, almond-shaped dark brown eyes with gentle expression, naturally shaped eyebrows, straight nose with refined bridge, light facial hair including thin mustache and sparse beard stubble, softer jawline than Model 1, natural pink lip tone, friendly subtle smile, smooth skin texture with professional studio lighting.'
    };
    
    const modelDescription = modelDescriptions[request.modelId] || model.detailedDescription;
    
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
    
    // Add embroidery/printing details with description and position
    if (request.embroideryDetails && request.embroideryDetails.length > 0) {
      try {
        const details = Array.isArray(request.embroideryDetails) ? 
          request.embroideryDetails : 
          JSON.parse(request.embroideryDetails || '[]');
        
        if (details.length > 0) {
          details.forEach((detail, index) => {
            const description = detail.description || detail;
            const position = detail.position || 'chest area';
            prompt += `- Include embroidery/printing detail: "${description}" positioned at ${position}\n`;
          });
        } else {
          prompt += `- Include detail from bottom section as shown in reference\n`;
        }
      } catch (e) {
        prompt += `- Include detail from bottom section as shown in reference\n`;
      }
    }
    
    prompt += `- Dark dress pants/trousers for professional look\n`;
    prompt += `- Proper garment fit and drape\n\n`;
    
    // Get pose description
    const { POSES } = require('../config/models');
    const selectedPose = POSES[request.pose] || POSES['professional_standing'];
    
    prompt += `**Composition & Framing:**\n`;
    prompt += `- 3/4 body portrait: head to just below knees (STOP at knees, no feet visible)\n`;
    prompt += `- Athletic build with confident professional stance\n`;
    prompt += `- ${selectedPose.prompt}\n\n`;
    
    prompt += `**Technical Specifications:**\n`;
    prompt += `- Professional studio photography with soft even lighting\n`;
    prompt += `- Clean white seamless background\n`;
    prompt += `- High-resolution commercial quality\n`;
    prompt += `- Sharp focus throughout\n`;
    prompt += `- Natural color reproduction\n\n`;
    
    // Add additional notes/special instructions if provided
    if (request.garmentDescription && request.garmentDescription.trim()) {
      prompt += `**Additional Notes:**\n`;
      prompt += `${request.garmentDescription.trim()}\n\n`;
    }
    
    prompt += `Create ONE seamless portrait that combines the exact face from top section with the exact garment from middle section. Ignore the vertical stacking layout - generate a single professional portrait. Priority: EXACT face matching is most critical.`;
    
    return prompt;
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} Whether the error is retryable
   */
  isRetryableError(error) {
    // Network/timeout errors are retryable
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // HTTP 5xx and certain 4xx errors are retryable
    if (error.response?.status >= 500) {
      return true;
    }
    
    // Rate limiting (429) is retryable
    if (error.response?.status === 429) {
      return true;
    }
    
    // Temporary service unavailable
    if (error.response?.status === 503) {
      return true;
    }
    
    return false;
  }

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {string} operation - Name of the operation for logging
   * @returns {Promise} Result of the function
   */
  async retryWithBackoff(fn, maxRetries, operation) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry non-retryable errors
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate backoff delay (exponential: 2s, 4s, 8s...)
        const delay = Math.min(2000 * Math.pow(2, attempt), 30000); // Max 30s
        console.log(`${operation} attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`${operation} failed after ${maxRetries + 1} attempts: ${lastError.message}`);
  }
}

module.exports = AIService;