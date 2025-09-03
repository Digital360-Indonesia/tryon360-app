const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class EnhancedProductAnalysisService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not found. Enhanced product analysis unavailable.');
    } else {
      console.log('✅ Enhanced Product Analysis Service initialized');
    }
  }

  async analyzeProduct(imagePath) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured'
      };
    }

    try {
      console.log('🔍 Starting enhanced product analysis:', imagePath);
      
      // Run multiple analysis passes in parallel
      const [
        structuredAnalysis,
        brandingAnalysis,
        colorAnalysis,
        qualityAnalysis
      ] = await Promise.all([
        this.getStructuredAnalysis(imagePath),
        this.detectBranding(imagePath),
        this.extractColorProfile(imagePath),
        this.assessImageQuality(imagePath)
      ]);

      // Calculate overall confidence score
      const confidence = this.calculateConfidence({
        structured: structuredAnalysis,
        branding: brandingAnalysis,
        color: colorAnalysis,
        quality: qualityAnalysis
      });

      console.log('✅ Enhanced product analysis completed with confidence:', confidence);

      return {
        success: true,
        analysis: structuredAnalysis.analysis,
        structured: structuredAnalysis.structured,
        branding: brandingAnalysis,
        colors: colorAnalysis,
        quality: qualityAnalysis,
        confidence: confidence,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in enhanced product analysis:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getStructuredAnalysis(imagePath) {
    try {
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
                  text: `ENHANCED PRODUCT ANALYSIS: Analyze this garment with extreme precision for AI generation. Provide details in this EXACT format:

GARMENT_TYPE: [specific type like "crew neck t-shirt", "polo shirt", "zip-up hoodie"]
PRIMARY_COLOR: [exact color like "bright orange", "navy blue #1e3a8a", "forest green"]
SECONDARY_COLORS: [accent colors with positions like "white collar trim", "gray sleeve cuffs"]
MATERIAL: [specific material like "100% cotton", "cotton-polyester blend", "fleece"]
PATTERN: [detailed pattern like "solid", "horizontal stripes", "geometric print"]
STYLE: [specific style like "casual streetwear", "business casual", "athletic performance"]
FIT: [exact fit like "slim fit", "regular fit", "oversized relaxed"]
SLEEVE_TYPE: [precise sleeve like "short sleeve", "long sleeve", "3/4 sleeve", "sleeveless"]
COLLAR: [exact collar like "crew neck", "v-neck", "polo collar", "hoodie with drawstring"]
CLOSURE: [closure type like "pullover", "button-up front", "zip-up", "snap buttons"]
POCKETS: [detailed pocket info like "no pockets", "chest pocket left side", "kangaroo pocket front"]
LOGOS_TEXT: [exact text/logos like "NIKE swoosh left chest black", "Supreme box logo center chest red"]
SPECIAL_FEATURES: [unique features like "reflective strips on sleeves", "embroidered logo", "screen printed design"]
CONSTRUCTION: [construction details like "flat seams", "ribbed cuffs", "reinforced shoulders"]
BRAND_INDICATORS: [visible brand elements like "Nike swoosh", "Adidas stripes", "Champion logo"]
TEXTURE: [surface texture like "smooth cotton", "brushed fleece", "ribbed knit"]
CONDITION: [garment condition like "new", "worn", "vintage"]

Be extremely specific with colors, positions, and details for perfect AI reproduction.`
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
          max_tokens: 1000,
          temperature: 0.1 // Low temperature for consistent, precise analysis
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
        const structured = this.parseEnhancedAnalysis(analysis);
        
        return {
          analysis: analysis,
          structured: structured,
          confidence: this.calculateStructuredConfidence(structured)
        };
      } else {
        throw new Error('No structured analysis returned from vision API');
      }
    } catch (error) {
      console.error('❌ Error in structured analysis:', error.message);
      return {
        analysis: '',
        structured: {},
        confidence: 0
      };
    }
  }

  async detectBranding(imagePath) {
    try {
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
                  text: `BRANDING DETECTION: Focus ONLY on logos, text, and branding elements. Provide details in this format:

BRAND_NAME: [detected brand like "Nike", "Adidas", "Supreme", "Custom", "Unknown"]
LOGO_TYPE: [type like "embroidered", "screen printed", "heat transfer", "woven label"]
LOGO_POSITION: [exact position like "left chest", "center chest", "right sleeve", "back center"]
LOGO_SIZE: [size like "small (2cm)", "medium (5cm)", "large (10cm)"]
LOGO_COLORS: [logo colors like "black on white", "white on red", "multicolor"]
TEXT_CONTENT: [exact text visible like "NIKE", "Just Do It", "Supreme"]
TEXT_STYLE: [text style like "bold sans-serif", "script font", "block letters"]
ADDITIONAL_BRANDING: [other brand elements like "care labels", "size tags", "brand patches"]
LOGO_QUALITY: [quality like "crisp", "faded", "distressed", "high-definition"]
EMBELLISHMENT_TYPE: [type like "embroidery", "screen print", "vinyl", "patch", "applique"]

Focus on details that will help reproduce the branding accurately.`
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
          max_tokens: 600,
          temperature: 0.1
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
        const brandingAnalysis = response.data.choices[0].message.content;
        const brandingData = this.parseBrandingAnalysis(brandingAnalysis);
        
        return {
          analysis: brandingAnalysis,
          structured: brandingData,
          confidence: this.calculateBrandingConfidence(brandingData)
        };
      } else {
        return {
          analysis: 'No branding detected',
          structured: {},
          confidence: 0.5
        };
      }
    } catch (error) {
      console.error('❌ Error in branding detection:', error.message);
      return {
        analysis: 'Branding analysis failed',
        structured: {},
        confidence: 0
      };
    }
  }

  async extractColorProfile(imagePath) {
    try {
      // Use Sharp to extract dominant colors
      const image = sharp(imagePath);
      const { data, info } = await image
        .resize(100, 100) // Resize for faster processing
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Extract dominant colors using simple color clustering
      const colors = this.extractDominantColors(data, info);
      
      // Also get GPT-4o color analysis for validation
      const gptColorAnalysis = await this.getGPTColorAnalysis(imagePath);
      
      return {
        dominantColors: colors,
        gptAnalysis: gptColorAnalysis,
        confidence: colors.length > 0 ? 0.8 : 0.3
      };
    } catch (error) {
      console.error('❌ Error in color extraction:', error.message);
      return {
        dominantColors: [],
        gptAnalysis: '',
        confidence: 0
      };
    }
  }

  async getGPTColorAnalysis(imagePath) {
    try {
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
                  text: `COLOR ANALYSIS: Identify ALL colors in this garment with precision:

PRIMARY_COLOR: [main garment color with hex code if possible]
SECONDARY_COLORS: [accent colors with their locations]
TRIM_COLORS: [collar, cuff, hem colors]
LOGO_COLORS: [colors used in logos/text]
THREAD_COLORS: [stitching thread colors]
BUTTON_COLORS: [button/zipper colors if visible]
COLOR_DISTRIBUTION: [percentage breakdown like "80% navy blue, 15% white, 5% red"]
COLOR_FINISH: [matte, glossy, metallic, etc.]

Provide specific color names and hex codes when possible.`
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
          max_tokens: 400,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data?.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('❌ Error in GPT color analysis:', error.message);
      return '';
    }
  }

  async assessImageQuality(imagePath) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // Basic quality metrics
      const quality = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
        size: fs.statSync(imagePath).size
      };

      // Calculate quality score
      let qualityScore = 0.5; // Base score
      
      // Resolution scoring
      if (quality.width >= 1024 && quality.height >= 1024) qualityScore += 0.3;
      else if (quality.width >= 512 && quality.height >= 512) qualityScore += 0.2;
      else if (quality.width >= 256 && quality.height >= 256) qualityScore += 0.1;
      
      // Format scoring
      if (['jpeg', 'jpg', 'png'].includes(quality.format?.toLowerCase())) qualityScore += 0.1;
      
      // Size scoring (not too small, not too large)
      if (quality.size > 50000 && quality.size < 10000000) qualityScore += 0.1;
      
      return {
        ...quality,
        qualityScore: Math.min(qualityScore, 1.0),
        recommendations: this.getQualityRecommendations(quality)
      };
    } catch (error) {
      console.error('❌ Error in quality assessment:', error.message);
      return {
        qualityScore: 0.3,
        recommendations: ['Image quality assessment failed']
      };
    }
  }

  extractDominantColors(data, info) {
    try {
      const colors = [];
      const colorCounts = {};
      
      // Sample every 4th pixel for performance
      for (let i = 0; i < data.length; i += 12) { // 3 channels * 4 pixels
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Skip very dark or very light pixels (likely shadows/highlights)
        const brightness = (r + g + b) / 3;
        if (brightness < 30 || brightness > 225) continue;
        
        // Quantize colors to reduce noise
        const quantR = Math.floor(r / 32) * 32;
        const quantG = Math.floor(g / 32) * 32;
        const quantB = Math.floor(b / 32) * 32;
        
        const colorKey = `${quantR},${quantG},${quantB}`;
        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
      }
      
      // Get top 5 colors
      const sortedColors = Object.entries(colorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([color, count]) => {
          const [r, g, b] = color.split(',').map(Number);
          return {
            rgb: { r, g, b },
            hex: this.rgbToHex(r, g, b),
            count: count,
            name: this.getColorName(r, g, b)
          };
        });
      
      return sortedColors;
    } catch (error) {
      console.error('❌ Error extracting dominant colors:', error.message);
      return [];
    }
  }

  parseEnhancedAnalysis(analysis) {
    try {
      const lines = analysis.split('\n');
      const data = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':').map(s => s.trim());
          if (value && value !== '[' && !value.includes('[')) {
            // Clean up the key
            const cleanKey = key.toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '');
            data[cleanKey] = value;
          }
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error parsing enhanced analysis:', error.message);
      return {};
    }
  }

  parseBrandingAnalysis(analysis) {
    try {
      const lines = analysis.split('\n');
      const data = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':').map(s => s.trim());
          if (value && value !== '[' && !value.includes('[')) {
            const cleanKey = key.toLowerCase()
              .replace(/\s+/g, '_')
              .replace(/[^a-z0-9_]/g, '');
            data[cleanKey] = value;
          }
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error parsing branding analysis:', error.message);
      return {};
    }
  }

  calculateConfidence(analysisResults) {
    try {
      const weights = {
        structured: 0.4,
        branding: 0.2,
        color: 0.2,
        quality: 0.2
      };
      
      let totalScore = 0;
      let totalWeight = 0;
      
      Object.entries(weights).forEach(([key, weight]) => {
        if (analysisResults[key] && analysisResults[key].confidence !== undefined) {
          totalScore += analysisResults[key].confidence * weight;
          totalWeight += weight;
        }
      });
      
      return totalWeight > 0 ? totalScore / totalWeight : 0.5;
    } catch (error) {
      console.error('Error calculating confidence:', error.message);
      return 0.5;
    }
  }

  calculateStructuredConfidence(structured) {
    const requiredFields = [
      'garment_type', 'primary_color', 'material', 
      'style', 'fit', 'sleeve_type', 'collar'
    ];
    
    const filledFields = requiredFields.filter(field => 
      structured[field] && structured[field].length > 0
    );
    
    return filledFields.length / requiredFields.length;
  }

  calculateBrandingConfidence(branding) {
    let confidence = 0.5; // Base confidence
    
    if (branding.brand_name && branding.brand_name !== 'Unknown') confidence += 0.2;
    if (branding.logo_type) confidence += 0.1;
    if (branding.logo_position) confidence += 0.1;
    if (branding.text_content) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  getQualityRecommendations(quality) {
    const recommendations = [];
    
    if (quality.width < 512 || quality.height < 512) {
      recommendations.push('Image resolution is low. Higher resolution (1024x1024+) recommended for better results.');
    }
    
    if (quality.size < 50000) {
      recommendations.push('Image file size is very small. This may indicate low quality or heavy compression.');
    }
    
    if (quality.size > 10000000) {
      recommendations.push('Image file size is very large. Consider optimizing for faster processing.');
    }
    
    if (!['jpeg', 'jpg', 'png'].includes(quality.format?.toLowerCase())) {
      recommendations.push('Consider using JPEG or PNG format for better compatibility.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Image quality looks good for AI generation.');
    }
    
    return recommendations;
  }

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  getColorName(r, g, b) {
    // Simple color name mapping - could be enhanced with a proper color name library
    const colors = [
      { name: 'Red', rgb: [255, 0, 0] },
      { name: 'Green', rgb: [0, 255, 0] },
      { name: 'Blue', rgb: [0, 0, 255] },
      { name: 'Yellow', rgb: [255, 255, 0] },
      { name: 'Orange', rgb: [255, 165, 0] },
      { name: 'Purple', rgb: [128, 0, 128] },
      { name: 'Pink', rgb: [255, 192, 203] },
      { name: 'Brown', rgb: [165, 42, 42] },
      { name: 'Black', rgb: [0, 0, 0] },
      { name: 'White', rgb: [255, 255, 255] },
      { name: 'Gray', rgb: [128, 128, 128] },
      { name: 'Navy', rgb: [0, 0, 128] }
    ];
    
    let closestColor = 'Unknown';
    let minDistance = Infinity;
    
    colors.forEach(color => {
      const distance = Math.sqrt(
        Math.pow(r - color.rgb[0], 2) +
        Math.pow(g - color.rgb[1], 2) +
        Math.pow(b - color.rgb[2], 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color.name;
      }
    });
    
    return closestColor;
  }
}

module.exports = EnhancedProductAnalysisService;