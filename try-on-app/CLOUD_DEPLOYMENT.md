# ☁️ Cloud Deployment Guide - Fly.io + Netlify

Deploy your TryOn360 Platform to the cloud in minutes! This guide covers deploying the backend to Fly.io (with global edge locations) and frontend to Netlify for instant availability.

## 🚀 Quick Start (5 Minutes Setup)

### Prerequisites
- GitHub account with your repository
- Fly.io account (free tier available with credit card)
- Netlify account (free tier available)
- Your API keys (OpenAI + FLUX)
- Fly CLI installed: `curl -L https://fly.io/install.sh | sh`

---

## 🔧 Backend Deployment (Fly.io)

### Step 1: Initialize Fly.io App

1. **Navigate to backend directory:**
   ```bash
   cd try-on-app/backend
   ```

2. **Login to Fly.io:**
   ```bash
   fly auth login
   ```

3. **Launch the app (creates app and config):**
   ```bash
   fly launch --name tryon-app-backend \
     --region sin \
     --dockerfile Dockerfile.fly \
     --no-deploy
   ```
   - Choose "sin" (Singapore) or your preferred region
   - Don't deploy yet (we need to set secrets first)

### Step 2: Configure Secrets (Environment Variables)

Set your API keys as secrets:

```bash
fly secrets set OPENAI_API_KEY="your_openai_api_key_here"
fly secrets set FLUX_API_KEY="your_flux_api_key_here"
fly secrets set FRONTEND_URL="https://YOUR-NETLIFY-SITE.netlify.app"
```

Verify secrets are set:
```bash
fly secrets list
```

### Step 3: Create Persistent Volumes

Create volumes for file storage:
```bash
fly volumes create uploads_volume --size 1 --region sin
fly volumes create generated_volume --size 1 --region sin
```

### Step 4: Deploy

```bash
fly deploy --dockerfile Dockerfile.fly
```

Wait 2-3 minutes for deployment. Your backend URL will be:
`https://tryon-app-backend.fly.dev`

### Step 5: Verify Backend

Test your backend health:
```bash
curl https://tryon-app-backend.fly.dev/health
```

Or check status:
```bash
fly status
fly logs
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-04T10:30:00.000Z",
  "version": "2.0.0",
  "environment": "production"
}
```

---

## 🌐 Frontend Deployment (Netlify)

### Step 1: Create Netlify Site

1. **Go to [Netlify Dashboard](https://app.netlify.com/)**
2. **Click "Add new site" → "Import an existing project"**
3. **Connect GitHub** and select your repository
4. **Configure build settings:**
   ```
   Base directory: try-on-app/frontend
   Build command: npm run build
   Publish directory: try-on-app/frontend/build
   ```

### Step 2: Configure Environment Variables

In Netlify dashboard → Site settings → Environment variables:

```env
REACT_APP_API_URL=https://tryon-app-backend.fly.dev/api
REACT_APP_APP_NAME=TryOn360 Platform  
REACT_APP_VERSION=2.0.0
REACT_APP_ENVIRONMENT=production
```

### Step 3: Deploy

1. **Click "Deploy site"**
2. **Wait 2-3 minutes for build**
3. **Your frontend URL**: `https://YOUR-SITE-NAME.netlify.app`

### Step 4: Update Backend CORS

1. **Update FRONTEND_URL secret in Fly.io:**
   ```bash
   fly secrets set FRONTEND_URL="https://YOUR-ACTUAL-NETLIFY-URL.netlify.app"
   ```
2. **Backend will automatically restart with new secret**

---

## ⚙️ Configuration Files Reference

### Backend Files Added:
- `backend/fly.toml` - Fly.io app configuration
- `backend/Dockerfile.fly` - Optimized Dockerfile for Fly.io
- `backend/.dockerignore` - Files to exclude from Docker build

### Frontend Files Added:
- `frontend/netlify.toml` - Netlify build & routing config
- `frontend/.env.production` - Production environment variables

---

## 🔗 Custom Domains (Optional)

### Netlify Custom Domain
1. **Netlify Dashboard** → Site settings → Domain management
2. **Add custom domain**: `yourapp.com`
3. **Follow DNS configuration instructions**
4. **SSL certificate automatically provisioned**

### Fly.io Custom Domain  
1. **Add certificate for domain:**
   ```bash
   fly certs add api.yourapp.com
   ```
2. **Update DNS with provided records**
3. **SSL certificate automatically provisioned**
4. **Verify:**
   ```bash
   fly certs check api.yourapp.com
   ```

### Update Environment Variables for Custom Domains
```bash
# Fly.io
fly secrets set FRONTEND_URL="https://yourapp.com"

# Netlify  
REACT_APP_API_URL=https://api.yourapp.com/api
```

---

## 📊 Monitoring & Logs

### Fly.io Monitoring
- **Logs**: `fly logs` or `fly logs --tail`
- **Metrics**: `fly dashboard` opens metrics in browser
- **Status**: `fly status` shows app instances
- **Health checks**: Automatic via `/health` endpoint
- **SSH into container**: `fly ssh console`

### Netlify Monitoring
- **Build logs**: Netlify Dashboard → Deploys
- **Function logs**: Real-time in dashboard
- **Analytics**: Built-in traffic analytics

---

## 🛠 Maintenance & Updates

### Automatic Deployments
Both services auto-deploy when you push to GitHub main branch.

### Manual Deployment
**Fly.io**: `fly deploy --dockerfile Dockerfile.fly`
**Netlify**: Dashboard → "Trigger deploy" button

### Rolling Back
**Fly.io**: 
```bash
fly releases
fly deploy --image registry.fly.io/tryon-app-backend:v[NUMBER]
```
**Netlify**: Dashboard → Deploys → Click deploy → "Publish deploy"

### Update Process
```bash
# 1. Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# 2. Both services automatically redeploy
# 3. Check logs for any issues
```

---

## 💰 Cost Breakdown

### Fly.io (Backend)
- **Free Tier**: $5 credit/month (requires credit card)
- **Hobby Plan**: ~$5/month for 1 shared CPU, 256MB RAM
- **Standard Plan**: ~$10/month for 1 shared CPU, 512MB RAM
- **Includes**: 3GB persistent storage, global deployment

### Netlify (Frontend)  
- **Free Tier**: 100GB bandwidth, 300 build minutes/month
- **Pro Plan**: $19/month, 1TB bandwidth, analytics
- **Business Plan**: $99/month, advanced features

### Recommended for Production
- **Fly.io Hobby** (~$5/month) - Always on, global edge
- **Netlify Free** (sufficient for most use cases)
- **Total**: ~$5/month with better global performance

---

## 🔧 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check Fly logs
fly logs

# Check secrets are set
fly secrets list

# SSH into container to debug
fly ssh console
```

**CORS errors:**
```bash
# Update FRONTEND_URL secret
fly secrets set FRONTEND_URL="https://your-netlify-url.netlify.app"

# App auto-restarts with new secret
# Clear browser cache
```

**Build failures:**
```bash
# Check build logs in Netlify
# Verify Node.js version compatibility
# Check for missing dependencies
```

**API connection issues:**
```bash
# Verify REACT_APP_API_URL is correct
# Check backend service is running
# Test backend health endpoint directly
```

### Performance Optimization

**Backend (Fly.io):**
- Scale horizontally: `fly scale count 2`
- Scale vertically: `fly scale vm shared-cpu-1x --memory 512`
- Add regions: `fly regions add lax` (Los Angeles)
- Monitor: `fly dashboard`

**Frontend (Netlify):**
- Enable build optimizations (already configured)
- Use Netlify CDN for global performance
- Configure caching headers (already in netlify.toml)

---

## 🔒 Security Checklist

✅ **API Keys**: Stored as environment variables, never in code  
✅ **CORS**: Configured to allow only your frontend domain  
✅ **HTTPS**: Automatic SSL certificates on both services  
✅ **Headers**: Security headers configured in netlify.toml  
✅ **File uploads**: Size limits enforced (10MB max)  
✅ **Health checks**: Monitoring service availability  

---

## 📱 Testing Your Deployment

### 1. Frontend Functionality
- ✅ Site loads at your Netlify URL
- ✅ Models display correctly  
- ✅ Image upload works
- ✅ Generation process completes
- ✅ Results display properly

### 2. Backend API  
- ✅ Health endpoint responds
- ✅ Models API returns data
- ✅ Generation API accepts requests
- ✅ File uploads process correctly

### 3. Integration
- ✅ Frontend connects to backend
- ✅ API requests succeed
- ✅ Error handling works
- ✅ CORS policy allows requests

### Test Commands
```bash
# Test backend health
curl https://tryon-app-backend.fly.dev/health

# Test models endpoint  
curl https://tryon-app-backend.fly.dev/api/models

# Test frontend
curl -I https://your-netlify-site.netlify.app
```

---

## 🚀 Go Live Checklist

Before sharing with your team:

- [ ] Backend deployed and healthy on Render
- [ ] Frontend deployed and accessible on Netlify  
- [ ] Environment variables configured correctly
- [ ] CORS updated with correct frontend URL
- [ ] API keys working (test generation)
- [ ] Custom domain configured (optional)
- [ ] Team access permissions set up
- [ ] Monitoring/alerts configured
- [ ] Backup strategy planned

---

## 📞 Support Resources

**Fly.io Support:**
- [Fly.io Documentation](https://fly.io/docs)
- [Community Forum](https://community.fly.io/)
- [Status Page](https://status.flyio.net/)
- CLI Help: `fly help`

**Netlify Support:**  
- [Netlify Documentation](https://docs.netlify.com/)
- [Community Forum](https://community.netlify.com/)
- [Status Page](https://netlifystatus.com/)

**Your App Support:**
- GitHub Issues: [Create Issue](https://github.com/arayasuryanto/garment-tryon-app/issues)
- Documentation: This guide and README.md

---

## 🎉 Success!

Your TryOn360 Platform is now live in the cloud! 

**Share these URLs with your team:**
- **App**: `https://your-netlify-site.netlify.app`
- **API**: `https://tryon-app-backend.fly.dev`

**Next Steps:**
- Test all functionality with your team
- Set up monitoring and alerts
- Plan for scaling if needed
- Consider custom domains for branding

---

**Deployment Status**: ✅ Ready for Production  
**Cloud Provider**: Fly.io + Netlify  
**Estimated Deploy Time**: 5-10 minutes  
**Monthly Cost**: Free tier available, $7/month recommended