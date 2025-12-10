# 🚀 Claude Quick Start Guide - TryOn360 Platform

## For New Claude Chat Sessions

### 1️⃣ Project Context
Tell Claude: *"I'm working on the TryOn360 AI virtual try-on platform with FLUX Kontext Pro integration"*

### 2️⃣ Key Documentation to Reference
Point Claude to these files:
```
📁 documentation/
  ├── MASTER_DOCUMENTATION.md          # Complete overview
  ├── CORE_WORKFLOW_DOCUMENTATION.md   # Technical details  
  ├── CLOUD_DEPLOYMENT.md             # Deployment guide
  └── DEPLOYMENT_GUIDE.md             # Docker/Synology setup
```

### 3️⃣ Critical Information

**Models Available:**
- Gunawan (Male, Indonesian)
- Paul (Male, Clean-shaven, Indonesian) 
- Rachma (Female, Hijab, Indonesian)
- Johny (Male, Indonesian)

**Composite Image Structure:**
- Resolution: 752x1392px (9:16 aspect ratio)
- Top 25% (348px): Model face
- Middle 50% (696px): Full product
- Bottom 25% (348px): Product detail

**Current Setup:**
- Backend: Port 5005 (Node.js/Express)
- Frontend: Port 3000 (React)
- Production: Fly.io (backend) + Netlify (frontend)

### 4️⃣ Recent Fixes Applied

✅ **FLUX Consistency Issue Solved:**
- Deterministic seed based on image+prompt hash
- Session consistency headers
- Proper base64 format (no data URL prefix)

✅ **Timestamp Bug Fixed:**
- Single timestamp for composite and prompt files

### 5️⃣ Environment Variables Needed
```bash
OPENAI_API_KEY=...
FLUX_API_KEY=...
GEMINI_API_KEY=...  # For Nano Banana (Gemini 2.5 Flash Image)
```

### 6️⃣ Quick Commands
```bash
# Start development
npm run dev

# Deploy backend
cd backend && flyctl deploy

# Check logs
flyctl logs --app tryon-app-backend
```

### 7️⃣ API Endpoints
- `POST /api/try-on/generate` - Main generation endpoint
- `GET /health` - Health check

---

**Last Updated:** September 10, 2025
**Working Directory:** `/Users/araya/Downloads/kustompedia-tryon-platform`