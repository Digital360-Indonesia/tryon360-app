# 🚀 Quick Start Guide

## Get Started in 3 Minutes

### Step 1: Setup Environment
```bash
cd kustompedia-tryon-platform
chmod +x setup.sh
./setup.sh
```

### Step 2: Add OpenAI API Key
Edit `backend/.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 3: Start the Platform
```bash
# Option A: Start both services at once
npm run dev

# Option B: Start separately
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm start
```

### Step 4: Access the Platform
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## First Generation Test

1. Go to **Generate Try-On** page
2. Select **Model**: Ari (Indonesian male, professional)
3. Choose **Garment**: T-Shirt
4. Set **Color**: "navy blue"
5. Select **Quality**: Standard ($0.042)
6. Click **Generate Try-On**

## What's Included

✅ **5-Slot Queue System** - Process multiple images simultaneously  
✅ **7 Consistent Models** - Indonesian models with fixed characteristics  
✅ **Logo Enhancement** - Focus on branding details  
✅ **Real-time Monitoring** - Live progress tracking  
✅ **Cost Management** - Track API spending  
✅ **Priority Queue** - High/normal/low priority jobs  

## Features Overview

### Your Models
- **Ari** - Male, 25, professional casual
- **Sari** - Female, 23, elegant  
- **Budi** - Male, 30, mature reliable
- **Dina** - Female, 22, energetic
- **Raja** - Male, 27, creative modern
- **Maya** - Female, 26, sophisticated  
- **Agus** - Male, 24, sporty

### Quality Options
- **Preview** - $0.011 (quick tests)
- **Standard** - $0.042 (social media)
- **Premium** - $0.167 (marketing)

### Garment Types
- T-Shirt, Polo Shirt, Hoodie, Jacket, Uniform Shirt
- Each with specific logo positions

## Troubleshooting

**Can't connect to OpenAI?**
- Check your API key in `backend/.env`
- Verify your OpenAI account has credits

**Frontend won't load?**
- Make sure both frontend (3000) and backend (3001) are running
- Check console for errors

**Images not generating?**
- Check backend logs for API errors
- Verify queue status in header

## Next Steps

1. **Test Different Models** - Try each of your 7 models
2. **Upload Reference Images** - Test with actual garment photos  
3. **Logo Enhancement** - Test the logo focus feature
4. **Queue Management** - Monitor multiple jobs
5. **Cost Tracking** - Watch API usage

## File Structure
```
kustompedia-tryon-platform/
├── backend/           # Node.js API server
├── frontend/          # React web app  
├── README.md          # Full documentation
├── setup.sh           # Auto setup script
└── package.json       # Root package file
```

Ready to create amazing garment visualizations! 🎨
