# 🎯 TryOn360 Platform - Master Documentation
*Last Updated: September 10, 2025*

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Architecture](#core-architecture)
3. [Key Components](#key-components)
4. [AI Integration](#ai-integration)
5. [Deployment](#deployment)
6. [Critical Workflows](#critical-workflows)
7. [Documentation Index](#documentation-index)

---

## 🎨 Project Overview

**TryOn360** is a professional AI-powered virtual try-on platform that generates realistic fashion images using multiple AI providers (FLUX Kontext Pro, OpenAI DALL-E 3, and Nano Banana Gemini 2.5 Flash Image).

### Key Features
- **4 Professional Models**: Gunawan, Paul, Rachma, Johny (Indonesian models with real photos)
- **Multiple AI Providers**: FLUX Kontext Pro (primary), OpenAI DALL-E 3, Nano Banana (Gemini 2.5 Flash Image)
- **Composite Image Generation**: Model face (25%) + Product (50%) + Detail (25%) at 752x1392px (9:16)
- **Real-time Processing**: Socket.io for live generation updates
- **Cloud Deployment**: Fly.io (backend) + Netlify (frontend)

---

## 🏗️ Core Architecture

```
kustompedia-tryon-platform/
├── backend/                 # Node.js Express API
│   ├── server.js           # Main server (port 5005)
│   ├── src/
│   │   ├── config/         # AI providers, models configuration
│   │   ├── controllers/    # API endpoints
│   │   ├── services/       # AI service, image processing
│   │   └── utils/         # Helpers, validators
│   ├── uploads/           # Temporary file storage
│   └── generated/         # AI-generated images
│
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # TryOnStudio main page
│   │   ├── services/     # API client
│   │   └── config/       # Model definitions
│   └── public/
│       └── models/       # Model reference images
│
├── documentation/         # All project documentation
└── nginx/                # Production config
```

---

## 🔑 Key Components

### Backend Services

#### 1. **AI Service** (`backend/src/services/aiService.js`)
- Handles all AI provider integrations
- FLUX Kontext Pro primary implementation
- Deterministic seed generation for consistency
- Session management for API load balancing

#### 2. **Image Processor** (`backend/src/services/imageProcessor.js`)
- Creates composite images (model + product + detail)
- Maintains 9:16 aspect ratio (752x1392px)
- Exact proportions: 25% face, 50% product, 25% detail

#### 3. **Model Configuration** (`backend/src/config/models.js`)
- 4 Indonesian models with detailed descriptions
- 6-9 poses per model
- Text-based detailed prompts for accuracy

### Frontend Components

#### 1. **TryOnStudio** (`frontend/src/pages/TryOnStudio.js`)
- Main application interface
- Model and pose selection
- Real-time generation preview

#### 2. **Generation Panel** (`frontend/src/components/GenerationPanel.js`)
- Product image upload
- AI provider selection
- Generation controls

---

## 🤖 AI Integration

### FLUX Kontext Pro (Primary)
```javascript
// Critical Working Configuration
{
  endpoint: 'https://api.bfl.ai/v1/flux-kontext-pro',
  headers: { 'x-key': process.env.FLUX_API_KEY },
  parameters: {
    aspect_ratio: '9:16',
    safety_tolerance: 6,
    output_format: 'jpeg',
    seed: deterministicSeed // Based on image+prompt hash
  }
}
```

### Key Fixes Implemented
1. **Deterministic Seed**: Hash-based seed from image+prompt content
2. **Session Consistency**: Headers to reduce server-switching
3. **Base64 Format**: Raw base64 without data URL prefix
4. **Missing Parameters**: Added guidance_scale, num_inference_steps, strength

### OpenAI DALL-E 3
- Fallback provider for high-quality generation
- Uses detailed text prompts
- 1024x1024 resolution support

### Nano Banana (Gemini 2.5 Flash Image Preview)
```javascript
// Gemini Integration
{
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent',
  headers: { 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` },
  parameters: {
    model: 'gemini-2.5-flash-image-preview',
    outputTokens: 1290, // Each image costs 1290 tokens
    temperature: 0.7,
    safety_settings: 'BLOCK_ONLY_HIGH'
  }
}
```
- **Active Status**: Fully working with composite image generation
- **Cost**: $0.039 per image ($30 per 1M tokens, 1290 tokens per image)
- **Features**: Supports image input, creates composite images like FLUX
- **Resolution**: Up to 1024x1024px

---

## 🚀 Deployment

### Production Environment
- **Backend**: Fly.io (https://tryon-app-backend.fly.dev)
  - Global edge locations
  - Auto-scaling
  - GitHub Actions auto-deployment
  
- **Frontend**: Netlify (auto-deployed from GitHub)
  - CDN distribution
  - Automatic HTTPS
  - Environment variable management

### Local Development
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev  # Runs both backend (5005) and frontend (3000)

# Deploy to production
cd backend && flyctl deploy  # Backend
# Frontend auto-deploys via Netlify
```

---

## ⚙️ Critical Workflows

### 1. Composite Image Generation Workflow
```
1. User selects: Model → Pose → Product Image
2. System creates composite (752x1392px):
   - Top 25% (348px): Model face
   - Middle 50% (696px): Full product
   - Bottom 25% (348px): Product detail
3. Generate detailed text prompt
4. Send to AI provider with deterministic seed
5. Display generated result
```

### 2. FLUX Generation Consistency Fix
**Problem**: Different faces on subsequent generations
**Solution**: 
- Deterministic seed from image+prompt hash
- Session consistency headers
- Proper base64 format (no data URL prefix)

### 3. Timestamp Synchronization
**Critical Bug Fixed**: Composite image and prompt had different timestamps
**Solution**: Single timestamp variable for all related files

---

## 📚 Documentation Index

### Core Documentation
1. **[CORE_WORKFLOW_DOCUMENTATION.md](./CORE_WORKFLOW_DOCUMENTATION.md)**
   - Original September 4 checkpoint
   - Critical bug fixes
   - Working configurations

2. **[CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md)**
   - Fly.io backend deployment
   - Netlify frontend deployment
   - Environment variables setup

3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
   - Docker deployment
   - Synology NAS setup
   - Local development

4. **[FLY_GITHUB_SETUP.md](./FLY_GITHUB_SETUP.md)**
   - GitHub Actions configuration
   - Auto-deployment setup
   - Secrets management

### Quick Reference

#### Environment Variables Required
```bash
# Backend (.env)
OPENAI_API_KEY=your_openai_key
FLUX_API_KEY=your_flux_key
GEMINI_API_KEY=your_gemini_key  # For Nano Banana provider
PORT=5005
NODE_ENV=production

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5005  # or production URL
```

#### API Endpoints
- `POST /api/try-on/generate` - Generate try-on image
- `POST /api/upload/model` - Upload model images
- `GET /api/models` - Get available models
- `GET /health` - Health check

---

## 🔍 Troubleshooting

### Common Issues

1. **FLUX Inconsistent Faces**
   - Ensure deterministic seed is working
   - Check session headers are set
   - Verify base64 format is correct

2. **Composite Image Mismatch**
   - Check timestamp synchronization
   - Verify image proportions (25/50/25)
   - Ensure 752x1392px resolution

3. **Deployment Issues**
   - Check environment variables
   - Verify API keys are set
   - Check Fly.io logs: `flyctl logs`

---

## 🎯 For New Claude Sessions

When starting a new Claude chat session, reference these key files:

1. **This file** (`MASTER_DOCUMENTATION.md`) - Complete overview
2. **`CORE_WORKFLOW_DOCUMENTATION.md`** - Technical implementation details
3. **Model definitions** in `backend/src/config/models.js`
4. **AI Service** in `backend/src/services/aiService.js`

Key context to provide:
- "Working on TryOn360 platform with FLUX Kontext Pro"
- "4 Indonesian models: Gunawan, Paul, Rachma, Johny"
- "Composite image: 25% face, 50% product, 25% detail at 752x1392px"
- "Using deterministic seeds for FLUX consistency"

---

## 📝 Recent Updates (September 10, 2025)

1. **Project Cleanup**: Moved old files to `old-unused-files-20250910/`
2. **Structure Simplification**: Removed nested `try-on-app` folder
3. **Documentation Organization**: Created `documentation/` folder
4. **FLUX Consistency Fix**: Implemented deterministic seeding
5. **Deployment Updates**: Updated GitHub Actions paths

---

*This documentation is the single source of truth for the TryOn360 platform. All implementation details, configurations, and workflows are documented here for continuity across development sessions.*