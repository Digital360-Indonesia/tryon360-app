const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageProcessor {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    this.outputFormat = 'jpeg';
    this.outputQuality = 85;
  }

  /**
   * Process uploaded product image
   * @param {Object} file - Multer file object
   * @param {string} type - Upload type (product, detail1, detail2, detail3)
   * @returns {Object} Processing result
   */
  async processUpload(file, type) {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Create unique filename
      const timestamp = Date.now();
      const filename = `${type}_${timestamp}.${this.outputFormat}`;
      const outputPath = path.join(__dirname, '../../uploads', filename);

      // Ensure uploads directory exists
      const uploadsDir = path.dirname(outputPath);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Process and optimize image
      const processedImage = await sharp(file.buffer)
        .resize(1024, 1024, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: this.outputQuality })
        .toFile(outputPath);

      // Analyze image characteristics
      const analysis = await this.analyzeImage(outputPath, type);

      return {
        success: true,
        filename: filename,
        path: outputPath,
        size: processedImage.size,
        dimensions: {
          width: processedImage.width,
          height: processedImage.height
        },
        analysis: analysis,
        type: type
      };

    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Analyze uploaded image to extract characteristics
   * @param {string} imagePath - Path to image file
   * @param {string} type - Image type (product, detail1, detail2, detail3)
   * @returns {Object} Image analysis
   */
  async analyzeImage(imagePath, type) {
    try {
      // Get image metadata
      const metadata = await sharp(imagePath).metadata();
      
      // Extract dominant colors (simplified implementation)
      const stats = await sharp(imagePath)
        .resize(50, 50) // Small size for color analysis
        .raw()
        .toBuffer({ resolveWithObject: true });

      const colors = this.extractDominantColors(stats.data, stats.info);

      // Basic analysis based on type
      let analysis = {
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        format: metadata.format,
        colors: colors,
        type: type
      };

      // Type-specific analysis
      if (type === 'product') {
        analysis = {
          ...analysis,
          ...this.analyzeProductImage(imagePath)
        };
      } else if (type.startsWith('detail')) {
        analysis = {
          ...analysis,
          ...this.analyzeDetailImage(imagePath)
        };
      }

      return analysis;

    } catch (error) {
      console.error('Image analysis failed:', error);
      return {
        type: type,
        error: 'Analysis failed',
        basicInfo: true
      };
    }
  }

  /**
   * Analyze product image characteristics
   * @param {string} imagePath - Path to product image
   * @returns {Object} Product analysis
   */
  analyzeProductImage(imagePath) {
    // Placeholder for product-specific analysis
    // In a full implementation, this could use computer vision APIs
    // to detect garment type, style, fabric texture, etc.
    
    return {
      garmentType: 'detected_from_image', // Would be AI-detected
      style: {
        fit: 'regular',
        sleeve: 'short',
        neckline: 'crew'
      },
      fabric: {
        texture: 'cotton',
        weight: 'medium'
      },
      confidence: 0.8
    };
  }

  /**
   * Analyze detail image (embroidery/printing)
   * @param {string} imagePath - Path to detail image
   * @returns {Object} Detail analysis
   */
  analyzeDetailImage(imagePath) {
    // Placeholder for detail-specific analysis
    // Could detect text, logos, embroidery patterns, etc.
    
    return {
      detailType: 'embroidery', // or 'screen_print', 'heat_transfer'
      hasText: false,
      hasLogo: false,
      complexity: 'medium',
      suggestedPosition: 'chest_left',
      confidence: 0.7
    };
  }

  /**
   * Extract dominant colors from image buffer
   * @param {Buffer} buffer - Raw image buffer
   * @param {Object} info - Image info from sharp
   * @returns {Object} Color information
   */
  extractDominantColors(buffer, info) {
    const { width, height, channels } = info;
    const pixels = buffer.length / channels;
    
    let totalR = 0, totalG = 0, totalB = 0;
    
    // Simple averaging - could be enhanced with clustering algorithms
    for (let i = 0; i < buffer.length; i += channels) {
      totalR += buffer[i];
      totalG += buffer[i + 1];
      totalB += buffer[i + 2];
    }
    
    const pixelCount = pixels;
    const avgR = Math.round(totalR / pixelCount);
    const avgG = Math.round(totalG / pixelCount);
    const avgB = Math.round(totalB / pixelCount);

    return {
      dominant: { r: avgR, g: avgG, b: avgB },
      hex: this.rgbToHex(avgR, avgG, avgB)
    };
  }

  /**
   * Convert RGB to hex color
   * @param {number} r - Red value
   * @param {number} g - Green value
   * @param {number} b - Blue value
   * @returns {string} Hex color code
   */
  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Validate uploaded file
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum ${this.maxFileSize}`);
    }

    // Check file format
    const fileExtension = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!this.supportedFormats.includes(fileExtension)) {
      errors.push(`Format ${fileExtension} not supported. Supported: ${this.supportedFormats.join(', ')}`);
    }

    // Check mimetype
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`MIME type ${file.mimetype} not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up old uploaded files
   * @param {number} maxAgeHours - Maximum age in hours
   */
  async cleanupOldFiles(maxAgeHours = 24) {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const generatedDir = process.env.NODE_ENV === 'production' 
      ? path.join(__dirname, '../../data/generated')  // In production, use /app/data/generated
      : path.join(__dirname, '../../generated');      // In development, use /app/generated
    
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();

    const cleanDirectory = async (dirPath) => {
      if (!fs.existsSync(dirPath)) return;
      
      const files = fs.readdirSync(dirPath);
      let cleaned = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }
      
      return cleaned;
    };

    const uploadsCleaned = await cleanDirectory(uploadsDir);
    const generatedCleaned = await cleanDirectory(generatedDir);

    return {
      uploadsCleaned,
      generatedCleaned,
      totalCleaned: uploadsCleaned + generatedCleaned
    };
  }

  /**
   * Get image information
   * @param {string} imagePath - Path to image
   * @returns {Object} Image information
   */
  async getImageInfo(imagePath) {
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file not found');
    }

    const metadata = await sharp(imagePath).metadata();
    const stats = fs.statSync(imagePath);

    return {
      path: imagePath,
      size: stats.size,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      },
      format: metadata.format,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
}

module.exports = ImageProcessor;