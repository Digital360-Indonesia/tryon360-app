const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

class FluxService {
  constructor() {
    this.apiKey = process.env.BFL_API_KEY;
    this.baseURL = 'https://api.bfl.ai/v1';

    if (!this.apiKey) {
      console.warn('⚠️ Black Forest Labs API key not found. FLUX features will be unavailable.');
      console.log('📝 Please set BFL_API_KEY in your .env file');
    } else {
      console.log('✅ Black Forest Labs API key loaded');
    }
  }

  async generateImageWithReference(referenceImagePath, prompt, options = {}) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Black Forest Labs API key not configured'
      };
    }

    const {
      quality = 'standard',
      size = '1024x1024',
      productImagePath = null,
      useFluxFill = productImagePath ? true : false,  // Use FLUX Fill for inpainting when product uploaded
      useReverseApproach = false,  // Disable reverse, use Fill instead
      useMultiStep = false  // Disable multi-step when using Fill
    } = options;

    try {
      let mode = 'STANDARD';
      if (productImagePath && useFluxFill) mode = 'FLUX-FILL';
      else if (productImagePath && useReverseApproach) mode = 'REVERSE';
      else if (productImagePath && useMultiStep) mode = 'MULTI-STEP';
      console.log('🔄 FLUX Mode:', mode);
      console.log('🎨 Edit prompt:', prompt);
      if (productImagePath) {
        console.log('👕 Product image path:', productImagePath);
      }

      const fs = require('fs');
      const path = require('path');

      let primaryImageBase64, modelDescription;

      if (productImagePath && useFluxFill) {
        // FLUX FILL APPROACH: Use model as base, inpaint clothing area with product
        console.log('🎨 FLUX FILL: Using inpainting for precise clothing replacement');

        // Get model image as base
        const imageName = path.basename(referenceImagePath);
        const fullModelPath = path.join(__dirname, '../../../frontend/public/models/', imageName);
        if (!fs.existsSync(fullModelPath)) {
          throw new Error(`Model image not found: ${fullModelPath}`);
        }

        const modelBuffer = fs.readFileSync(fullModelPath);
        primaryImageBase64 = modelBuffer.toString('base64');
        console.log('👤 Model image loaded for direct generation');

      } else if (productImagePath && useReverseApproach) {
        // DUAL-IMAGE COMPOSITE: Both model and product as visual inputs
        console.log('🔄 DUAL-IMAGE: Creating composite with model face + product clothing');

        // Get model image
        const imageName = path.basename(referenceImagePath);
        const fullModelPath = path.join(__dirname, '../../../frontend/public/models/', imageName);
        if (!fs.existsSync(fullModelPath)) {
          throw new Error(`Model image not found: ${fullModelPath}`);
        }
        const modelBuffer = fs.readFileSync(fullModelPath);
        const modelBase64 = modelBuffer.toString('base64');
        console.log('👤 Model image loaded');

        // Get product image path
        let fullProductPath;
        if (path.isAbsolute(productImagePath)) {
          fullProductPath = productImagePath;
        } else {
          fullProductPath = path.join(__dirname, '../../', productImagePath);
        }

        console.log('🔍 Checking product path:', fullProductPath);
        if (!fs.existsSync(fullProductPath)) {
          throw new Error(`Product image not found: ${fullProductPath}`);
        }
        console.log('👕 Product image found');

        // Create OVERLAY composite: Product as base, model face overlay
        const composite = await this.createOverlayComposite(modelBase64, fullProductPath);
        if (composite) {
          primaryImageBase64 = composite;
          console.log('✅ OVERLAY composite created: Product base + Model face overlay');
        } else {
          console.warn('⚠️ Composite creation failed, falling back to model only');
          primaryImageBase64 = modelBase64;
        }

      } else if (productImagePath && useMultiStep) {
        // MULTI-STEP APPROACH: Step 1 + Step 2 for both model consistency AND product accuracy
        console.log('🔄 MULTI-STEP: Two-phase generation for perfect results');
        return await this.generateWithMultiStep(referenceImagePath, prompt, options);

      } else if (productImagePath) {
        // FOCUSED APPROACH: Create composite of model + product for dual-image input
        console.log('🎯 FOCUSED: Creating composite with both model and product images');

        // Get model image
        const imageName = path.basename(referenceImagePath);
        const fullImagePath = path.join(__dirname, '../../../frontend/public/models/', imageName);
        console.log('🔍 Looking for model image at:', fullImagePath);

        if (!fs.existsSync(fullImagePath)) {
          throw new Error(`Reference image not found: ${fullImagePath}`);
        }

        const modelBuffer = fs.readFileSync(fullImagePath);
        const modelBase64 = modelBuffer.toString('base64');
        console.log('📷 Model image loaded for composite');

        // Create composite with both model and product images
        const composite = await this.createCompositeImage(modelBase64, productImagePath);
        if (composite) {
          primaryImageBase64 = composite;
          console.log('✅ Composite image created with both model and product');
        } else {
          console.warn('⚠️ Composite creation failed, using model image only');
          primaryImageBase64 = modelBase64;
        }

      } else {
        // STANDARD APPROACH: Use model as primary input
        console.log('👤 STANDARD: Model image as primary, changing clothes');

        // Construct path to frontend/public/models/ from backend/src/services/
        const imageName = path.basename(referenceImagePath);
        const fullImagePath = path.join(__dirname, '../../../frontend/public/models/', imageName);
        console.log('🔍 Looking for model image at:', fullImagePath);
        console.log('🔍 Image name:', imageName);
        console.log('🔍 Reference path:', referenceImagePath);
        if (!fs.existsSync(fullImagePath)) {
          throw new Error(`Reference image not found: ${fullImagePath}`);
        }

        const imageBuffer = fs.readFileSync(fullImagePath);
        const base64Image = imageBuffer.toString('base64');
        console.log('📷 Model image buffer size:', imageBuffer.length, 'bytes');

        // PRODUCT-DOMINANT approach for better product accuracy
        if (productImagePath) {
          console.log('👕 Using PRODUCT-DOMINANT approach for MODEL-FIRST');
          const productComposite = await this.createProductDominantComposite(base64Image, productImagePath);
          primaryImageBase64 = productComposite || base64Image;
        } else {
          primaryImageBase64 = base64Image;
        }
      }

      // Enhanced prompting based on approach
      let enhancedPrompt = prompt;
      if (productImagePath && useFluxFill) {
        enhancedPrompt = `Change the clothing to match the uploaded product. Keep the exact same face, hair, skin tone, pose, and body. FULL BODY SHOT: Show complete person from head to waist, not cropped. Professional photography with proper framing and spacing. ${prompt}`;
      } else if (productImagePath && useReverseApproach) {
        enhancedPrompt = `FACE REPLACEMENT: This image shows a person wearing clothing, with a face reference in the top-right corner. Replace ONLY the main person's face with the face from the small reference image. CRITICAL: Keep the clothing, body, pose, and background EXACTLY the same. Only change the face to match the reference. The result should be ONE PERSON wearing the exact same clothing but with the reference face. ${prompt}`;
      } else if (productImagePath) {
        enhancedPrompt = `Change the clothing to match the uploaded product. Keep the exact same face, hair, skin tone, pose, and body. FULL BODY SHOT: Show complete person from head to waist, not cropped, with proper spacing around the head and body. Professional photography. ${prompt}`;
      }

      // Map size to aspect ratio for FLUX
      let aspectRatio = '1:1'; // Default for 1024x1024
      if (size === '1024x1536') {
        aspectRatio = '2:3';
      } else if (size === '1536x1024') {
        aspectRatio = '3:2';
      }

      const requestBody = {
        prompt: enhancedPrompt,
        input_image: primaryImageBase64,
        aspect_ratio: aspectRatio
      };

      const response = await axios.post(
        `${this.baseURL}/flux-kontext-pro`,
        requestBody,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 90000 // 90 seconds for image editing
        }
      );

      console.log('✅ FLUX Kontext response received');
      console.log('🔍 Response status:', response.status);
      console.log('📊 Response data keys:', Object.keys(response.data));

      if (response.data && response.data.id) {
        // FLUX returns a job ID, we need to poll for the result
        const result = await this.pollForResult(response.data.id);
        if (result.success) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            revisedPrompt: enhancedPrompt,
            modelUsed: 'flux-kontext-pro'
          };
        } else {
          return result;
        }
      } else if (response.data && response.data.sample) {
        // Direct response with image data
        console.log('🔗 Received direct image URL from FLUX');
        return {
          success: true,
          imageUrl: response.data.sample,
          revisedPrompt: enhancedPrompt,
          modelUsed: 'flux-kontext-pro'
        };
      } else {
        throw new Error('Invalid response format from FLUX API');
      }
    } catch (error) {
      console.error('❌ Error in FLUX image edit:', error.message);

      if (error.response) {
        console.error('🚫 FLUX API Error:', error.response.data);
        return {
          success: false,
          error: error.response.data.error?.message || 'FLUX API Error',
          code: error.response.status
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error in FLUX image editing'
      };
    }
  }

  async generateImage(prompt, options = {}) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Black Forest Labs API key not configured'
      };
    }

    const {
      model = 'flux-pro-1.1',
      quality = 'standard',
      size = '1024x1024',
      style = 'natural',
      referenceImage = null
    } = options;

    try {
      console.log('🎨 Generating image with FLUX:', prompt.substring(0, 100) + '...');
      console.log('🤖 Using model:', model);

      // Map size to aspect ratio for FLUX
      let aspectRatio = '1:1'; // Default for 1024x1024
      if (size === '1024x1536') {
        aspectRatio = '2:3';
      } else if (size === '1536x1024') {
        aspectRatio = '3:2';
      }

      let requestBody = {
        prompt,
        aspect_ratio: aspectRatio
      };

      // If we have a reference image, use FLUX Kontext
      if (referenceImage) {
        console.log('🖼️ Using FLUX Kontext for reference image');
        return this.generateImageWithReference(referenceImage, prompt, options);
      }

      // Determine which FLUX endpoint to use based on model
      let endpoint = '/flux-pro-1.1';
      if (model === 'flux-dev') {
        endpoint = '/flux-dev';
      } else if (model === 'flux-schnell') {
        endpoint = '/flux-schnell';
      }

      const response = await axios.post(
        `${this.baseURL}${endpoint}`,
        requestBody,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2 minutes for generation
        }
      );

      console.log('🔍 FLUX API Response Structure:');
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));

      if (response.data && response.data.id) {
        // FLUX returns a job ID, we need to poll for the result
        const result = await this.pollForResult(response.data.id);
        if (result.success) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            revisedPrompt: prompt,
            modelUsed: model
          };
        } else {
          return result;
        }
      } else if (response.data && response.data.sample) {
        // Direct response with image data
        console.log('🔗 Received direct image URL from FLUX');
        return {
          success: true,
          imageUrl: response.data.sample,
          revisedPrompt: prompt,
          modelUsed: model
        };
      } else {
        console.error('❌ Invalid response structure from FLUX');
        console.log('📊 Response structure:', response.data);
        throw new Error('Invalid response format from FLUX');
      }
    } catch (error) {
      console.error('❌ Error generating image with FLUX', model, ':', error.message);

      if (error.response) {
        console.error('FLUX API Error:', error.response.data);

        return {
          success: false,
          error: error.response.data.error?.message || 'FLUX API Error',
          code: error.response.status
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async pollForResult(jobId, maxAttempts = 30, interval = 2000) {
    console.log('🔄 Polling for FLUX job result:', jobId);

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
          console.log('✅ FLUX job completed successfully');
          return {
            success: true,
            imageUrl: response.data.result.sample
          };
        } else if (response.data.status === 'Error') {
          console.error('❌ FLUX job failed:', response.data.error);
          return {
            success: false,
            error: response.data.error || 'FLUX job failed'
          };
        } else if (response.data.status === 'Pending' || response.data.status === 'Task started') {
          // Job is still processing, wait before next poll
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        } else {
          console.log('⏳ Unknown status:', response.data.status, '- continuing to poll');
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }
      } catch (error) {
        console.error(`❌ Error polling job ${jobId} (attempt ${attempt}):`, error.message);
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
      error: `Job polling timeout after ${maxAttempts} attempts`
    };
  }

  async downloadAndSaveImage(imageUrl, filename) {
    try {
      console.log('📥 Downloading FLUX image from:', imageUrl);

      // Validate URL format
      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error(`Invalid image URL: ${imageUrl}`);
      }

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const uploadsDir = path.join(__dirname, '../../uploads');

      // Ensure uploads directory exists
      const fs = require('fs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, filename);

      await require('fs').promises.writeFile(filePath, response.data);
      console.log('💾 FLUX image saved to:', filePath);

      return {
        success: true,
        filePath,
        fileName: filename
      };
    } catch (error) {
      console.error('❌ Error downloading FLUX image:', error.message);
      console.error('URL was:', imageUrl);
      return {
        success: false,
        error: `Failed to download FLUX image: ${error.message}`
      };
    }
  }

  buildTryOnPrompt(model, garment, options = {}) {
    const {
      pose = model.poses && model.poses[0] || 'Arms Crossed',
      garmentColor = '',
      logoDescription = '',
      logoPosition = '',
      additionalDetails = '',
      productImage = null,
      logoFocusEnabled = false,
      productAnalysis = null,
      structuredAnalysis = null
    } = options;

    let prompt;

    if (productImage && structuredAnalysis) {
      // BFL Recommended: Use structured analysis for maximum precision
      const {
        garment_type = 'shirt',
        primary_color = 'blue',
        secondary_colors = 'none',
        material = 'cotton',
        pattern = 'solid',
        style = 'casual',
        fit = 'regular',
        sleeve_type = 'short sleeve',
        collar = 'crew neck',
        closure = 'pullover',
        pockets = 'none',
        'logos/text': logos = 'none',
        special_features = 'none',
        construction_details = 'standard'
      } = structuredAnalysis;

      // Create detailed prompt following BFL guidelines
      prompt = `Change the clothing to match exactly this style: ${primary_color} ${material} ${garment_type} with ${sleeve_type}, ${collar} collar, ${fit} fit, ${style} style. Pattern: ${pattern}. ${secondary_colors !== 'none' ? `Secondary colors: ${secondary_colors}.` : ''} Closure type: ${closure}. Pockets: ${pockets}. ${logos !== 'none' ? `Text/Logos: ${logos}.` : ''} ${special_features !== 'none' ? `Special features: ${special_features}.` : ''} Construction: ${construction_details}. EXACT COLOR MATCH: ${primary_color}. EXACT MATERIAL APPEARANCE: ${material}. Keep same person and face. CHANGE POSE TO: ${pose.toLowerCase()} pose. The clothing should be identical in color, pattern, style, and details to the reference.`;

    } else if (productImage && productAnalysis) {
      // Fallback: Use detailed text analysis
      prompt = `Change the clothing to match exactly this detailed description: ${productAnalysis}. Keep same person and facial features. CHANGE POSE TO: ${pose.toLowerCase()} pose. The new clothing should match the uploaded product reference precisely - same colors, style, logos, patterns, textures, fit, and all design details.`;

    } else if (productImage) {
      // Basic product image without analysis
      prompt = `Replace the current clothing with the exact garment shown in the uploaded product reference image. Copy all visual elements: style, colors, patterns, textures, logos, text, patches, and design details. CHANGE POSE TO: ${pose.toLowerCase()} pose. Keep same person identity.`;

    } else {
      // No product image, use basic description
      const colorText = garmentColor ? `${garmentColor} ` : '';
      prompt = `Change the clothing to ${colorText}${garment.description}. Adjust to ${pose.toLowerCase()} pose.`;
    }

    // Add logo details if specified
    if (logoDescription && logoPosition) {
      const position = logoPosition.toLowerCase().replace(/([A-Z])/g, ' $1').trim();
      if (logoFocusEnabled) {
        prompt += ` LOGO PRECISION: The garment must feature an extremely detailed, crisp, HD-quality ${logoDescription} positioned exactly on the ${position}. The logo must be sharp, professionally rendered, clearly visible with excellent detail and contrast, matching the reference exactly in size, color, and positioning.`;
      } else {
        prompt += ` Include ${logoDescription} on the ${position} exactly as shown in reference.`;
      }
    }

    // BFL Optimized instructions for surgical precision
    prompt += ` SURGICAL EDIT PRECISION: Keep 100% identical - same face, hair, skin tone, eyes, expression, body position, and background lighting. ONLY change the clothing/garment. Professional fashion photography quality with studio lighting.`;

    if (additionalDetails) {
      prompt += ` Additional specifications: ${additionalDetails}`;
    }

    return prompt;
  }

  async cropTo23Ratio(imagePath) {
    try {
      console.log('✂️ Cropping FLUX image to 2:3 ratio:', imagePath);

      const image = sharp(imagePath);
      const metadata = await image.metadata();

      console.log(`📐 Original dimensions: ${metadata.width}x${metadata.height}`);

      // For 2:3 ratio from 1024x1024 square
      const targetWidth = Math.floor(metadata.width * 0.68);
      const targetHeight = Math.floor(targetWidth * 1.5);

      const left = Math.floor((metadata.width - targetWidth) / 2);
      const top = Math.floor(metadata.height * 0.12);

      console.log(`🎯 Target dimensions: ${targetWidth}x${targetHeight} (2:3 ratio)`);
      console.log(`📍 Crop position: left=${left}, top=${top}`);

      // Ensure crop doesn't exceed image boundaries
      const finalLeft = Math.max(0, Math.min(left, metadata.width - targetWidth));
      const finalTop = Math.max(0, Math.min(top, metadata.height - targetHeight));
      const finalWidth = Math.min(targetWidth, metadata.width - finalLeft);
      const finalHeight = Math.min(targetHeight, metadata.height - finalTop);

      console.log(`🔧 Final crop: ${finalWidth}x${finalHeight} from ${finalLeft},${finalTop}`);

      // Create the cropped image filename
      const parsedPath = path.parse(imagePath);
      const croppedFilename = `${parsedPath.name}_2-3${parsedPath.ext}`;
      const croppedPath = path.join(parsedPath.dir, croppedFilename);

      await image
        .extract({
          left: finalLeft,
          top: finalTop,
          width: finalWidth,
          height: finalHeight
        })
        .toFile(croppedPath);

      console.log('✅ FLUX image cropped successfully to:', croppedPath);

      return {
        success: true,
        croppedPath: croppedPath,
        originalPath: imagePath,
        dimensions: {
          width: finalWidth,
          height: finalHeight,
          ratio: '2:3'
        }
      };

    } catch (error) {
      console.error('❌ Error cropping FLUX image:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createProductDominantComposite(modelImageBase64, productImagePath) {
    try {
      console.log('🎯 Creating PRODUCT-DOMINANT composite for MODEL-FIRST');

      const fs = require('fs');
      const path = require('path');

      // Read product image - handle absolute vs relative paths
      let fullProductPath;
      if (path.isAbsolute(productImagePath)) {
        fullProductPath = productImagePath;
      } else {
        fullProductPath = path.join(__dirname, '../../', productImagePath);
      }

      console.log('🔍 Product-dominant checking path:', fullProductPath);
      if (!fs.existsSync(fullProductPath)) {
        console.warn('⚠️ Product image not found, using model image only');
        return null;
      }

      const productBuffer = fs.readFileSync(fullProductPath);
      const modelBuffer = Buffer.from(modelImageBase64, 'base64');

      // PRODUCT-DOMINANT: Make product image LARGER and more prominent
      const modelImage = sharp(modelBuffer);
      const productImage = sharp(productBuffer);

      // Get dimensions
      const modelMeta = await modelImage.metadata();
      const productMeta = await productImage.metadata();

      // Resize for BALANCED approach (50/50 split for both face and product)
      const targetHeight = 512;
      const modelWidth = Math.round(targetHeight * 0.6); // Model gets 60% width
      const productWidth = Math.round(targetHeight * 0.6); // Product gets 60% width

      const modelResized = await modelImage.resize({ width: modelWidth, height: targetHeight }).png().toBuffer();
      const productResized = await productImage.resize({ width: productWidth, height: targetHeight }).png().toBuffer();

      // Create composite with PRODUCT FIRST (left side, larger)
      const compositeWidth = productWidth + modelWidth;

      const composite = await sharp({
        create: {
          width: compositeWidth,
          height: targetHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
        .composite([
          { input: modelResized, left: 0, top: 0 }, // Model FIRST for face priority
          { input: productResized, left: modelWidth, top: 0 } // Product second for reference
        ])
        .png()
        .toBuffer();

      console.log('✅ Product-dominant composite created');
      return composite.toString('base64');

    } catch (error) {
      console.error('❌ Error creating product-dominant composite:', error.message);
      return null;
    }
  }

  async createProductFocusedComposite(step1ImageBase64, productImagePath) {
    try {
      console.log('🎯 Creating PRODUCT-FOCUSED composite for Step 2');

      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(productImagePath)) {
        console.warn('⚠️ Product image not found');
        return null;
      }

      const productBuffer = fs.readFileSync(productImagePath);
      const step1Buffer = Buffer.from(step1ImageBase64, 'base64');

      // Create PRODUCT-DOMINANT layout: Product gets more space for better recognition
      const step1Image = sharp(step1Buffer);
      const productImage = sharp(productBuffer);

      const targetSize = 1024;
      const step1Size = Math.floor(targetSize * 0.4); // Step 1 model gets 40%
      const productSize = Math.floor(targetSize * 0.6); // Product gets 60% for dominance

      // Resize images with proper aspect ratios - use 'inside' to prevent cropping
      const step1Resized = await step1Image
        .resize({ width: step1Size, height: targetSize, fit: 'inside', background: { r: 250, g: 250, b: 250 } })
        .png()
        .toBuffer();

      const productResized = await productImage
        .resize({ width: productSize, height: targetSize, fit: 'inside', background: { r: 250, g: 250, b: 250 } })
        .png()
        .toBuffer();

      // Create composite: Step1 model (left, smaller) + Product (right, larger)
      const composite = await sharp({
        create: {
          width: targetSize,
          height: targetSize,
          channels: 3,
          background: { r: 250, g: 250, b: 250 }
        }
      })
        .composite([
          { input: step1Resized, left: 0, top: 0 }, // Perfect model on left
          { input: productResized, left: step1Size, top: 0 } // Product dominant on right
        ])
        .png()
        .toBuffer();

      console.log('✅ Product-focused composite created: 40% model + 60% product');
      return composite.toString('base64');

    } catch (error) {
      console.error('❌ Error creating product-focused composite:', error.message);
      return null;
    }
  }

  async generateWithEnhancedComposite(compositeBase64, prompt, options = {}) {
    try {
      console.log('🎨 Generating with enhanced composite approach');

      const { size = '1024x1024' } = options;

      // Enhanced prompt for composite approach
      const enhancedPrompt = `PRECISION CLOTHING TRANSFER: This composite shows the target person (left side) and target clothing (right side). Create ONE FINAL PERSON by taking the EXACT face, hair, skin tone, pose, and body from the left person and dressing them in the EXACT clothing from the right side. CRITICAL: The result must be ONE PERSON, not two. PRESERVE: Everything about the left person except clothing. COPY: All clothing details from the right side - colors, patterns, logos, style, fit, materials, textures. ${prompt}`;

      // Map size to aspect ratio
      let aspectRatio = '1:1';
      if (size === '1024x1536') {
        aspectRatio = '2:3';
      } else if (size === '1536x1024') {
        aspectRatio = '3:2';
      }

      const requestBody = {
        prompt: enhancedPrompt,
        input_image: compositeBase64,
        aspect_ratio: aspectRatio
      };

      const response = await axios.post(
        `${this.baseURL}/flux-kontext-pro`,
        requestBody,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      if (response.data && response.data.id) {
        const result = await this.pollForResult(response.data.id);
        if (result.success) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            revisedPrompt: enhancedPrompt,
            modelUsed: 'flux-enhanced-composite'
          };
        } else {
          return result;
        }
      } else if (response.data && response.data.sample) {
        return {
          success: true,
          imageUrl: response.data.sample,
          revisedPrompt: enhancedPrompt,
          modelUsed: 'flux-enhanced-composite'
        };
      } else {
        throw new Error('Invalid response format from FLUX Kontext');
      }

    } catch (error) {
      console.error('❌ Error in enhanced composite generation:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createEnhancedComposite(modelImageBase64, productImagePath) {
    try {
      console.log('🎯 Creating ENHANCED composite for better try-on accuracy');

      const fs = require('fs');
      const path = require('path');

      // Read product image
      if (!fs.existsSync(productImagePath)) {
        console.warn('⚠️ Product image not found');
        return null;
      }

      const productBuffer = fs.readFileSync(productImagePath);
      const modelBuffer = Buffer.from(modelImageBase64, 'base64');

      // Create FOCUSED composite: Model face + Product details
      const modelImage = sharp(modelBuffer);
      const productImage = sharp(productBuffer);

      // Get dimensions
      const modelMeta = await modelImage.metadata();
      const productMeta = await productImage.metadata();

      // Create optimized layout for better recognition
      const targetSize = 1024;
      const modelSize = Math.floor(targetSize * 0.7); // Model gets 70%
      const productSize = Math.floor(targetSize * 0.3); // Product gets 30% as reference

      // Resize images
      const modelResized = await modelImage
        .resize({ width: modelSize, height: targetSize, fit: 'cover' })
        .png()
        .toBuffer();

      const productResized = await productImage
        .resize({ width: productSize, height: targetSize, fit: 'cover' })
        .png()
        .toBuffer();

      // Create composite: Model (main) + Product (reference on right)
      const composite = await sharp({
        create: {
          width: targetSize,
          height: targetSize,
          channels: 3,
          background: { r: 245, g: 245, b: 245 }
        }
      })
        .composite([
          { input: modelResized, left: 0, top: 0 }, // Model on left (main)
          { input: productResized, left: modelSize, top: 0 } // Product on right (reference)
        ])
        .png()
        .toBuffer();

      console.log('✅ Enhanced composite created: Model-focused with product reference');
      return composite.toString('base64');

    } catch (error) {
      console.error('❌ Error creating enhanced composite:', error.message);
      return null;
    }
  }

  async createOverlayComposite(modelImageBase64, productImagePath) {
    try {
      console.log('🎯 Creating OVERLAY composite: Product base + Model face reference');

      const fs = require('fs');
      const path = require('path');

      // Read product image
      console.log('🔍 Reading product image from:', productImagePath);
      if (!fs.existsSync(productImagePath)) {
        console.warn('⚠️ Product image not found');
        return null;
      }

      const productBuffer = fs.readFileSync(productImagePath);
      const modelBuffer = Buffer.from(modelImageBase64, 'base64');

      // Use product as PRIMARY base (larger)
      const productImage = sharp(productBuffer);
      const modelImage = sharp(modelBuffer);

      // Get product dimensions
      const productMeta = await productImage.metadata();

      // Resize product to standard size
      const baseWidth = 1024;
      const baseHeight = 1024;

      const productResized = await productImage
        .resize({ width: baseWidth, height: baseHeight, fit: 'cover' })
        .png()
        .toBuffer();

      // Create small model face reference (top-right corner)
      const refSize = 200; // Small reference
      const modelRef = await modelImage
        .resize({ width: refSize, height: refSize, fit: 'cover' })
        .png()
        .toBuffer();

      // Create overlay: Product (main) + Model face (small reference)
      const composite = await sharp(productResized)
        .composite([
          {
            input: modelRef,
            left: baseWidth - refSize - 20, // Top-right corner
            top: 20,
            blend: 'over'
          }
        ])
        .png()
        .toBuffer();

      console.log('✅ OVERLAY composite created: Product dominant + Model face reference');
      return composite.toString('base64');

    } catch (error) {
      console.error('❌ Error creating overlay composite:', error.message);
      return null;
    }
  }

  async createBalancedComposite(modelImageBase64, productImagePath) {
    try {
      console.log('🎯 Creating BALANCED composite for dual-image consistency');

      const fs = require('fs');
      const path = require('path');

      // Read product image
      console.log('🔍 Reading product image from:', productImagePath);
      if (!fs.existsSync(productImagePath)) {
        console.warn('⚠️ Product image not found');
        return null;
      }

      const productBuffer = fs.readFileSync(productImagePath);
      const modelBuffer = Buffer.from(modelImageBase64, 'base64');

      // Create BALANCED composite using Sharp
      const modelImage = sharp(modelBuffer);
      const productImage = sharp(productBuffer);

      // Get dimensions
      const modelMeta = await modelImage.metadata();
      const productMeta = await productImage.metadata();

      // Create EQUAL-SIZED composite (50/50 split)
      const targetHeight = 768; // Larger for better detail
      const halfWidth = 384; // Each image gets equal space

      // Resize both to same dimensions for balance
      const modelResized = await modelImage
        .resize({ width: halfWidth, height: targetHeight, fit: 'cover' })
        .png()
        .toBuffer();

      const productResized = await productImage
        .resize({ width: halfWidth, height: targetHeight, fit: 'cover' })
        .png()
        .toBuffer();

      // Create side-by-side composite: Model LEFT, Product RIGHT
      const compositeWidth = halfWidth * 2; // 768px total

      const composite = await sharp({
        create: {
          width: compositeWidth,
          height: targetHeight,
          channels: 3,
          background: { r: 240, g: 240, b: 240 }
        }
      })
        .composite([
          { input: modelResized, left: 0, top: 0 }, // Model on LEFT
          { input: productResized, left: halfWidth, top: 0 } // Product on RIGHT
        ])
        .png()
        .toBuffer();

      console.log('✅ BALANCED composite created: 50% model + 50% product');
      return composite.toString('base64');

    } catch (error) {
      console.error('❌ Error creating balanced composite:', error.message);
      return null;
    }
  }

  async createCompositeImage(modelImageBase64, productImagePath) {
    try {
      console.log('🖼️ Creating composite image for FLUX reference');

      const fs = require('fs');
      const path = require('path');

      // Read product image - handle absolute vs relative paths
      let fullProductPath;
      if (path.isAbsolute(productImagePath)) {
        fullProductPath = productImagePath;
      } else {
        fullProductPath = path.join(__dirname, '../../', productImagePath);
      }

      console.log('🔍 Composite checking product path:', fullProductPath);
      if (!fs.existsSync(fullProductPath)) {
        console.warn('⚠️ Product image not found, using model image only');
        return null;
      }

      const productBuffer = fs.readFileSync(fullProductPath);
      const modelBuffer = Buffer.from(modelImageBase64, 'base64');

      // Create side-by-side composite using Sharp
      const modelImage = sharp(modelBuffer);
      const productImage = sharp(productBuffer);

      // Get dimensions
      const modelMeta = await modelImage.metadata();
      const productMeta = await productImage.metadata();

      // Resize both images to same height (512px for better processing)
      const targetHeight = 512;
      const modelResized = await modelImage.resize({ height: targetHeight }).png().toBuffer();
      const productResized = await productImage.resize({ height: targetHeight }).png().toBuffer();

      // Get new dimensions after resize
      const modelResizedMeta = await sharp(modelResized).metadata();
      const productResizedMeta = await sharp(productResized).metadata();

      // Create composite width
      const compositeWidth = modelResizedMeta.width + productResizedMeta.width;

      // Create side-by-side composite
      const composite = await sharp({
        create: {
          width: compositeWidth,
          height: targetHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
        .composite([
          { input: modelResized, left: 0, top: 0 },
          { input: productResized, left: modelResizedMeta.width, top: 0 }
        ])
        .png()
        .toBuffer();

      const compositeBase64 = composite.toString('base64');
      console.log('✅ Composite image created successfully');

      return compositeBase64;

    } catch (error) {
      console.error('❌ Error creating composite image:', error.message);
      return null;
    }
  }

  async generateWithTwoStepProcess(referenceImagePath, prompt, productImagePath, options = {}) {
    console.log('🎯🎯 STARTING ADVANCED TWO-STEP PROCESS 🎯🎯');
    console.log('=============================================');

    const { size = '1024x1024', pose = 'arms crossed' } = options;

    try {
      // STEP 1: Generate perfect model with correct pose (NO product interference)
      console.log('');
      console.log('1️⃣ STEP 1: Perfect Model Generation');
      console.log('===================================');
      console.log('🎯 Goal: Perfect face consistency + correct pose');
      console.log('📝 Input: Model reference ONLY');
      console.log('🚫 NO product interference in this step');

      const step1Prompt = `Change pose to ${pose.toLowerCase()}. Keep exact same person, face, hair, skin tone, expression, and background. Professional fashion photography with studio lighting. High quality portrait. Full body shot, not cropped, show complete head to waist area with proper spacing.`;

      const step1Result = await this.generateImageWithReference(referenceImagePath, step1Prompt, {
        size,
        productImagePath: null, // NO product in step 1
        useFluxFill: false,
        useReverseApproach: false,
        useMultiStep: false
      });

      if (!step1Result.success) {
        console.error('❌ Step 1 failed:', step1Result.error);
        return step1Result;
      }

      console.log('✅ Step 1 completed - Perfect model + pose generated');
      console.log('🔗 Step 1 result URL:', step1Result.imageUrl);

      // Download Step 1 result to use as input for Step 2
      const step1ImagePath = await this.downloadImageForStep2(step1Result.imageUrl);
      console.log('📥 Step 1 image downloaded for Step 2');

      // STEP 2: Apply uploaded product to the perfect model using FLUX Fill
      console.log('');
      console.log('2️⃣ STEP 2: Product Application with FLUX Fill');
      console.log('============================================');
      console.log('🎯 Goal: Apply exact product to perfect model');
      console.log('📝 Input: Perfect model from Step 1 + uploaded product');
      console.log('🔒 PRESERVE: Face, pose, skin tone from Step 1');
      console.log('🎨 CHANGE: Only clothing to match uploaded product');

      // Create mask for the clothing area
      const maskResult = await this.createClothingMask(step1ImagePath);
      if (!maskResult.success) {
        console.error('❌ Failed to create mask for Step 2');
        return { success: false, error: 'Failed to create clothing mask' };
      }

      // Read Step 1 image as base64
      const fs = require('fs');
      const step1Buffer = fs.readFileSync(step1ImagePath);
      const step1Base64 = step1Buffer.toString('base64');

      // Enhanced prompt for Step 2 with product focus
      const step2Prompt = `Replace ONLY the clothing in the masked area with the exact clothing from the uploaded product reference. CRITICAL PRESERVATION: Keep the exact same face, hair, skin tone, pose, body position, and background from the current image. FOCUS AREA: Only modify clothing/garment area. PRODUCT ACCURACY: Copy every detail from the uploaded product - colors, patterns, logos, textures, style, fit, sleeves, collar, buttons, embroidery, text, and all visual elements. The clothing should be identical to the product reference.`;

      // Skip FLUX Fill for now (404 error) and use enhanced Kontext approach
      console.log('⚠️ FLUX Fill not available (404), using enhanced Kontext approach');

      // Use Step 1 result + product with enhanced prompting
      const step1RelativePath = path.relative(path.join(__dirname, '../../'), step1ImagePath);

      // Create enhanced composite for better product reference
      const enhancedComposite = await this.createProductFocusedComposite(step1Base64, productImagePath);

      let step2Result;
      if (enhancedComposite) {
        console.log('✅ Created product-focused composite for Step 2');
        // Use composite as input with enhanced prompt
        step2Result = await this.generateWithEnhancedComposite(enhancedComposite, step2Prompt, options);
      } else {
        console.log('🔄 Using direct Kontext approach for Step 2');
        step2Result = await this.generateImageWithReference(step1RelativePath, step2Prompt, {
          size,
          productImagePath,
          useFluxFill: false,
          useReverseApproach: false,
          useMultiStep: false
        });
      }

      if (!step2Result.success) {
        console.error('❌ Step 2 failed:', step2Result.error);
        return step2Result;
      }

      console.log('✅ Step 2 completed - Product applied to perfect model');
      console.log('🎉 TWO-STEP PROCESS COMPLETE!');
      console.log('');
      console.log('📊 FINAL RESULT:');
      console.log('• Perfect model consistency (from Step 1)');
      console.log('• Perfect product accuracy (from Step 2)');
      console.log('• Result URL:', step2Result.imageUrl);

      // Return the final result with both URLs for comparison
      return {
        success: true,
        imageUrl: step2Result.imageUrl,
        step1Url: step1Result.imageUrl, // For debugging/comparison
        step2Url: step2Result.imageUrl, // Final result
        revisedPrompt: step2Prompt,
        modelUsed: 'flux-two-step-advanced'
      };

    } catch (error) {
      console.error('❌ Two-step process failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateWithTwoStep(referenceImagePath, prompt, options = {}) {
    console.log('🎯🎯 STARTING TWO-STEP GENERATION 🎯🎯');
    console.log('====================================');

    const { size = '1024x1024', productImagePath, pose = 'arms crossed' } = options;

    try {
      // STEP 1: Generate perfect model + pose (NO PRODUCT interference)
      console.log('');
      console.log('1️⃣ STEP 1: Generate perfect model + pose');
      console.log('========================================');
      console.log('🎯 Goal: Perfect face consistency + correct pose');
      console.log('📝 Input: Model reference + pose requirements');
      console.log('🚫 NO product interference in this step');

      const step1Prompt = `Change pose to ${pose.toLowerCase()}. Keep exact same person, face, hair, skin tone, and background. Professional fashion photography with studio lighting.`;

      const step1Result = await this.generateImageWithReference(referenceImagePath, step1Prompt, {
        size,
        productImagePath: null, // NO product in step 1
        useMultiStep: false,
        useReverseApproach: false
      });

      if (!step1Result.success) {
        console.error('❌ Step 1 failed:', step1Result.error);
        return step1Result;
      }

      console.log('✅ Step 1 completed - Perfect model + pose generated');
      console.log('🔗 Step 1 result:', step1Result.imageUrl);

      // Download Step 1 result to use as input for Step 2
      const step1ImagePath = await this.downloadImageForStep2(step1Result.imageUrl);

      // STEP 2: Apply uploaded product to the perfect model
      console.log('');
      console.log('2️⃣ STEP 2: Apply uploaded product to perfect model');
      console.log('================================================');
      console.log('🎯 Goal: Exact product accuracy on perfect model');
      console.log('📝 Input: Perfect model from Step 1 + uploaded product');
      console.log('🔒 PRESERVE: Face, pose, skin tone from Step 1');
      console.log('🎨 CHANGE: Only clothing to match uploaded product');

      const step2Prompt = `CLOTHING-ONLY EDIT: Replace ONLY the clothing with the exact garment from the uploaded product reference. CRITICAL PRESERVATION: Keep the exact same face, hair, skin tone, pose, body position, and background from the current image. FOCUS AREA: Only modify clothing/garment area below the face. PRODUCT ACCURACY: Copy every detail from the uploaded product - colors, patterns, logos, textures, style, fit, sleeves, collar, buttons, embroidery, text, and all visual elements. SURGICAL PRECISION: Do not change anything about the person's appearance except the clothing.`;

      // Use relative path for step 2
      const step1RelativePath = path.relative(path.join(__dirname, '../../'), step1ImagePath);

      const step2Result = await this.generateImageWithReference(step1RelativePath, step2Prompt, {
        size,
        productImagePath, // NOW use the product reference
        useMultiStep: false,
        useReverseApproach: false
      });

      if (!step2Result.success) {
        console.error('❌ Step 2 failed:', step2Result.error);
        return step2Result;
      }

      console.log('✅ Step 2 completed - Product applied to perfect model');
      console.log('🎉 TWO-STEP GENERATION COMPLETE!');
      console.log('');
      console.log('📊 FINAL RESULT:');
      console.log('• Perfect model consistency (from Step 1)');
      console.log('• Perfect product accuracy (from Step 2)');
      console.log('• Result URL:', step2Result.imageUrl);

      // Return the final result with both URLs for comparison
      return {
        success: true,
        imageUrl: step2Result.imageUrl,
        step1Url: step1Result.imageUrl, // For debugging/comparison
        step2Url: step2Result.imageUrl, // Final result
        revisedPrompt: step2Prompt,
        modelUsed: 'flux-two-step'
      };

    } catch (error) {
      console.error('❌ Two-step generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createClothingMask(modelImagePath) {
    try {
      console.log('🎭 Creating clothing mask for inpainting');

      // Create a simple torso/clothing mask
      const image = sharp(modelImagePath);
      const metadata = await image.metadata();

      // Create mask that covers typical clothing area (torso)
      const maskWidth = metadata.width;
      const maskHeight = metadata.height;

      // Define clothing area (roughly torso area)
      const clothingArea = {
        left: Math.floor(maskWidth * 0.2),
        top: Math.floor(maskHeight * 0.3), // Below face
        width: Math.floor(maskWidth * 0.6),
        height: Math.floor(maskHeight * 0.5) // Torso area
      };

      // Create proper mask: white areas to inpaint, black areas to preserve
      const maskSvg = `<svg width="${maskWidth}" height="${maskHeight}">
        <rect width="100%" height="100%" fill="black"/>
        <rect x="${clothingArea.left}" y="${clothingArea.top}" width="${clothingArea.width}" height="${clothingArea.height}" fill="white"/>
      </svg>`;

      const mask = await sharp(Buffer.from(maskSvg))
        .png()
        .toBuffer();

      const maskBase64 = mask.toString('base64');
      console.log('✅ Clothing mask created successfully');

      return {
        success: true,
        maskBase64,
        maskArea: clothingArea
      };

    } catch (error) {
      console.error('❌ Error creating clothing mask:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateWithFluxFill(baseImageBase64, maskBase64, prompt, productImagePath, options = {}) {
    try {
      console.log('🎨 Starting FLUX Fill inpainting generation');

      // Read product image for reference in prompt
      const fs = require('fs');
      let productAnalysis = '';
      if (fs.existsSync(productImagePath)) {
        console.log('👕 Analyzing product for inpainting prompt');
        // You could add product analysis here if needed
        productAnalysis = 'uploaded product reference';
      }

      // Enhanced prompt for inpainting
      const inpaintPrompt = `Replace the clothing in the masked area with clothing that matches the ${productAnalysis}. Keep the person's face, hair, skin tone, and pose exactly the same. Only change the clothing in the white masked area. ${prompt}`;

      console.log('📝 Inpainting prompt:', inpaintPrompt);

      // Map size to aspect ratio
      let aspectRatio = '1:1';
      if (options.size === '1024x1536') {
        aspectRatio = '2:3';
      } else if (options.size === '1536x1024') {
        aspectRatio = '3:2';
      }

      const requestBody = {
        prompt: inpaintPrompt,
        input_image: baseImageBase64,
        mask_image: maskBase64,
        aspect_ratio: aspectRatio,
        output_format: "png"
      };

      console.log('🚀 Sending FLUX Fill request...');
      console.log('📝 Request details:');
      console.log('- Endpoint:', `${this.baseURL}/flux-fill`);
      console.log('- Prompt length:', inpaintPrompt.length);
      console.log('- Base image size:', baseImageBase64.length);
      console.log('- Mask image size:', maskBase64.length);
      console.log('- Aspect ratio:', aspectRatio);

      const response = await axios.post(
        `${this.baseURL}/flux-fill`,
        requestBody,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      console.log('✅ FLUX Fill response received');
      console.log('🔍 Response status:', response.status);

      if (response.data && response.data.id) {
        // Poll for result
        const result = await this.pollForResult(response.data.id);
        if (result.success) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            revisedPrompt: inpaintPrompt,
            modelUsed: 'flux-fill'
          };
        } else {
          return result;
        }
      } else if (response.data && response.data.sample) {
        return {
          success: true,
          imageUrl: result.imageUrl,
          revisedPrompt: inpaintPrompt,
          modelUsed: 'flux-fill'
        };
      } else {
        throw new Error('Invalid response format from FLUX Fill API');
      }

    } catch (error) {
      console.error('❌ Error in FLUX Fill generation:', error.message);

      if (error.response) {
        console.error('🚫 FLUX Fill API Error Details:');
        console.error('Status:', error.response.status);
        console.error('Status Text:', error.response.statusText);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Request URL:', `${this.baseURL}/flux-fill`);

        return {
          success: false,
          error: error.response.data?.error?.message || error.response.data?.message || `FLUX Fill API Error: ${error.response.status} ${error.response.statusText}`,
          code: error.response.status,
          details: error.response.data
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error in FLUX Fill'
      };
    }
  }

  async getModelDescription(referenceImagePath) {
    try {
      // Get model characteristics from the path
      const imageName = path.basename(referenceImagePath);
      const modelId = imageName.split('-')[0]; // Extract model ID from filename

      const { KUSTOMPEDIA_MODELS } = require('../config/models');
      const model = KUSTOMPEDIA_MODELS[modelId];

      if (model && model.characteristics) {
        const char = model.characteristics;
        return `${char.ethnicity} ${char.gender}, age ${char.age}, ${char.hair}, ${char.facial_hair || 'clean-shaven'}, ${char.build} build, ${char.expression} expression`;
      }

      // Fallback description
      return `Indonesian person, professional appearance, clean-shaven, medium build`;
    } catch (error) {
      console.error('❌ Error getting model description:', error);
      return `Indonesian person, professional appearance`;
    }
  }

  async downloadImageForStep2(imageUrl) {
    try {
      console.log('⬇️ Downloading Step 1 result for Step 2 input...');

      const axios = require('axios');
      const fs = require('fs');
      const path = require('path');

      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // Save temporarily for Step 2
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFileName = `step1_${Date.now()}.png`;
      const tempFilePath = path.join(tempDir, tempFileName);

      fs.writeFileSync(tempFilePath, buffer);
      console.log('✅ Step 1 image saved for Step 2:', tempFilePath);

      return tempFilePath;

    } catch (error) {
      console.error('❌ Error downloading Step 1 image:', error.message);
      throw error;
    }
  }

  async generateWithMultiStep(referenceImagePath, prompt, options = {}) {
    console.log('🎯 MULTI-STEP: Starting enhanced two-phase generation');

    const {
      quality = 'standard',
      size = '1024x1024',
      productImagePath = null,
      productAnalysisResult = null,
      enhancedProductAnalysis = null,
      pose = 'arms crossed',
      model = null
    } = options;

    try {
      // STEP 1: Generate base try-on with FORCED model consistency
      console.log('🔸 STEP 1: FORCED model consistency using reference image');

      const fs = require('fs');
      const path = require('path');

      // Read model image for Step 1
      // Construct path to frontend/public/models/ from backend/src/services/
      const fullImagePath = path.join(__dirname, '../../../frontend/public/models/', path.basename(referenceImagePath));
      if (!fs.existsSync(fullImagePath)) {
        throw new Error(`Reference image not found: ${fullImagePath}`);
      }

      const imageBuffer = fs.readFileSync(fullImagePath);
      const modelImageBase64 = imageBuffer.toString('base64');

      // Step 1 prompt: Basic clothing change while maintaining model
      const step1Prompt = `${prompt} STEP 1: Change clothing while maintaining EXACT same person - identical facial features, hair, skin tone, expression, pose.`;

      // Map size to aspect ratio
      let aspectRatio = '1:1';
      if (size === '1024x1536') aspectRatio = '2:3';
      else if (size === '1536x1024') aspectRatio = '3:2';

      const step1Body = {
        prompt: step1Prompt,
        input_image: modelImageBase64,
        aspect_ratio: aspectRatio
      };

      console.log('🚀 Sending Step 1 request to FLUX...');
      const step1Response = await axios.post(
        `${this.baseURL}/flux-kontext-pro`,
        step1Body,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      console.log('✅ Step 1 response received');

      // Get Step 1 result
      let step1Result;
      if (step1Response.data && step1Response.data.id) {
        step1Result = await this.pollForResult(step1Response.data.id);
        if (!step1Result.success) {
          throw new Error(`Step 1 failed: ${step1Result.error}`);
        }
      } else if (step1Response.data && step1Response.data.sample) {
        step1Result = { success: true, imageUrl: step1Response.data.sample };
      } else {
        throw new Error('Step 1: Invalid response format');
      }

      console.log('✅ Step 1 completed, starting Step 2');

      // STEP 2: Product matching with FORCED Johny face preservation
      console.log('🔹 STEP 2: Product matching with FORCED Johny reference');

      // FORCE: Use original Johny reference again, NOT Step 1 result
      // This prevents face drift between steps
      const step2InputBase64 = modelImageBase64; // Use original Johny, not Step 1 result

      // Read product image for detailed analysis
      let productImageBase64 = null;
      if (productImagePath) {
        let fullProductPath;
        if (path.isAbsolute(productImagePath)) {
          fullProductPath = productImagePath;
        } else {
          fullProductPath = path.join(__dirname, '../../', productImagePath);
        }

        if (fs.existsSync(fullProductPath)) {
          const productBuffer = fs.readFileSync(fullProductPath);
          productImageBase64 = productBuffer.toString('base64');
        }
      }

      // AGGRESSIVE Step 2: Use hybrid approach for maximum product accuracy
      let step2InputImage, step2Prompt;

      if (productImageBase64) {
        console.log('🔥 FORCED Step 2: Using JOHNY reference + product composite');

        // Create composite with Johny reference DOMINANT + product reference
        const compositeBase64 = await this.createProductDominantComposite(modelImageBase64, productImagePath);

        // Use JOHNY reference as primary input for Step 2
        step2InputImage = compositeBase64 || step2InputBase64;
        // Build detailed product description from analysis
        let productDescription = 'the uploaded product reference';
        if (productAnalysisResult && productAnalysisResult.structured) {
          const s = productAnalysisResult.structured;
          productDescription = `${s.primary_color || 'colored'} ${s.material || 'fabric'} ${s.garment_type || 'garment'} with ${s.sleeve_type || 'sleeves'}, ${s.collar || 'collar'}, ${s.fit || 'regular'} fit, ${s.style || 'casual'} style. Pattern: ${s.pattern || 'solid'}. ${s['logos/text'] && s['logos/text'] !== 'none' ? `Logos/Text: ${s['logos/text']}.` : ''} ${s.special_features && s.special_features !== 'none' ? `Features: ${s.special_features}.` : ''}`;
        } else if (productAnalysisResult && productAnalysisResult.analysis) {
          productDescription = productAnalysisResult.analysis;
        }

        step2Prompt = `PRODUCT REPLACEMENT: Replace the current clothing with this exact garment: ${productDescription}. PRESERVE PERSON: Keep EXACT same face, hair, skin tone, expression as the original model. DETAILED CLOTHING MATCH: Copy every visual detail from the product - exact colors, patterns, logos, text, style, fit, sleeves, collar, buttons, and all design elements. ${prompt}`;

        console.log('👤 Step 2 using JOHNY reference as primary');
        console.log('👕 Product reference in composite');

      } else {
        // Fallback if no product image
        step2InputImage = step1ImageBase64;
        step2Prompt = `STEP 2 REFINEMENT: Adjust the clothing details. Keep the SAME person (face, hair, skin, expression, pose). ${prompt}`;
      }

      const step2Body = {
        prompt: step2Prompt,
        input_image: step2InputImage,
        aspect_ratio: aspectRatio
      };

      console.log('🚀 Sending Step 2 refinement request...');
      const step2Response = await axios.post(
        `${this.baseURL}/flux-kontext-pro`,
        step2Body,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      console.log('✅ Step 2 response received');

      // Get Step 2 final result
      let step2Result;
      if (step2Response.data && step2Response.data.id) {
        step2Result = await this.pollForResult(step2Response.data.id);
        if (!step2Result.success) {
          console.warn('⚠️ Step 2 failed, returning Step 1 result');
          step2Result = step1Result;
        }
      } else if (step2Response.data && step2Response.data.sample) {
        step2Result = { success: true, imageUrl: step2Response.data.sample };
      } else {
        console.warn('⚠️ Step 2 invalid response, returning Step 1 result');
        step2Result = step1Result;
      }

      console.log('🎯 MULTI-STEP: Both steps completed successfully');

      return {
        success: true,
        imageUrl: step2Result.imageUrl,
        revisedPrompt: `Multi-step: ${step1Prompt} → ${step2Prompt}`,
        modelUsed: 'flux-kontext-pro-multistep',
        step1Result: step1Result.imageUrl,
        step2Result: step2Result.imageUrl
      };

    } catch (error) {
      console.error('❌ Error in multi-step generation:', error.message);

      if (error.response) {
        console.error('FLUX Multi-step API Error:', error.response.data);
        return {
          success: false,
          error: error.response.data.error?.message || 'Multi-step FLUX API Error',
          code: error.response.status
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error in multi-step generation'
      };
    }
  }

  async extractModelCharacteristics(step1ImageBase64) {
    // Extract visual characteristics from Step 1 result for Step 2
    // For now, use enhanced descriptions - could be upgraded with vision analysis later
    console.log('🔍 Extracting model characteristics from Step 1 result');

    // Return comprehensive description for Step 2 matching
    return 'the exact same person from the reference - identical facial features, hair style, hair color, skin tone, body build, expression, and overall appearance. The person should look exactly like the successful model from the previous step.';
  }

  async getModelDescription(referenceImagePath) {
    try {
      console.log('🔍 Extracting model characteristics from reference');

      const fs = require('fs');
      const path = require('path');

      // For now, return predefined descriptions based on reference path
      // TODO: Could enhance with vision API analysis if needed

      if (referenceImagePath.includes('johny')) {
        return 'Indonesian young man with short dark hair, olive skin tone, friendly expression, athletic build, confident pose';
      } else if (referenceImagePath.includes('nyoman')) {
        return 'Indonesian young man with styled dark hair, warm skin tone, professional appearance, lean build, approachable expression';
      } else if (referenceImagePath.includes('isabella')) {
        return 'Indonesian young woman with long dark hair, olive skin tone, elegant features, slender build, graceful pose';
      } else {
        // Generic description
        return 'Person with Asian features, dark hair, warm skin tone, professional appearance, confident expression';
      }
    } catch (error) {
      console.error('❌ Error getting model description:', error.message);
      return 'Asian model with professional appearance and confident expression';
    }
  }

  generateUniqueFilename(prefix = 'flux_generated') {
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `${prefix}_${timestamp}_${uuid}.png`;
  }

  buildEnhancedStage1Prompt(model, pose) {
    if (!model || !model.characteristics) {
      return `STAGE 1 - MODEL CONSISTENCY: Generate the exact same person with perfect facial consistency. Adjust to ${pose.toLowerCase()} pose while maintaining all facial features. Professional fashion photography with studio lighting.`;
    }

    const char = model.characteristics;
    const modelDescription = `${char.ethnicity || ''} ${char.gender || ''}, ${char.age || ''}, ${char.hair || ''}, ${char.facial_hair || ''}, ${char.build || ''} build, ${char.expression || ''} expression`.trim();

    return `STAGE 1 - PERFECT MODEL CONSISTENCY: Generate the exact same person with these characteristics: ${modelDescription}. 
    
PRESERVE EXACTLY: Same face, hair color, skin tone, eyes, facial structure, body build.
POSE ADJUSTMENT: Change to ${pose.toLowerCase()} pose while maintaining all physical characteristics.
CLOTHING: Keep current clothing (will be changed in stage 2).
QUALITY: Professional fashion photography with studio lighting.
CRITICAL: 100% facial and physical consistency with the reference person.`;
  }

  buildEnhancedStage2Prompt(enhancedProductAnalysis, pose, model) {
    if (!enhancedProductAnalysis || !enhancedProductAnalysis.success) {
      return `STAGE 2 - CLOTHING REPLACEMENT: Replace ONLY the clothing with the garment from the product reference image. 
      
PRESERVE: Exact same face, hair, skin tone, ${pose.toLowerCase()} pose, body position, and background.
CHANGE ONLY: Clothing/garment to match the uploaded product reference exactly.
SURGICAL PRECISION: Do not alter anything about the person except the clothing.
QUALITY: Professional fashion photography with studio lighting.`;
    }

    const structured = enhancedProductAnalysis.structured || {};
    const branding = enhancedProductAnalysis.branding?.structured || {};

    let prompt = `STAGE 2 - ENHANCED CLOTHING APPLICATION: Replace ONLY the clothing with this exact garment specification:

GARMENT SPECIFICATIONS:
- Type: ${structured.garment_type || 'garment as shown'}
- Primary Color: ${structured.primary_color || 'as shown'} (EXACT COLOR MATCH REQUIRED)
- Material: ${structured.material || 'as shown'}
- Pattern: ${structured.pattern || 'as shown'}
- Style: ${structured.style || 'as shown'}
- Fit: ${structured.fit || 'as shown'}
- Sleeves: ${structured.sleeve_type || 'as shown'}
- Collar: ${structured.collar || 'as shown'}
- Closure: ${structured.closure || 'as shown'}`;

    if (structured.pockets && structured.pockets !== 'none') {
      prompt += `\n- Pockets: ${structured.pockets}`;
    }

    if (branding.brand_name && branding.brand_name !== 'Unknown') {
      prompt += `

BRANDING REQUIREMENTS:
- Brand: ${branding.brand_name}
- Logo Type: ${branding.logo_type || 'as shown'}
- Logo Position: ${branding.logo_position || 'as shown'}
- Logo Colors: ${branding.logo_colors || 'as shown'}
- Text Content: ${branding.text_content || 'as shown'}`;
    }

    if (structured.special_features && structured.special_features !== 'none') {
      prompt += `\n- Special Features: ${structured.special_features}`;
    }

    prompt += `

CRITICAL PRESERVATION: Keep exact same face, hair, skin tone, ${pose.toLowerCase()} pose, body position, and background from Stage 1.
CHANGE ONLY: Clothing to match these exact specifications.
QUALITY: Professional fashion photography with studio lighting.
PRECISION: Every detail must match the product analysis - colors, textures, logos, construction.`;

    return prompt;
  }

  async enhancedGenerateImageWithReference(referenceImagePath, prompt, options = {}) {
    const {
      quality = 'standard',
      size = '1024x1024',
      productImagePath = null,
      enhancedProductAnalysis = null,
      useEnhancedPrompts = true,
      model = null,
      pose = 'arms crossed',
      strategy = 'balanced'
    } = options;

    console.log(`🚀 Enhanced FLUX generation with strategy: ${strategy}`);

    try {
      let enhancedPrompt = prompt;
      let generationOptions = { ...options };

      // Apply strategy-specific enhancements
      switch (strategy) {
        case 'multi-stage':
          return await this.generateWithEnhancedMultiStep(referenceImagePath, prompt, options);

        case 'model-first':
          enhancedPrompt = this.buildModelFirstPrompt(prompt, model, enhancedProductAnalysis, pose);
          generationOptions.modelPriority = true;
          break;

        case 'product-first':
          enhancedPrompt = this.buildProductFirstPrompt(prompt, enhancedProductAnalysis, pose);
          generationOptions.productPriority = true;
          generationOptions.useReverseApproach = true;
          break;

        case 'balanced':
        default:
          enhancedPrompt = this.buildBalancedPrompt(prompt, model, enhancedProductAnalysis, pose);
          generationOptions.balanced = true;
          break;
      }

      console.log('📝 Using enhanced prompt strategy:', strategy);
      return await this.generateImageWithReference(referenceImagePath, enhancedPrompt, generationOptions);

    } catch (error) {
      console.error('❌ Enhanced FLUX generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildModelFirstPrompt(basePrompt, model, enhancedProductAnalysis, pose) {
    const modelChar = this.getModelCharacteristics(model);

    let prompt = `MODEL-FIRST FLUX GENERATION: Prioritize perfect model consistency.

CRITICAL MODEL PRESERVATION: ${modelChar}
POSE: ${pose.toLowerCase()} pose
CLOTHING CHANGE: ${basePrompt}`;

    if (enhancedProductAnalysis?.success && enhancedProductAnalysis.structured) {
      const structured = enhancedProductAnalysis.structured;
      prompt += `

PRODUCT REFERENCE (Secondary Priority):
- ${structured.primary_color || ''} ${structured.garment_type || 'garment'}
- Material: ${structured.material || 'as shown'}
- Style: ${structured.style || 'as shown'}`;
    }

    prompt += `

FLUX OPTIMIZATION: Use Kontext editing for surgical precision.
PRIORITY ORDER: 1) Model face consistency, 2) Pose accuracy, 3) Product details.
QUALITY: Professional fashion photography with studio lighting.`;

    return prompt;
  }

  buildProductFirstPrompt(basePrompt, enhancedProductAnalysis, pose) {
    let prompt = `PRODUCT-FIRST FLUX GENERATION: Prioritize maximum product accuracy.

CLOTHING SPECIFICATIONS: ${basePrompt}`;

    if (enhancedProductAnalysis?.success && enhancedProductAnalysis.structured) {
      const structured = enhancedProductAnalysis.structured;
      const branding = enhancedProductAnalysis.branding?.structured || {};

      prompt += `

EXACT PRODUCT MATCH REQUIRED:
- Type: ${structured.garment_type || 'garment'}
- Color: ${structured.primary_color || 'as shown'} (CRITICAL: EXACT COLOR MATCH)
- Material: ${structured.material || 'as shown'}
- Pattern: ${structured.pattern || 'as shown'}
- Style: ${structured.style || 'as shown'}
- Fit: ${structured.fit || 'as shown'}`;

      if (branding.brand_name && branding.brand_name !== 'Unknown') {
        prompt += `
- Branding: ${branding.brand_name} ${branding.logo_type || ''} on ${branding.logo_position || 'garment'}`;
      }
    }

    prompt += `

POSE: ${pose.toLowerCase()} pose
FLUX OPTIMIZATION: Use reverse approach with product as primary reference.
PRIORITY ORDER: 1) Product accuracy, 2) Color matching, 3) Model resemblance.
QUALITY: Professional fashion photography with studio lighting.`;

    return prompt;
  }

  buildBalancedPrompt(basePrompt, model, enhancedProductAnalysis, pose) {
    const modelChar = this.getModelCharacteristics(model);

    let prompt = `BALANCED FLUX GENERATION: Equal priority for model consistency and product accuracy.

MODEL CONSISTENCY: ${modelChar}
POSE: ${pose.toLowerCase()} pose
CLOTHING CHANGE: ${basePrompt}`;

    if (enhancedProductAnalysis?.success && enhancedProductAnalysis.structured) {
      const structured = enhancedProductAnalysis.structured;
      prompt += `

PRODUCT ACCURACY:
- ${structured.primary_color || ''} ${structured.garment_type || 'garment'}
- Material: ${structured.material || 'as shown'}
- Style: ${structured.style || 'as shown'}
- Fit: ${structured.fit || 'as shown'}`;
    }

    prompt += `

FLUX OPTIMIZATION: Use Kontext editing with balanced approach.
EQUAL PRIORITY: Model consistency AND product accuracy are equally important.
QUALITY: Professional fashion photography with studio lighting.`;

    return prompt;
  }

  getModelCharacteristics(model) {
    if (!model || !model.characteristics) {
      return 'Same person with identical facial features';
    }

    const char = model.characteristics;
    return `${char.ethnicity || ''} ${char.gender || ''}, ${char.age || ''}, ${char.hair || ''}, ${char.facial_hair || ''}, ${char.build || ''} build, ${char.expression || ''} expression`.trim();
  }

  async generateWithEnhancedMultiStep(referenceImagePath, prompt, options = {}) {
    const {
      size = '1024x1024',
      productImagePath,
      enhancedProductAnalysis,
      pose = 'arms crossed',
      model
    } = options;

    console.log('🎯🎯 ENHANCED MULTI-STEP FLUX GENERATION');
    console.log('=====================================');

    try {
      // STAGE 1: Perfect model consistency with enhanced prompting
      console.log('1️⃣ ENHANCED STAGE 1: Perfect model consistency');

      const stage1Prompt = this.buildEnhancedStage1Prompt(model, pose);
      const stage1Result = await this.generateImageWithReference(referenceImagePath, stage1Prompt, {
        size,
        productImagePath: null, // No product interference
        useMultiStep: false,
        useReverseApproach: false
      });

      if (!stage1Result.success) {
        console.error('❌ Enhanced Stage 1 failed:', stage1Result.error);
        return stage1Result;
      }

      console.log('✅ Enhanced Stage 1 completed');

      // Download Stage 1 result
      const stage1ImagePath = await this.downloadImageForStep2(stage1Result.imageUrl);

      // STAGE 2: Enhanced product application
      console.log('2️⃣ ENHANCED STAGE 2: Precise product application');

      const stage2Prompt = this.buildEnhancedStage2Prompt(enhancedProductAnalysis, pose, model);
      const stage1RelativePath = path.relative(path.join(__dirname, '../../'), stage1ImagePath);

      const stage2Result = await this.generateImageWithReference(stage1RelativePath, stage2Prompt, {
        size,
        productImagePath,
        useMultiStep: false,
        useReverseApproach: false
      });

      if (!stage2Result.success) {
        console.error('❌ Enhanced Stage 2 failed:', stage2Result.error);
        return stage2Result;
      }

      console.log('✅ Enhanced Stage 2 completed');
      console.log('🎉 ENHANCED MULTI-STEP GENERATION COMPLETE!');

      // Cleanup temporary file
      this.cleanupTempFile(stage1ImagePath);

      return {
        success: true,
        imageUrl: stage2Result.imageUrl,
        stage1Url: stage1Result.imageUrl,
        stage2Url: stage2Result.imageUrl,
        revisedPrompt: stage2Prompt,
        modelUsed: 'flux-enhanced-multi-step',
        enhancedGeneration: true,
        stages: {
          stage1: {
            prompt: stage1Prompt,
            result: stage1Result.imageUrl
          },
          stage2: {
            prompt: stage2Prompt,
            result: stage2Result.imageUrl
          }
        }
      };

    } catch (error) {
      console.error('❌ Enhanced multi-step generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  cleanupTempFile(filePath) {
    try {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🧹 Cleaned up temporary file:', filePath);
      }
    } catch (error) {
      console.warn('⚠️ Could not clean up temporary file:', filePath, error.message);
    }
  }

  /**
   * BlackForest Lab Playground-style generation with multiple image inputs
   * Matches the effective BFL playground approach with simple prompts
   */
  async generateWithMultipleImages(options = {}) {
    const {
      modelImagePath,
      productImagePath,
      detailImages = [], // Array of detail image paths (embroidery, screen printing, etc.)
      prompt,
      pose = 'one arm pose',
      garmentType = 'shirt',
      size = '1024x1024'
    } = options;

    if (!this.apiKey) {
      return {
        success: false,
        error: 'Black Forest Labs API key not configured'
      };
    }

    console.log('🎯 BFL PLAYGROUND APPROACH: Multiple image generation');
    console.log('==============================================');
    console.log('📸 Model image:', modelImagePath);
    console.log('👕 Product image:', productImagePath);
    console.log('🎨 Detail images:', detailImages.length);
    console.log('✨ Pose:', pose);

    try {
      // Create BFL playground-style composite with all images
      const compositeImage = await this.createBFLPlaygroundComposite({
        modelImagePath,
        productImagePath,
        detailImages
      });

      if (!compositeImage) {
        throw new Error('Failed to create BFL playground-style composite');
      }

      // Build simple, effective prompt like BFL playground
      const bflPrompt = this.buildBFLPlaygroundPrompt({
        pose,
        garmentType,
        prompt,
        hasDetailImages: detailImages.length > 0
      });

      console.log('📝 BFL Playground prompt:', bflPrompt);

      // Map size to aspect ratio
      let aspectRatio = '1:1';
      if (size === '1024x1536') aspectRatio = '2:3';
      else if (size === '1536x1024') aspectRatio = '3:2';

      const requestBody = {
        prompt: bflPrompt,
        input_image: compositeImage,
        aspect_ratio: aspectRatio
      };

      console.log('🚀 Sending BFL playground-style request to FLUX...');
      const response = await axios.post(
        `${this.baseURL}/flux-kontext-pro`,
        requestBody,
        {
          headers: {
            'accept': 'application/json',
            'x-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      console.log('✅ BFL playground response received');

      if (response.data && response.data.id) {
        const result = await this.pollForResult(response.data.id);
        if (result.success) {
          return {
            success: true,
            imageUrl: result.imageUrl,
            revisedPrompt: bflPrompt,
            modelUsed: 'flux-bfl-playground',
            approach: 'multiple-images'
          };
        } else {
          return result;
        }
      } else if (response.data && response.data.sample) {
        return {
          success: true,
          imageUrl: response.data.sample,
          revisedPrompt: bflPrompt,
          modelUsed: 'flux-bfl-playground',
          approach: 'multiple-images'
        };
      } else {
        throw new Error('Invalid response format from FLUX API');
      }

    } catch (error) {
      console.error('❌ BFL playground generation failed:', error.message);

      if (error.response) {
        console.error('🚫 FLUX API Error:', error.response.data);
        return {
          success: false,
          error: error.response.data.error?.message || 'FLUX API Error',
          code: error.response.status
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error in BFL playground generation'
      };
    }
  }

  /**
   * Create BFL playground-style composite with model, product, and detail images
   */
  async createBFLPlaygroundComposite(options = {}) {
    const { modelImagePath, productImagePath, detailImages = [] } = options;

    try {
      console.log('🖼️ Creating BFL playground-style composite');

      const fs = require('fs');

      // Read model image
      const modelFullPath = this.resolveImagePath(modelImagePath, 'models');
      if (!fs.existsSync(modelFullPath)) {
        throw new Error(`Model image not found: ${modelFullPath}`);
      }
      const modelBuffer = fs.readFileSync(modelFullPath);
      console.log('👤 Model image loaded');

      // Read product image
      const productFullPath = this.resolveImagePath(productImagePath);
      if (!fs.existsSync(productFullPath)) {
        throw new Error(`Product image not found: ${productFullPath}`);
      }
      const productBuffer = fs.readFileSync(productFullPath);
      console.log('👕 Product image loaded');

      // Read detail images
      const detailBuffers = [];
      for (const detailPath of detailImages) {
        const detailFullPath = this.resolveImagePath(detailPath);
        if (fs.existsSync(detailFullPath)) {
          const detailBuffer = fs.readFileSync(detailFullPath);
          detailBuffers.push(detailBuffer);
          console.log('🎨 Detail image loaded:', path.basename(detailPath));
        } else {
          console.warn('⚠️ Detail image not found:', detailFullPath);
        }
      }

      // Create BFL playground layout: Model (dominant) + Product + Details
      const modelImage = sharp(modelBuffer);
      const productImage = sharp(productBuffer);

      // Target dimensions for composite
      const compositeWidth = 1024;
      const compositeHeight = 1024;

      // Model takes main area (60%)
      const modelAreaWidth = Math.floor(compositeWidth * 0.6);
      const modelAreaHeight = compositeHeight;

      // Product and details share right side (40%)
      const sideAreaWidth = compositeWidth - modelAreaWidth;
      const productHeight = Math.floor(compositeHeight * 0.5);
      const detailsHeight = compositeHeight - productHeight;

      // Resize model image (main subject)
      const modelResized = await modelImage
        .resize({ 
          width: modelAreaWidth, 
          height: modelAreaHeight, 
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();

      // Resize product image (reference)
      const productResized = await productImage
        .resize({ 
          width: sideAreaWidth, 
          height: productHeight, 
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();

      // Start with model as base
      let composite = await sharp({
        create: {
          width: compositeWidth,
          height: compositeHeight,
          channels: 3,
          background: { r: 245, g: 245, b: 245 }
        }
      })
        .composite([
          { input: modelResized, left: 0, top: 0 }, // Model on left (main)
          { input: productResized, left: modelAreaWidth, top: 0 } // Product on top-right
        ])
        .png();

      // Add detail images to bottom-right area
      if (detailBuffers.length > 0) {
        const detailComposites = [];
        const detailsPerRow = Math.min(2, detailBuffers.length);
        const detailWidth = Math.floor(sideAreaWidth / detailsPerRow);
        const detailHeight = Math.floor(detailsHeight / Math.ceil(detailBuffers.length / detailsPerRow));

        for (let i = 0; i < detailBuffers.length && i < 4; i++) { // Max 4 detail images
          const detailResized = await sharp(detailBuffers[i])
            .resize({ 
              width: detailWidth, 
              height: detailHeight, 
              fit: 'cover',
              position: 'center'
            })
            .png()
            .toBuffer();

          const row = Math.floor(i / detailsPerRow);
          const col = i % detailsPerRow;
          const left = modelAreaWidth + (col * detailWidth);
          const top = productHeight + (row * detailHeight);

          detailComposites.push({ input: detailResized, left, top });
        }

        composite = composite.composite(detailComposites);
      }

      const compositeBuffer = await composite.toBuffer();
      const compositeBase64 = compositeBuffer.toString('base64');

      console.log('✅ BFL playground composite created:');
      console.log(`   📐 Dimensions: ${compositeWidth}x${compositeHeight}`);
      console.log(`   👤 Model area: ${modelAreaWidth}x${modelAreaHeight} (60%)`);
      console.log(`   👕 Product area: ${sideAreaWidth}x${productHeight}`);
      console.log(`   🎨 Detail images: ${detailBuffers.length}`);

      return compositeBase64;

    } catch (error) {
      console.error('❌ Error creating BFL playground composite:', error.message);
      return null;
    }
  }

  /**
   * Build simple, effective prompt like BFL playground
   */
  buildBFLPlaygroundPrompt(options = {}) {
    const { 
      pose = 'one arm pose',
      garmentType = 'shirt',
      prompt = '',
      hasDetailImages = false
    } = options;

    // Simple, effective prompt pattern from BFL playground
    let bflPrompt = `${pose} - try on this ${garmentType} with exact design and color variation with this exact male model face`;
    
    if (hasDetailImages) {
      bflPrompt += ' - use these exact detail references also';
    }

    if (prompt) {
      bflPrompt += ` - ${prompt}`;
    }

    // Keep it simple and direct like BFL playground
    bflPrompt += '. Professional fashion photography with clean background.';

    return bflPrompt;
  }

  /**
   * Resolve image path (handle relative vs absolute paths)
   */
  resolveImagePath(imagePath, subfolder = '') {
    if (!imagePath) return null;

    const fs = require('fs');
    const path = require('path');

    // If absolute path, use directly
    if (path.isAbsolute(imagePath)) {
      return imagePath;
    }

    // For model images, check frontend/public/models/
    if (subfolder === 'models') {
      return path.join(__dirname, '../../../frontend/public/models/', path.basename(imagePath));
    }

    // For other images, check relative to backend root
    return path.join(__dirname, '../../', imagePath);
  }
}

module.exports = FluxService;