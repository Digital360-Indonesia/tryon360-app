# 🎯 TryOn360 Platform v2.0

Professional AI-powered virtual try-on platform with FLUX Kontext Pro integration and composite image generation.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure API keys
cp .env.example backend/.env
# Edit backend/.env and add your API keys:
# OPENAI_API_KEY=your_key_here
# FLUX_API_KEY=your_key_here

# 3. Start development
npm run dev  # Runs backend (5005) + frontend (3000)
```

## ✨ Key Features

### **4 Professional Models**
- **Gunawan** (Male) - Indonesian, confident professional
- **Paul** (Male) - Indonesian, clean-shaven, approachable  
- **Rachma** (Female) - Indonesian, hijab-wearing, elegant
- **Johny** (Male) - Indonesian, youthful, friendly

### **Composite Image Generation**
- **Resolution**: 752x1392px (9:16 aspect ratio)
- **Structure**: Model face (25%) + Product (50%) + Detail (25%)
- **AI Integration**: FLUX Kontext Pro, OpenAI DALL-E 3, Nano Banana (Gemini 2.5 Flash Image)

### **Cloud Deployment**
- **Backend**: Fly.io (https://tryon-app-backend.fly.dev)
- **Frontend**: Netlify (auto-deployed from GitHub)

## 📚 Documentation

- **[📋 MASTER_DOCUMENTATION.md](./documentation/MASTER_DOCUMENTATION.md)** - Complete project overview
- **[🚀 CLAUDE_QUICK_START.md](./CLAUDE_QUICK_START.md)** - For new Claude chat sessions
- **[⚙️ CORE_WORKFLOW_DOCUMENTATION.md](./documentation/CORE_WORKFLOW_DOCUMENTATION.md)** - Technical implementation
- **[☁️ CLOUD_DEPLOYMENT.md](./documentation/CLOUD_DEPLOYMENT.md)** - Deployment guide

### **Multi-Slot Upload System**
- **Product Overview** - Main garment image (required)
- **Detail Slot 1** - First embroidery/print detail
- **Detail Slot 2** - Second embroidery/print detail  
- **Detail Slot 3** - Third embroidery/print detail

### **3 AI Providers**
- **Flux Kontext** ⚡ - High-quality, supports image input ($0.045)
- **ChatGPT DALL-E** 🧠 - OpenAI powered generation ($0.080)
- **Gemini Flash 2.5** ⏳ - Coming soon placeholder ($0.030)

### **Advanced Features**
- Detailed model prompts for consistency
- Dynamic prompt building system
- Professional studio-quality outputs
- Real-time generation progress
- Image optimization and processing
- Cost tracking per generation

## 🏗️ Architecture

### Backend (`/backend`)
- **Express.js** - REST API server
- **Multer** - Multi-file upload handling
- **Sharp** - Image processing and optimization
- **Unified AI Service** - Abstract interface for all providers
- **Dynamic Prompt Builder** - Context-aware prompt generation

### Frontend (`/frontend`) 
- **React 18** - Modern component architecture
- **Tailwind CSS** - Utility-first responsive design
- **React Dropzone** - Drag-and-drop file uploads
- **Lucide Icons** - Professional icon library

## 📁 Project Structure

```
try-on-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── models.js          # 4 detailed model definitions
│   │   │   └── aiProviders.js     # AI service configurations
│   │   ├── services/
│   │   │   ├── aiService.js       # Unified AI provider interface
│   │   │   ├── promptBuilder.js   # Dynamic prompt construction
│   │   │   └── imageProcessor.js  # Upload processing & analysis
│   │   └── routes/
│   │       ├── models.js          # Model & pose endpoints
│   │       └── generation.js      # Try-on generation API
│   ├── uploads/                   # User uploaded files
│   ├── models/                    # Model reference images  
│   └── generated/                 # AI generated outputs
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ModelSelector.js    # Professional model cards
    │   │   ├── UploadSlots.js      # 4-slot upload interface
    │   │   └── GenerationPanel.js  # AI provider selection
    │   ├── pages/
    │   │   └── TryOnStudio.js      # Main application
    │   └── services/
    │       └── api.js              # Backend communication
    └── public/
        └── models/                 # Model reference images
```

## 🔧 Configuration

### Environment Variables (`backend/.env`)

```env
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# AI Providers
OPENAI_API_KEY=your_openai_api_key
FLUX_API_KEY=your_flux_api_key  
GEMINI_API_KEY=your_gemini_api_key

# Settings
MAX_CONCURRENT_GENERATIONS=3
DEFAULT_AI_PROVIDER=flux_kontext
OUTPUT_IMAGE_QUALITY=85
```

## 🎯 Usage Workflow

1. **Select Model** - Choose from 4 professional models with unique characteristics
2. **Choose Pose** - Select from available poses for the chosen model
3. **Upload Product** - Main garment image (required)
4. **Add Details** - Upload 1-3 embroidery/print detail images (optional)
5. **Configure** - Set embroidery positions and descriptions
6. **Select AI Provider** - Choose generation service (Flux/ChatGPT/Gemini)
7. **Generate** - Create professional try-on image
8. **Download** - Save high-quality result

## 🔌 API Endpoints

### Models
- `GET /api/models` - List all models
- `GET /api/models/:id` - Get model details
- `GET /api/models/:id/poses` - Get model poses

### Generation  
- `POST /api/generation/try-on` - Generate try-on image
- `GET /api/generation/job/:id` - Check generation status
- `GET /api/generation/providers` - List AI providers

## 🎨 Key Improvements

### **vs Previous Version**
- ✅ **Simplified Architecture** - Removed unnecessary complexity
- ✅ **Better Model Consistency** - Detailed facial descriptions
- ✅ **Multi-Provider Support** - Flux, ChatGPT, Gemini ready
- ✅ **Professional UI** - Clean modern interface
- ✅ **Optimized Performance** - Faster processing pipeline
- ✅ **Better Error Handling** - Robust failure management
- ✅ **Cost Transparency** - Clear pricing per provider

### **Quality Focused**
- Detailed model prompts for facial consistency
- Professional studio photography specifications
- Image optimization and processing
- Real-time progress tracking
- Error recovery and retry logic

## 🚧 Development Status

- ✅ **Core Backend** - Complete API structure
- ✅ **Model System** - 4 professional models defined
- ✅ **Upload System** - Multi-slot file handling
- ✅ **AI Integration** - Flux & ChatGPT ready
- ✅ **Frontend UI** - Modern React interface
- ⏳ **Testing** - Need API key testing
- ⏳ **Model Images** - Need reference photos
- ⏳ **Gemini Integration** - Waiting for API access

## 🔧 Next Steps

1. **Add API Keys** - Configure Flux and OpenAI keys
2. **Test Generation** - Verify AI provider functionality  
3. **Add Model Photos** - Professional reference images
4. **Quality Testing** - Test output consistency
5. **Performance Optimization** - Fine-tune processing

This rebuild focuses on simplicity, quality, and professional results. The architecture is designed to be maintainable and easily extensible for future AI providers.