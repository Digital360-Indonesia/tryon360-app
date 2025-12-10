const AI_PROVIDERS = {
  flux_kontext: {
    id: 'flux_kontext',
    name: 'Flux Kontext',
    description: 'High-quality try-on generation',
    status: 'active',
    endpoint: 'https://api.bfl.ai/v1/flux-kontext-pro',
    supportsImageInput: true,
    maxImageSize: 10485760, // 10MB
    supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    generationSettings: {
      model: 'flux-kontext-1.0',
      quality: 'hd',
      style: 'photography',
      aspect_ratio: '4:5' // Portrait for try-on
    },
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 100
    }
  },

  chatgpt_image: {
    id: 'chatgpt_image',
    name: 'ChatGPT Image Generation',
    description: 'OpenAI DALL-E powered generation',
    status: 'active',
    endpoint: 'https://api.openai.com/v1/images/generations',
    supportsImageInput: true,
    generationSettings: {
      model: 'dall-e-3',
      quality: 'hd',
      size: '1024x1024',
      style: 'natural'
    },
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerHour: 50
    }
  },

  gemini_flash: {
    id: 'gemini_flash',
    name: 'Gemini Flash 2.5',
    description: 'Google Gemini image generation',
    status: 'coming_soon',
    endpoint: 'https://api.gemini.google.com/v1/generate',
    supportsImageInput: true,
    maxImageSize: 20971520, // 20MB
    supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    generationSettings: {
      model: 'gemini-flash-2.5',
      quality: 'high',
      safety_settings: 'standard'
    },
    rateLimit: {
      requestsPerMinute: 15,
      requestsPerHour: 200
    }
  },

  gemini_2_5_flash_image: {
    id: 'gemini_2_5_flash_image',
    name: 'Gemini 2.5 Flash Image',
    description: 'Google Gemini 2.5 Flash for image generation',
    status: 'active',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    supportsImageInput: true,
    maxImageSize: 10485760, // 10MB
    supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    generationSettings: {
      model: 'gemini-2.5-flash-image',
      outputTokens: 1290,
      maxOutputResolution: '1024x1024'
    },
    rateLimit: {
      requestsPerMinute: 15,
      requestsPerHour: 200
    },
    pricing: {
      costPerImage: 0.039 // $0.039 per image (1K-2K)
    }
  },

  nano_banana: {
    id: 'nano_banana',
    name: 'Nano Banana Gemini 3 Pro',
    description: 'Google Gemini 3 Pro Preview for image generation',
    status: 'active',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
    supportsImageInput: true,
    maxImageSize: 10485760, // 10MB
    supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    generationSettings: {
      model: 'gemini-3-pro-image-preview',
      outputTokens: 1290, // Each image is 1290 tokens
      maxOutputResolution: '1024x1024'
    },
    rateLimit: {
      requestsPerMinute: 20,
      requestsPerHour: 500
    },
    pricing: {
      costPer1MTokens: 30.00,
      costPerImage: 0.039 // $30 per 1M tokens, 1290 tokens per image
    }
  },

  imagen_4_ultra: {
    id: 'imagen_4_ultra',
    name: 'Imagen 4.0 Ultra',
    description: 'Google Imagen 4.0 Ultra for high-quality image generation',
    status: 'active',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:generateContent',
    supportsImageInput: false,
    maxImageSize: 10485760, // 10MB
    supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
    generationSettings: {
      model: 'imagen-4.0-ultra-generate-001',
      outputTokens: 1290,
      maxOutputResolution: '2048x2048'
    },
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerHour: 100
    },
    pricing: {
      costPerImage: 0.06 // $0.06 per image
    }
  }
};

const GENERATION_SETTINGS = {
  flux_kontext: {
    timeout: 420000, // 7 minutes - handle API instability
    retries: 3, // More retries due to API instability
    parameters: {
      guidance_scale: 6.0,
      num_inference_steps: 30,
      strength: 0.7
    }
  },
  
  chatgpt_image: {
    timeout: 45000, // 45 seconds  
    retries: 3,
    parameters: {
      response_format: 'url',
      quality: 'hd'
    }
  },

  gemini_flash: {
    timeout: 30000, // 30 seconds
    retries: 2,
    parameters: {
      temperature: 0.3,
      candidate_count: 1
    }
  },

  gemini_2_5_flash_image: {
    timeout: 60000, // 60 seconds
    retries: 3,
    parameters: {
      temperature: 0.7,
      candidate_count: 1,
      safety_settings: [{
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH'
      }]
    }
  },

  nano_banana: {
    timeout: 60000, // 60 seconds
    retries: 3,
    parameters: {
      temperature: 0.7,
      candidate_count: 1,
      safety_settings: [{
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH'
      }]
    }
  },

  imagen_4_ultra: {
    timeout: 120000, // 120 seconds - longer for ultra generation
    retries: 2,
    parameters: {
      temperature: 0.8,
      candidate_count: 1,
      aspect_ratio: '1:1'
    }
  }
};

const DEFAULT_GENERATION_CONFIG = {
  defaultProvider: 'flux_kontext',
  fallbackProvider: 'chatgpt_image', 
  maxConcurrentGenerations: 3,
  imageOptimization: {
    outputFormat: 'jpeg',
    quality: 85,
    maxWidth: 1024,
    maxHeight: 1280
  }
};

module.exports = {
  AI_PROVIDERS,
  GENERATION_SETTINGS,
  DEFAULT_GENERATION_CONFIG
};