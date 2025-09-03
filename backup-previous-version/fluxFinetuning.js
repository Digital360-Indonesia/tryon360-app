const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class FluxFinetuningService {
  constructor() {
    this.apiKey = process.env.BFL_API_KEY;
    this.baseURL = 'https://api.us1.bfl.ai/v1';  // Use region-specific endpoint
    
    // Model configurations for your 3 models
    this.modelConfigs = {
      'johny': {
        name: 'Johny',
        triggerWord: 'JOHNY_KUSTOM_MODEL',
        description: 'Indonesian young man, professional model for Kustompedia',
        referenceImages: [], // Will be auto-detected from finetuning-model folder
        finetuneId: null // Disabled - using regular model instead
      },
      'nyoman': {
        name: 'Nyoman', 
        triggerWord: 'NYOMAN_KUSTOM_MODEL',
        description: 'Indonesian young man, professional model for Kustompedia',
        referenceImages: [], // Will be auto-detected from finetuning-model folder
        finetuneId: null
      },
      'isabella': {
        name: 'Isabella',
        triggerWord: 'ISABELLA_KUSTOM_MODEL', 
        description: 'Indonesian young woman, professional model for Kustompedia',
        referenceImages: [], // Will be auto-detected from finetuning-model folder
        finetuneId: null
      }
    };
    
    if (!this.apiKey) {
      console.warn('⚠️ BFL API key not found. Finetuning features unavailable.');
    } else {
      console.log('✅ FLUX Finetuning Service initialized');
    }
  }

  async createImageZip(imagePaths, modelId) {
    const AdmZip = require('adm-zip');
    const fs = require('fs');
    const path = require('path');
    
    console.log(`📦 Creating ZIP file for ${modelId} with ${imagePaths.length} images`);
    
    const zip = new AdmZip();
    
    // Add each image to the ZIP
    for (const imagePath of imagePaths) {
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const fileName = path.basename(imagePath);
        zip.addFile(fileName, imageBuffer);
        console.log(`📁 Added ${fileName} to ZIP`);
      }
    }
    
    // Save ZIP file temporarily
    const zipDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(zipDir)) {
      fs.mkdirSync(zipDir, { recursive: true });
    }
    
    const zipPath = path.join(zipDir, `${modelId}_training_data.zip`);
    zip.writeZip(zipPath);
    
    console.log(`✅ ZIP file created: ${zipPath}`);
    return zipPath;
  }

  detectModelImages(modelId, maxImages = 5) {
    const fs = require('fs');
    const path = require('path');
    
    const finetuningDir = path.join(__dirname, '../../finetuning-model');
    console.log(`🔍 Looking for ${modelId} images in: ${finetuningDir} (max: ${maxImages})`);
    
    if (!fs.existsSync(finetuningDir)) {
      throw new Error(`Finetuning model directory not found: ${finetuningDir}`);
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(finetuningDir);
    
    // Filter files that contain the model name
    const modelFiles = files.filter(file => {
      const fileName = file.toLowerCase();
      const modelName = modelId.toLowerCase();
      // Check if filename contains model name and is an image
      // Support patterns like "johnymodel-1.png", "johny-1.png", "johny1.png"
      return (fileName.includes(modelName + 'model') || fileName.includes(modelName)) && 
             (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
              fileName.endsWith('.png') || fileName.endsWith('.webp'));
    });
    
    if (modelFiles.length === 0) {
      throw new Error(`No images found for ${modelId} in ${finetuningDir}. Please ensure images contain "${modelId}" in the filename.`);
    }
    
    // Limit to maxImages to stay within credit limits
    const limitedFiles = modelFiles.slice(0, maxImages);
    
    // Convert to full paths
    const imagePaths = limitedFiles.map(file => path.join(finetuningDir, file));
    
    console.log(`✅ Found ${modelFiles.length} images for ${modelId}, using first ${limitedFiles.length}:`, limitedFiles);
    
    return imagePaths;
  }

  async createModelFinetune(modelId) {
    if (!this.apiKey) {
      throw new Error('BFL API key not configured');
    }

    const config = this.modelConfigs[modelId];
    if (!config) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    try {
      console.log(`🎯 Creating character finetune for ${config.name}`);
      
      // Auto-detect images from finetuning-model folder
      const imagePaths = this.detectModelImages(modelId);
      
      // Create ZIP file with all images (as required by BFL API)
      const zipPath = await this.createImageZip(imagePaths, modelId);
      
      console.log(`📤 Uploading ZIP file for ${config.name} finetune: ${zipPath}`);

      // Read ZIP file and convert to base64 as required by BFL API
      const zipBuffer = fs.readFileSync(zipPath);
      const zipBase64 = zipBuffer.toString('base64');

      // Create request body according to BFL documentation
      const requestBody = {
        mode: 'character',  // Character mode for model consistency
        finetune_comment: `${config.name} Character Model - Kustompedia Try-On Platform`,
        trigger_word: config.triggerWord,
        file_data: zipBase64,  // Base64 encoded ZIP file
        iterations: 300,
        learning_rate: 0.00001,
        captioning: true,
        priority: 'quality'
      };
      
      const response = await axios.post(
        `${this.baseURL}/finetune`,
        requestBody,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minutes for upload
        }
      );

      console.log('🔍 BFL API Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data && (response.data.finetune_id || response.data.id)) {
        const finetuneId = response.data.finetune_id || response.data.id;
        console.log(`✅ Finetune created for ${config.name}: ${finetuneId}`);
        
        // Store the finetune ID
        this.modelConfigs[modelId].finetuneId = finetuneId;
        
        return {
          success: true,
          finetuneId: finetuneId,
          modelId: modelId,
          triggerWord: config.triggerWord,
          status: 'training',
          pollingUrl: response.data.polling_url
        };
      } else {
        console.log('❌ Unexpected response format. Response data:', response.data);
        throw new Error('Invalid response from finetune API - expected finetune_id field');
      }

    } catch (error) {
      console.error(`❌ Error creating finetune for ${config.name}:`, error.message);
      
      if (error.response) {
        console.error('Finetune API Error:', error.response.data);
        return {
          success: false,
          error: error.response.data.error?.message || 'Finetune API Error',
          code: error.response.status
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkFinetuneStatus(finetuneId) {
    if (!this.apiKey) {
      throw new Error('BFL API key not configured');
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/finetune/${finetuneId}`,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        status: response.data.status,
        progress: response.data.progress || 0,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Error checking finetune status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateWithFinetunedModel(modelId, prompt, options = {}) {
    const config = this.modelConfigs[modelId];
    if (!config || !config.finetuneId) {
      throw new Error(`Finetune not available for model: ${modelId}`);
    }

    try {
      console.log(`🎨 Generating with finetuned ${config.name} model`);
      
      const {
        size = '1024x1024',
        productAnalysis = null,
        pose = 'arms crossed'
      } = options;

      // Map size to aspect ratio
      let aspectRatio = '1:1';
      if (size === '1024x1536') aspectRatio = '2:3';
      else if (size === '1536x1024') aspectRatio = '3:2';

      // Build optimized prompt with trigger word
      let enhancedPrompt;
      if (productAnalysis) {
        enhancedPrompt = `${config.triggerWord}, a professional photograph of ${config.triggerWord} wearing ${productAnalysis}. ${config.triggerWord} maintains ${pose.toLowerCase()} pose. Professional fashion photography, studio lighting, high quality.`;
      } else {
        enhancedPrompt = `${config.triggerWord}, a professional photograph of ${config.triggerWord} ${prompt}. ${config.triggerWord} maintains ${pose.toLowerCase()} pose. Professional fashion photography, studio lighting, high quality.`;
      }

      const requestBody = {
        prompt: enhancedPrompt,
        finetune_id: config.finetuneId,
        finetune_strength: 1.2, // Strong influence for character consistency
        aspect_ratio: aspectRatio,
        num_images: 1
      };

      console.log(`🚀 Generating with trigger word: ${config.triggerWord}`);
      
      const response = await axios.post(
        `${this.baseURL}/flux-pro-1.1-ultra-finetuned`,  // Use finetuned endpoint
        requestBody,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      if (response.data && response.data.id) {
        // Poll for result (reuse existing polling logic)
        return await this.pollForResult(response.data.id);
      } else {
        throw new Error('Invalid response from finetuned generation');
      }

    } catch (error) {
      console.error(`❌ Error generating with finetuned model ${modelId}:`, error.message);
      
      if (error.response) {
        console.error('Finetuned Generation API Error:', error.response.data);
        return {
          success: false,
          error: error.response.data.error?.message || 'Finetuned Generation Error',
          code: error.response.status
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async pollForResult(jobId, maxAttempts = 30, interval = 2000) {
    console.log('🔄 Polling for finetuned generation result:', jobId);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `${this.baseURL}/get_result`,
          {
            params: { id: jobId },
            headers: {
              'accept': 'application/json',
              'x-key': this.apiKey
            },
            timeout: 10000
          }
        );

        console.log(`🔍 Poll attempt ${attempt}/${maxAttempts} - Status:`, response.data.status);

        if (response.data.status === 'Ready') {
          console.log('✅ Finetuned generation completed');
          return {
            success: true,
            imageUrl: response.data.result.sample
          };
        } else if (response.data.status === 'Error') {
          return {
            success: false,
            error: response.data.error || 'Generation failed'
          };
        } else {
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }
      } catch (error) {
        console.error(`❌ Error polling job ${jobId}:`, error.message);
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: `Polling timeout after ${maxAttempts} attempts`
          };
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    return {
      success: false,
      error: `Job polling timeout`
    };
  }

  async initializeAllModels() {
    console.log('🚀 Initializing character finetunes for all 3 models');
    
    const results = {};
    
    for (const modelId of ['johny', 'nyoman', 'isabella']) {
      try {
        console.log(`\n🎯 Processing ${this.modelConfigs[modelId].name}...`);
        
        // Check if already has finetune
        if (this.modelConfigs[modelId].finetuneId) {
          console.log(`✅ ${modelId} already has finetune: ${this.modelConfigs[modelId].finetuneId}`);
          results[modelId] = { success: true, status: 'existing', finetuneId: this.modelConfigs[modelId].finetuneId };
          continue;
        }
        
        // Create new finetune
        const result = await this.createModelFinetune(modelId);
        results[modelId] = result;
        
        if (result.success) {
          console.log(`✅ ${modelId} finetune started: ${result.finetuneId}`);
        } else {
          console.error(`❌ ${modelId} finetune failed: ${result.error}`);
        }
        
        // Wait between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error processing ${modelId}:`, error.message);
        results[modelId] = { success: false, error: error.message };
      }
    }
    
    return results;
  }

  getModelConfig(modelId) {
    return this.modelConfigs[modelId] || null;
  }

  getAllModelConfigs() {
    return this.modelConfigs;
  }

  isModelReady(modelId) {
    const config = this.modelConfigs[modelId];
    return config && config.finetuneId;
  }
}

module.exports = FluxFinetuningService;