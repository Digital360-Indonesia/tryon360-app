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
    supportsImageInput: false,
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
  }
};

const GENERATION_SETTINGS = {
  flux_kontext: {
    timeout: 60000, // 60 seconds
    retries: 2,
    parameters: {
      guidance_scale: 7.5,
      num_inference_steps: 50,
      strength: 0.8
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