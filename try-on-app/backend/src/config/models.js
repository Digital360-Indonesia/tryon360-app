const PROFESSIONAL_MODELS = {
  gunawan: {
    id: 'gunawan',
    name: 'Gunawan',
    type: 'male',
    isPrimary: true,
    avatar: '/models/gunawan-reference.jpg',
    description: 'Professional Indonesian male model',
    detailedDescription: 'Indonesian male model with warm medium skin tone, black hair styled back with natural texture, almond-shaped dark brown eyes, well-defined thick eyebrows, straight nose with slightly rounded tip, light facial hair including mustache and beard stubble with moderate density, defined jawline, natural lip color, subtle smile lines, professional studio lighting creating natural skin luminosity.',
    
    // Detailed facial characteristics for consistent generation
    physicalDescription: {
      face: 'square jaw with defined cheekbones and strong masculine features',
      eyes: 'dark brown eyes with thick well-groomed eyebrows',
      eyebrows: 'thick dark brown eyebrows with natural shape',
      nose: 'straight masculine nose with defined bridge',
      lips: 'medium masculine lips',
      skin: 'medium Indonesian skin tone with clear complexion',
      hair: 'short neat black hair, well-groomed style',
      facial_hair: 'clean-shaven with smooth skin',
      expression: 'professional confident expression with friendly demeanor'
    },
    
    bodyCharacteristics: {
      height: '5 feet 10 inches',
      build: 'medium athletic build with broad shoulders',
      shoulders: 'broad athletic shoulders',
      arms: 'toned muscular arms',
      chest: 'well-defined chest',
      style: 'confident professional posture'
    },
    
    // Pre-written prompt template
    basePrompt: `A professional Indonesian man with square jaw, defined cheekbones, dark brown eyes, thick eyebrows, short neat black hair, medium Indonesian skin tone, clean-shaven, professional confident expression, medium athletic build with broad shoulders, 5'10" height, wearing {garment_description}. Professional studio photography, clean white background, soft even lighting, high resolution, commercial quality image.`,
    
    // Available poses for this model
    availablePoses: [
      'professional_standing',
      'arms_crossed',
      'hands_on_hips',
      'one_hand_on_hip'
    ]
  },

  paul: {
    id: 'paul',
    name: 'Paul', 
    type: 'male',
    isPrimary: false,
    avatar: '/models/paul-reference.jpg',
    description: 'Indonesian male model',
    detailedDescription: 'Indonesian West male model with medium-warm skin tone, dark brown hair styled back with volume, hazel-brown eyes with depth, thick well-defined eyebrows, straight nose with strong bridge, full beard and mustache with dense coverage in natural brown color, strong defined jawline, natural lip tone, confident expression, mature masculine features, professional studio lighting with even illumination.',
    
    physicalDescription: {
      face: 'square jaw with defined cheekbones and strong masculine features',
      eyes: 'dark brown eyes with thick well-groomed eyebrows',
      eyebrows: 'thick dark brown eyebrows with natural shape',
      nose: 'straight masculine nose with defined bridge',
      lips: 'medium masculine lips',
      skin: 'medium Indonesian skin tone with clear complexion',
      hair: 'short neat black hair, side-parted and well-groomed',
      facial_hair: 'clean-shaven with smooth skin',
      expression: 'approachable professional smile with confident demeanor'
    },
    
    bodyCharacteristics: {
      height: '5 feet 10 inches',
      build: 'medium athletic build with broad shoulders',
      shoulders: 'broad athletic shoulders',
      arms: 'toned muscular arms',
      chest: 'well-defined chest',
      style: 'confident professional posture'
    },
    
    basePrompt: `A professional Indonesian man with square jaw, defined cheekbones, dark brown eyes, thick eyebrows, short neat black side-parted hair, medium Indonesian skin tone, clean-shaven, approachable professional smile, medium athletic build with broad shoulders, 5'10" height, wearing {garment_description}. Professional studio photography, clean white background, soft even lighting, high resolution, commercial quality image.`,
    
    availablePoses: [
      'professional_standing',
      'arms_crossed', 
      'hands_in_pockets',
      'arms_at_sides'
    ]
  },

  rachma: {
    id: 'rachma',
    name: 'Rachma',
    type: 'female', 
    isPrimary: true,
    avatar: '/models/rachma-reference.jpg',
    description: 'Professional Indonesian female model',
    detailedDescription: 'Indonesian female model wearing hijab, warm light skin tone with natural glow, almond-shaped dark brown eyes with defined lashes, well-groomed arched eyebrows, straight nose with delicate bridge, natural pink lip color with subtle shine, gentle smile showing warmth, smooth complexion, hijab draped naturally around face covering hair completely, professional studio lighting creating luminous skin finish.',
    
    physicalDescription: {
      face: 'oval face shape with high cheekbones and defined features',
      eyes: 'medium brown almond-shaped eyes with long natural eyelashes',
      eyebrows: 'well-groomed dark brown eyebrows with natural arch',
      nose: 'straight refined nose with narrow bridge',
      lips: 'natural medium lips with subtle curve',
      skin: 'light-medium Indonesian skin tone with smooth complexion',
      hair: 'straight black hair, shoulder-length, well-styled',
      expression: 'professional confident expression with warm smile'
    },
    
    bodyCharacteristics: {
      height: '5 feet 6 inches',
      build: 'slim athletic build with good posture',
      shoulders: 'proportional shoulders',
      arms: 'toned arms',
      style: 'elegant professional demeanor'
    },
    
    basePrompt: `A professional Indonesian woman with oval face shape, high cheekbones, medium brown almond-shaped eyes, straight black shoulder-length hair, light-medium Indonesian skin tone, professional confident expression with warm smile, slim athletic build, 5'6" height, wearing {garment_description}. Professional studio photography, clean white background, soft even lighting, high resolution, commercial quality image.`,
    
    availablePoses: [
      'professional_standing',
      'hands_clasped',
      'one_hand_on_hip',
      'casual_standing'
    ]
  },

  johny: {
    id: 'johny',
    name: 'Johny',
    type: 'male',
    isPrimary: false, 
    avatar: '/models/johny-reference.jpg',
    description: 'Indonesian male model',
    detailedDescription: 'Indonesian male model with warm light-medium skin tone, black hair styled back and slightly textured, almond-shaped dark brown eyes with gentle expression, naturally shaped eyebrows, straight nose with refined bridge, light facial hair including thin mustache and sparse beard stubble, softer jawline than Model 1, natural pink lip tone, friendly subtle smile, smooth skin texture with professional studio lighting.',
    
    physicalDescription: {
      face: 'angular face with strong jawline and defined features',
      eyes: 'deep brown eyes with intense gaze',
      eyebrows: 'thick dark eyebrows with strong arch',
      nose: 'straight defined nose',
      lips: 'medium masculine lips',
      skin: 'medium-dark Indonesian skin tone with healthy appearance',
      hair: 'medium black hair with textured style and natural volume',
      facial_hair: 'clean-shaven with smooth jawline',
      expression: 'serious confident expression with subtle intensity'
    },
    
    bodyCharacteristics: {
      height: '5 feet 9 inches',
      build: 'lean athletic build with defined muscles',
      shoulders: 'athletic shoulders',
      arms: 'toned defined arms',
      style: 'modern confident posture'
    },
    
    basePrompt: `A young Indonesian man with angular face, strong jawline, deep brown eyes, thick eyebrows, medium textured black hair, medium-dark Indonesian skin tone, clean-shaven, serious confident expression, lean athletic build, 5'9" height, wearing {garment_description}. Professional studio photography, clean white background, soft even lighting, high resolution, commercial quality image.`,
    
    availablePoses: [
      'professional_standing',
      'arms_crossed',
      'hands_in_pockets', 
      'casual_confident'
    ]
  }
};

const POSES = {
  professional_standing: {
    name: 'Professional Standing',
    description: 'Straight posture, arms at sides, facing camera',
    prompt: 'standing straight with arms naturally at sides, facing camera directly, professional pose'
  },
  arms_crossed: {
    name: 'Arms Crossed',
    description: 'Confident pose with arms crossed over chest',
    prompt: 'arms crossed over chest, confident stance, looking directly at camera'
  },
  hands_on_hips: {
    name: 'Hands on Hips',
    description: 'Strong confident pose with hands on hips',
    prompt: 'hands placed on hips, confident strong pose, shoulders back'
  },
  hands_in_pockets: {
    name: 'Hands in Pockets', 
    description: 'Casual confident pose with hands in pockets',
    prompt: 'hands casually placed in pockets, relaxed confident stance'
  },
  one_hand_on_hip: {
    name: 'One Hand on Hip',
    description: 'Asymmetric pose with one hand on hip',
    prompt: 'one hand placed on hip, other arm naturally at side, slight angle'
  },
  hands_clasped: {
    name: 'Hands Clasped',
    description: 'Formal pose with hands clasped in front',
    prompt: 'hands clasped together in front, formal professional stance'
  },
  arms_at_sides: {
    name: 'Arms at Sides',
    description: 'Natural relaxed pose with arms at sides',
    prompt: 'arms naturally relaxed at sides, comfortable professional stance'
  },
  casual_standing: {
    name: 'Casual Standing',
    description: 'Relaxed casual pose',
    prompt: 'casual relaxed standing pose, natural comfortable stance'
  },
  casual_confident: {
    name: 'Casual Confident',
    description: 'Modern confident casual pose',
    prompt: 'casual confident pose with modern stance, relaxed but assured'
  }
};

const GARMENT_TYPES = {
  tshirt: {
    name: 'T-Shirt',
    description: 'Regular crew neck t-shirt',
    embroideryAreas: ['chest_left', 'chest_center', 'back_center']
  },
  polo: {
    name: 'Polo Shirt', 
    description: 'Collared polo shirt',
    embroideryAreas: ['chest_left', 'chest_right', 'back_center']
  },
  hoodie: {
    name: 'Hoodie',
    description: 'Pullover hoodie with front pocket',
    embroideryAreas: ['chest_center', 'back_center', 'sleeve']
  },
  jacket: {
    name: 'Jacket',
    description: 'Casual jacket or outerwear',
    embroideryAreas: ['chest_left', 'back_center', 'sleeve']
  },
  uniform: {
    name: 'Uniform Shirt',
    description: 'Professional uniform shirt',
    embroideryAreas: ['chest_left', 'chest_right', 'back_center', 'sleeve']
  }
};

module.exports = {
  PROFESSIONAL_MODELS,
  POSES,
  GARMENT_TYPES
};