const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not found. Some features will be unavailable.');
      console.log('📝 Please set OPENAI_API_KEY in your .env file');
    } else {
      console.log('✅ OpenAI API key loaded');
    }
  }

  async generateImageWithReference(referenceImagePath, prompt, options = {}) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    const {
      quality = 'standard',
      size = '1024x1024',
      productImagePath = null
    } = options;

    try {
      console.log('🖼️ Generating image with reference:', referenceImagePath);
      console.log('🎨 Edit prompt:', prompt);
      if (productImagePath) {
        console.log('👕 Product image path:', productImagePath);
      }
      
      const fs = require('fs');
      const path = require('path');
      
      // Read the reference image
      // Construct path to frontend/public/models/ from backend/src/services/
      const fullImagePath = path.join(__dirname, '../../../frontend/public/models/', path.basename(referenceImagePath));
      console.log('📂 Full image path:', fullImagePath);
      
      if (!fs.existsSync(fullImagePath)) {
        throw new Error(`Reference image not found: ${fullImagePath}`);
      }
      
      const imageBuffer = fs.readFileSync(fullImagePath);
      console.log('📷 Image buffer size:', imageBuffer.length, 'bytes');
      
      // Create form data for the image edit request
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('image', imageBuffer, {
        filename: 'reference.png',
        contentType: 'image/png'
      });
      
      // Enhanced prompt for better product matching
      let enhancedPrompt = prompt;
      if (productImagePath) {
        enhancedPrompt = `Replace the person's current clothing with the garment from the uploaded product reference. The new clothing should match the product image including colors, logos, patches, reflective elements, material appearance, and style details. Keep everything else about the person identical. ${prompt}`;
      }
      
      formData.append('prompt', enhancedPrompt);
      formData.append('size', size);
      formData.append('model', 'gpt-image-1');
      
      const response = await axios.post(
        `${this.baseURL}/images/edits`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 90000 // 90 seconds for image editing
        }
      );

      console.log('✅ Image edit response received');
      console.log('🔍 Response status:', response.status);
      console.log('📊 Response data keys:', Object.keys(response.data));

      if (response.data && response.data.data && response.data.data[0]) {
        const imageData = response.data.data[0];
        console.log('🖼️ Image data fields:', Object.keys(imageData));
        
        // Handle different response formats
        if (imageData.b64_json) {
          console.log('📷 Received base64 image data from edit');
          return {
            success: true,
            imageData: imageData.b64_json,
            isBase64: true,
            revisedPrompt: imageData.revised_prompt || prompt,
            modelUsed: 'gpt-image-1-edit'
          };
        } else if (imageData.url) {
          console.log('🔗 Received image URL from edit:', imageData.url);
          return {
            success: true,
            imageUrl: imageData.url,
            revisedPrompt: imageData.revised_prompt || prompt,
            modelUsed: 'gpt-image-1-edit'
          };
        } else {
          console.error('❌ No valid image data found in edit response');
          return {
            success: false,
            error: 'No image data found in edit API response'
          };
        }
      } else {
        throw new Error('Invalid response format from image edit API');
      }
    } catch (error) {
      console.error('❌ Error in image edit:', error.message);
      
      if (error.response) {
        console.error('🚫 Edit API Error:', error.response.data);
        return {
          success: false,
          error: error.response.data.error?.message || 'Image edit API Error',
          code: error.response.status
        };
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error in image editing'
      };
    }
  }

  async generateImage(prompt, options = {}) {
    const {
      model = 'gpt-image-1',
      quality = 'standard',
      size = '1024x1024',
      style = 'natural',
      referenceImage = null
    } = options;

    try {
      console.log('🎨 Generating image with prompt:', prompt.substring(0, 100) + '...');
      console.log('🤖 Using model:', model);
      
      let requestBody = {
        model,
        prompt,
        size,
        n: 1
      };

      // If we have a reference image, we need to use image variation/editing approach
      if (referenceImage) {
        console.log('🖼️ Using reference image for consistency');
        
        // Try to use DALL-E 3 with variation approach
        requestBody.model = 'dall-e-3';
        requestBody.quality = quality;
        requestBody.style = 'natural';
        
        // Enhanced prompt for exact consistency
        let enhancedPrompt = `Professional portrait photograph in 2:3 aspect ratio. Show the exact same person as in the reference image - identical face, hair, skin tone, eyes, facial features, and body structure. ${prompt}. CRITICAL: Maintain 100% facial and physical consistency with the reference person. Frame from mid-chest upward with proper headroom, adequate space on sides, subject centered. Studio lighting, professional fashion photography.`;
        
        // If there's a product image, add specific instructions
        if (productImagePath) {
          enhancedPrompt += ` IMPORTANT: The clothing should match exactly what is shown in the uploaded product reference image - same colors, style, fit, and all details.`;
        }
        
        requestBody.prompt = enhancedPrompt;
      } else {
        // Add quality parameter for DALL-E models
        if (model.includes('dall-e')) {
          requestBody.quality = quality;
          requestBody.style = style;
        }
      }
      
      const response = await axios.post(
        `${this.baseURL}/images/generations`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      console.log('🔍 Full API Response Structure:');
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));

      if (response.data && response.data.data && response.data.data[0]) {
        const imageData = response.data.data[0];
        console.log('🖼️ Image data fields:', Object.keys(imageData));
        
        // Handle different response formats
        if (imageData.b64_json) {
          console.log('📷 Received base64 image data');
          return {
            success: true,
            imageData: imageData.b64_json,
            isBase64: true,
            revisedPrompt: imageData.revised_prompt || prompt,
            modelUsed: requestBody.model
          };
        } else if (imageData.url) {
          console.log('🔗 Received image URL:', imageData.url);
          return {
            success: true,
            imageUrl: imageData.url,
            revisedPrompt: imageData.revised_prompt || prompt,
            modelUsed: requestBody.model
          };
        } else {
          console.error('❌ No valid image data found in response');
          console.log('📊 Available fields:', Object.keys(imageData));
          return {
            success: false,
            error: 'No image data found in API response',
            responseData: imageData
          };
        }
      } else {
        console.error('❌ Invalid response structure from OpenAI');
        console.log('📊 Response structure:', response.data);
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (error) {
      console.error('❌ Error generating image with', model, ':', error.message);
      
      if (error.response) {
        console.error('OpenAI API Error:', error.response.data);
        
        // If there's an error and we were trying to use a reference, fall back to text-only
        if (options.referenceImage && error.response.status === 400) {
          console.log('🔄 Reference image approach failed, trying text-only...');
          return this.generateImage(prompt, { ...options, referenceImage: null, model: 'dall-e-3' });
        }
        
        return {
          success: false,
          error: error.response.data.error?.message || 'API Error',
          code: error.response.status
        };
      }
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async saveBase64Image(base64Data, filename) {
    try {
      console.log('💾 Saving base64 image to:', filename);
      
      // Remove data URL prefix if present
      const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const uploadsDir = path.join(__dirname, '../../uploads');
      
      // Ensure uploads directory exists
      const fs = require('fs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filePath = path.join(uploadsDir, filename);
      
      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(base64String, 'base64');
      await require('fs').promises.writeFile(filePath, imageBuffer);
      
      console.log('💾 Base64 image saved to:', filePath);
      
      return {
        success: true,
        filePath,
        fileName: filename
      };
    } catch (error) {
      console.error('❌ Error saving base64 image:', error.message);
      return {
        success: false,
        error: `Failed to save base64 image: ${error.message}`
      };
    }
  }

  async downloadAndSaveImage(imageUrl, filename) {
    try {
      console.log('📥 Downloading image from:', imageUrl);
      
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
      console.log('💾 Image saved to:', filePath);
      
      return {
        success: true,
        filePath,
        fileName: filename
      };
    } catch (error) {
      console.error('❌ Error downloading image:', error.message);
      console.error('URL was:', imageUrl);
      return {
        success: false,
        error: `Failed to download image: ${error.message}`
      };
    }
  }

  async enhanceLogo(baseImagePath, logoFile, logoDescription, logoPosition) {
    try {
      console.log('🔧 Enhancing logo on image:', baseImagePath);
      console.log('🏷️ Logo details:', { logoDescription, logoPosition });
      
      // Build enhancement prompt focusing on logo quality
      const position = logoPosition.toLowerCase().replace(/([A-Z])/g, ' $1').trim();
      const enhancementPrompt = `Professional fashion photograph in 2:3 portrait ratio. Person wearing garment with a crystal-clear, high-definition ${logoDescription} positioned on the ${position}. The logo must be:
      - Extremely sharp and detailed
      - High contrast and clearly visible
      - Professionally embroidered or printed appearance
      - Perfect positioning and sizing
      - Maintains all original logo colors and details
      Frame from mid-chest upward, proper headroom, adequate side space, centered subject. Studio lighting, professional quality.`;
      
      // Generate enhanced image with focus on logo quality
      const imageResult = await this.generateImage(enhancementPrompt, {
        quality: 'hd',
        size: '1024x1536',
        model: 'dall-e-3'
      });

      if (imageResult.success) {
        console.log('✅ Logo enhanced successfully');
        return {
          success: true,
          imageUrl: imageResult.imageUrl,
          imageData: imageResult.imageData,
          isBase64: imageResult.isBase64
        };
      } else {
        throw new Error(imageResult.error || 'Failed to enhance logo');
      }
    } catch (error) {
      console.error('❌ Error enhancing logo:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeProductImage(imagePath) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    try {
      console.log('🔍 Analyzing product image with detailed attributes:', imagePath);
      
      const fs = require('fs');
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `PRODUCT ANALYSIS FOR FLUX GENERATION: Analyze this clothing item and provide EXACT details in this structured format:

GARMENT TYPE: [shirt/t-shirt/polo/hoodie/jacket/etc.]
PRIMARY COLOR: [use specific color names like "bright orange", "navy blue", "forest green", "crisp white"]
SECONDARY COLORS: [any accent colors]
MATERIAL: [cotton/polyester/denim/fleece/etc.]
PATTERN: [solid/striped/plaid/graphic/etc.]
STYLE: [casual/formal/athletic/workwear/etc.]
FIT: [slim/regular/loose/oversized/etc.]
SLEEVE TYPE: [short sleeve/long sleeve/sleeveless/3/4 sleeve]
COLLAR: [crew neck/v-neck/polo collar/hoodie/button-up collar]
CLOSURE: [pullover/button-up/zip-up/etc.]
POCKETS: [describe location, style, and number]
LOGOS/TEXT: [describe any visible text, logos, or graphics - their exact text, colors, position]
SPECIAL FEATURES: [reflective strips, patches, badges, embroidery, etc.]
CONSTRUCTION DETAILS: [seam types, stitching color, button details]

Be extremely specific with colors and details for accurate reproduction.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      if (response.data?.choices?.[0]?.message?.content) {
        const analysis = response.data.choices[0].message.content;
        console.log('✅ Detailed product analysis completed');
        
        // Parse the structured analysis
        const structuredData = this.parseProductAnalysis(analysis);
        
        return {
          success: true,
          analysis: analysis,
          structured: structuredData
        };
      } else {
        throw new Error('No analysis returned from vision API');
      }
    } catch (error) {
      console.error('❌ Error analyzing product image:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  parseProductAnalysis(analysis) {
    try {
      const lines = analysis.split('\n');
      const data = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':').map(s => s.trim());
          if (value && value !== '[' && !value.includes('[')) {
            data[key.toLowerCase().replace(/\s+/g, '_')] = value;
          }
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error parsing product analysis:', error.message);
      return {};
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
      // Use structured analysis for precise matching (BFL recommended approach)
      const {
        garment_type = 'shirt',
        primary_color = 'blue',
        material = 'cotton',
        pattern = 'solid',
        style = 'casual',
        fit = 'regular',
        sleeve_type = 'short sleeve',
        collar = 'crew neck',
        closure = 'pullover',
        pockets = 'none',
        'logos/text': logos = 'none',
        special_features = 'none'
      } = structuredAnalysis;
      
      prompt = `EXACT PRODUCT MATCH: ${primary_color} ${material} ${garment_type} with ${sleeve_type}, ${collar}, ${fit} fit, ${style} style. Pattern: ${pattern}. Closure: ${closure}. Pockets: ${pockets}. Logos/Text: ${logos}. Special features: ${special_features}. CRITICAL: Match exact color ${primary_color}, exact material appearance ${material}, exact style ${style}. Person in ${pose.toLowerCase()} pose.`;
      
    } else if (productImage && productAnalysis) {
      // Fallback to detailed analysis
      prompt = `PRECISE CLOTHING MATCH: ${productAnalysis}. CRITICAL: Match every visual detail exactly - colors, materials, logos, patterns, style. Person maintains ${pose.toLowerCase()} pose.`;
      
    } else if (productImage) {
      // When user uploads a product image but no analysis
      prompt = `Replace clothing with exact garment from uploaded reference. Match all details: style, colors, patterns, textures, fit, logos. Person maintains ${pose.toLowerCase()} pose.`;
      
    } else {
      // When no product image, use description with pose
      const colorText = garmentColor ? `${garmentColor} ` : '';
      prompt = `Person wearing ${colorText}${garment.description} in ${pose.toLowerCase()} pose.`;
    }
    
    // Add logo details if specified
    if (logoDescription && logoPosition) {
      const position = logoPosition.toLowerCase().replace(/([A-Z])/g, ' $1').trim();
      if (logoFocusEnabled) {
        prompt += ` LOGO REQUIREMENT: Highly detailed, crisp, HD-quality ${logoDescription} positioned exactly on the ${position}. Logo must be sharp, professionally rendered, clearly visible with excellent detail and contrast.`;
      } else {
        prompt += ` Include ${logoDescription} on the ${position}.`;
      }
    }
    
    // Add critical framing and consistency instructions for square format
    prompt += ` PRESERVE: Exact same person - identical facial features, hair style, hair color, skin tone, eyes, expression. CHANGE ONLY: Clothing to match specifications exactly. Professional portrait photography with studio lighting and clean background.`;
    
    if (additionalDetails) {
      prompt += ` Additional: ${additionalDetails}`;
    }

    return prompt;
  }

  async cropTo23Ratio(imagePath) {
    try {
      console.log('✂️ Cropping image to 2:3 ratio:', imagePath);
      
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      console.log(`📐 Original dimensions: ${metadata.width}x${metadata.height}`);
      
      // For 2:3 ratio from 1024x1024 square - matching nyoman-2.png reference framing
      // Reference shows: head with space above, full shoulders, extends to mid-torso
      const targetWidth = Math.floor(metadata.width * 0.68); // Wider crop to match reference proportions
      const targetHeight = Math.floor(targetWidth * 1.5); // 2:3 ratio (width:height = 2:3)
      
      // Position crop to match reference image framing exactly
      // Center horizontally, position to show proper head space and torso length
      const left = Math.floor((metadata.width - targetWidth) / 2);
      const top = Math.floor(metadata.height * 0.12); // Start 12% from top for proper head spacing
      
      console.log(`🎯 Target dimensions: ${targetWidth}x${targetHeight} (2:3 ratio)`);
      console.log(`📍 Crop position: left=${left}, top=${top}`);
      console.log(`📏 Crop area: ${targetWidth}x${targetHeight} from ${left},${top}`);
      
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
      
      console.log('✅ Image cropped successfully to:', croppedPath);
      
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
      console.error('❌ Error cropping image:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateUniqueFilename(prefix = 'generated') {
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    return `${prefix}_${timestamp}_${uuid}.png`;
  }
}

module.exports = OpenAIService;
