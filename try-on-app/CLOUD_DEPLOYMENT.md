# ☁️ Cloud Deployment Guide - Render + Netlify

Deploy your TryOn360 Platform to the cloud in minutes! This guide covers deploying the backend to Render and frontend to Netlify for instant availability.

## 🚀 Quick Start (5 Minutes Setup)

### Prerequisites
- GitHub account with your repository
- Render account (free tier available)
- Netlify account (free tier available)
- Your API keys (OpenAI + FLUX)

---

## 🔧 Backend Deployment (Render)

### Step 1: Create Render Service

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect GitHub** and select your repository
4. **Configure the service:**
   ```
   Name: tryon-app-backend
   Branch: main
   Root Directory: try-on-app/backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

### Step 2: Configure Environment Variables

In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://YOUR-NETLIFY-SITE.netlify.app
OPENAI_API_KEY=your_openai_api_key_here
FLUX_API_KEY=your_flux_api_key_here
```

### Step 3: Deploy

1. **Click "Create Web Service"**
2. **Wait 3-5 minutes for deployment**
3. **Your backend URL**: `https://tryon-app-backend.onrender.com`

### Step 4: Verify Backend

Test your backend health:
```bash
curl https://tryon-app-backend.onrender.com/health
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
REACT_APP_API_URL=https://tryon-app-backend.onrender.com/api
REACT_APP_APP_NAME=TryOn360 Platform  
REACT_APP_VERSION=2.0.0
REACT_APP_ENVIRONMENT=production
```

### Step 3: Deploy

1. **Click "Deploy site"**
2. **Wait 2-3 minutes for build**
3. **Your frontend URL**: `https://YOUR-SITE-NAME.netlify.app`

### Step 4: Update Backend CORS

1. **Go back to Render dashboard**
2. **Update FRONTEND_URL environment variable:**
   ```
   FRONTEND_URL=https://YOUR-ACTUAL-NETLIFY-URL.netlify.app
   ```
3. **Redeploy backend service**

---

## ⚙️ Configuration Files Reference

### Backend Files Added:
- `backend/render.yaml` - Render service configuration
- `backend/.env.render` - Environment template

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

### Render Custom Domain  
1. **Render Dashboard** → Service → Settings → Custom Domains
2. **Add domain**: `api.yourapp.com`
3. **Update DNS CNAME** record
4. **SSL certificate automatically provisioned**

### Update Environment Variables for Custom Domains
```env
# Render
FRONTEND_URL=https://yourapp.com

# Netlify  
REACT_APP_API_URL=https://api.yourapp.com/api
```

---

## 📊 Monitoring & Logs

### Render Monitoring
- **Logs**: Render Dashboard → Service → Logs
- **Metrics**: Built-in CPU, Memory, Response time charts
- **Health checks**: Automatic via `/health` endpoint

### Netlify Monitoring
- **Build logs**: Netlify Dashboard → Deploys
- **Function logs**: Real-time in dashboard
- **Analytics**: Built-in traffic analytics

---

## 🛠 Maintenance & Updates

### Automatic Deployments
Both services auto-deploy when you push to GitHub main branch.

### Manual Deployment
**Render**: Dashboard → "Manual Deploy" button
**Netlify**: Dashboard → "Trigger deploy" button

### Rolling Back
**Render**: Dashboard → Deploys → Select previous deploy → "Redeploy"
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

### Render (Backend)
- **Free Tier**: 750 hours/month, sleeps after 15min inactivity
- **Starter Plan**: $7/month, no sleeping, 512MB RAM
- **Standard Plan**: $25/month, 2GB RAM, better performance

### Netlify (Frontend)  
- **Free Tier**: 100GB bandwidth, 300 build minutes/month
- **Pro Plan**: $19/month, 1TB bandwidth, analytics
- **Business Plan**: $99/month, advanced features

### Recommended for Production
- **Render Starter** ($7/month) - No sleeping, reliable performance
- **Netlify Free** (sufficient for most use cases)
- **Total**: ~$7/month for reliable service

---

## 🔧 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check Render logs for missing environment variables
# Ensure API keys are set correctly
# Verify Node.js version (18.x required)
```

**CORS errors:**
```bash
# Update FRONTEND_URL in Render environment variables
# Redeploy backend service
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

**Backend (Render):**
- Use Starter plan or higher for production
- Enable persistent storage for uploads if needed
- Monitor response times and upgrade if slow

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
curl https://your-render-url.onrender.com/health

# Test models endpoint  
curl https://your-render-url.onrender.com/api/models

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

**Render Support:**
- [Render Documentation](https://render.com/docs)
- [Community Forum](https://community.render.com/)
- [Status Page](https://status.render.com/)

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
- **API**: `https://your-render-service.onrender.com`

**Next Steps:**
- Test all functionality with your team
- Set up monitoring and alerts
- Plan for scaling if needed
- Consider custom domains for branding

---

**Deployment Status**: ✅ Ready for Production  
**Cloud Provider**: Render + Netlify  
**Estimated Deploy Time**: 5-10 minutes  
**Monthly Cost**: Free tier available, $7/month recommended