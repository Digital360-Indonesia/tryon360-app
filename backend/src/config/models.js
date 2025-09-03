const KUSTOMPEDIA_MODELS = {
  johny: {
    id: 'johny',
    name: 'Johny',
    description: 'Johny - Kustompedia Model 1',
    referenceImage: '/models/johny-1.png',
    referenceImagePath: 'frontend/public/models/johny-1.png',
    basePrompt: 'Change this person\'s clothing to wear',
    characteristics: {
      ethnicity: 'Indonesian',
      gender: 'male',
      age: '25-30',
      hair: 'short dark hair',
      facial_hair: 'clean-shaven',
      build: 'medium athletic',
      expression: 'serious professional'
    },
    poses: [
      'Arms Crossed',
      'Contrapposto', 
      'Clasping Hands',
      'Hands On Chest',
      'Holding One Arm',
      'Hands in Pockets'
    ],
    avatar: '/models/johny-1.png'
  },

  nyoman: {
    id: 'nyoman',
    name: 'Nyoman',
    description: 'Nyoman - Kustompedia Model 2', 
    referenceImage: '/models/nyoman-2.png',
    referenceImagePath: 'frontend/public/models/nyoman-2.png',
    basePrompt: 'Change this person\'s clothing to wear',
    characteristics: {
      ethnicity: 'Indonesian',
      gender: 'male', 
      age: '25-30',
      hair: 'short neat dark hair',
      facial_hair: 'clean-shaven',
      build: 'medium',
      expression: 'friendly approachable smile'
    },
    poses: [
      'Arms Crossed',
      'Contrapposto', 
      'Clasping Hands',
      'Hands On Chest',
      'Holding One Arm',
      'Hands in Pockets'
    ],
    avatar: '/models/nyoman-2.png'
  },

  isabella: {
    id: 'isabella',
    name: 'Isabella',
    description: 'Isabella - Kustompedia Model 3',
    referenceImage: '/models/isabella-3.png',
    referenceImagePath: 'frontend/public/models/isabella-3.png',
    basePrompt: 'Change this person\'s clothing to wear',
    characteristics: {
      ethnicity: 'Indonesian',
      gender: 'female',
      age: '25-30', 
      hair: 'long straight dark hair',
      build: 'slim professional',
      expression: 'serious confident'
    },
    poses: [
      'Arms Crossed',
      'Contrapposto', 
      'Clasping Hands',
      'Hands On Chest',
      'Holding One Arm',
      'Hands in Pockets'
    ],
    avatar: '/models/isabella-3.png'
  }
};

const GARMENT_TYPES = {
  't_shirt': {
    name: 'T-Shirt',
    description: 'Regular crew neck t-shirt',
    logoPositions: ['chest_center', 'chest_left', 'back_center']
  },
  'polo_shirt': {
    name: 'Polo Shirt',
    description: 'Classic polo shirt with collar',
    logoPositions: ['chest_left', 'chest_center', 'back_center']
  },
  'hoodie': {
    name: 'Hoodie',
    description: 'Pullover hoodie with front pocket',
    logoPositions: ['chest_center', 'chest_left', 'back_center', 'sleeve']
  },
  'jacket': {
    name: 'Jacket',
    description: 'Casual jacket or outerwear',
    logoPositions: ['chest_left', 'back_center', 'sleeve']
  },
  'uniform_shirt': {
    name: 'Uniform Shirt',
    description: 'Professional uniform shirt',
    logoPositions: ['chest_left', 'chest_right', 'back_center', 'sleeve']
  }
};

const QUALITY_SETTINGS = {
  standard: {
    name: 'Standard Quality',
    size: '1024x1024',
    cost: 0.020,
    description: 'Standard quality for social media and web use'
  },
  hd: {
    name: 'HD Quality',
    size: '1024x1024', 
    cost: 0.040,
    description: 'High definition quality for marketing materials'
  }
};

module.exports = {
  KUSTOMPEDIA_MODELS,
  GARMENT_TYPES,
  QUALITY_SETTINGS
};
