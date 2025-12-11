const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageComposer {
  constructor() {
    // Target dimensions for 9:16 aspect ratio
    this.targetWidth = 752;
    this.targetHeight = 1392;
    
    // Section heights (proportional distribution)
    this.faceHeight = Math.floor(this.targetHeight * 0.25);    // 25% for face (~348px)
    this.productHeight = Math.floor(this.targetHeight * 0.50); // 50% for product (~696px)
    this.detailHeight = Math.floor(this.targetHeight * 0.25);  // 25% for detail (~348px)
  }

  /**
   * Combine three images vertically into a single 9:16 composite
   * @param {Buffer|String} faceImage - Face reference image
   * @param {Buffer|String} productImage - Product overview image
   * @param {Buffer|String} detailImage - Product detail/embroidery image
   * @returns {Promise<Buffer>} Combined image buffer
   */
  async combineImages(faceImage, productImage, detailImage) {
    try {
      // Process face image (top section) - CONTAIN to show full face without cropping
      const faceBuffer = await sharp(faceImage)
        .resize(this.targetWidth, this.faceHeight, {
          fit: 'contain',  // Changed from 'cover' to 'contain' - no cropping!
          background: { r: 255, g: 255, b: 255, alpha: 1 }  // White background
        })
        .toBuffer();
      
      // Process product image (middle section)
      const productBuffer = await sharp(productImage)
        .resize(this.targetWidth, this.productHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toBuffer();
      
      // Process detail image (bottom section) - optional
      let detailBuffer = null;
      if (detailImage) {
        detailBuffer = await sharp(detailImage)
          .resize(this.targetWidth, this.detailHeight, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toBuffer();
      } else {
        // Create white placeholder if no detail image
        detailBuffer = await sharp({
          create: {
            width: this.targetWidth,
            height: this.detailHeight,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        })
        .jpeg()
        .toBuffer();
      }
      
      // Combine all three sections vertically
      const composite = await sharp({
        create: {
          width: this.targetWidth,
          height: this.targetHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .composite([
        { input: faceBuffer, top: 0, left: 0 },
        { input: productBuffer, top: this.faceHeight, left: 0 },
        { input: detailBuffer, top: this.faceHeight + this.productHeight, left: 0 }
      ])
      .jpeg({ quality: 95 })
      .toBuffer();
      
      return composite;
      
    } catch (error) {
      throw new Error(`Failed to compose images: ${error.message}`);
    }
  }

  /**
   * Create composite from file paths
   * @param {String} facePath - Path to face image
   * @param {String} productPath - Path to product image
   * @param {String} detailPath - Path to detail image (optional)
   * @returns {Promise<Buffer>} Combined image buffer
   */
  async combineFromPaths(facePath, productPath, detailPath = null) {
    // Validate file existence
    if (!fs.existsSync(facePath)) {
      throw new Error(`Face image not found: ${facePath}`);
    }
    if (!fs.existsSync(productPath)) {
      throw new Error(`Product image not found: ${productPath}`);
    }
    if (detailPath && !fs.existsSync(detailPath)) {
      throw new Error(`Detail image not found: ${detailPath}`);
    }
    
    return this.combineImages(facePath, productPath, detailPath);
  }

  /**
   * Create composite from buffers (for uploaded files)
   * @param {Buffer} faceBuffer - Face image buffer
   * @param {Buffer} productBuffer - Product image buffer
   * @param {Buffer} detailBuffer - Detail image buffer (optional)
   * @returns {Promise<Buffer>} Combined image buffer
   */
  async combineFromBuffers(faceBuffer, productBuffer, detailBuffer = null) {
    return this.combineImages(faceBuffer, productBuffer, detailBuffer);
  }

  /**
   * Save composite image to file
   * @param {Buffer} compositeBuffer - Combined image buffer
   * @param {String} outputPath - Where to save the image
   * @returns {Promise<String>} Path to saved image
   */
  async saveComposite(compositeBuffer, outputPath) {
    try {
      await sharp(compositeBuffer)
        .toFile(outputPath);

      return outputPath;
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert composite buffer to base64 for API
   * @param {Buffer} compositeBuffer - Combined image buffer
   * @returns {String} Base64 encoded image with data URL prefix
   */
  bufferToBase64(compositeBuffer) {
    const base64 = compositeBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }
}

module.exports = ImageComposer;