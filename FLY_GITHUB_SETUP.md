# 🚀 Fly.io + GitHub Auto-Deployment Setup

Deploy your backend automatically from GitHub to Fly.io - just like Netlify does for frontend!

## Quick Setup (One-Time, 5 Minutes)

### Step 1: Create Fly.io App

First, install Fly CLI and create your app:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Navigate to backend
cd try-on-app/backend

# Create app (don't deploy yet)
fly launch --name tryon-app-backend \
  --region sin \
  --dockerfile Dockerfile.fly \
  --no-deploy
```

### Step 2: Set Secrets (API Keys)

```bash
# Set your API keys as secrets
fly secrets set OPENAI_API_KEY="your_openai_key_here"
fly secrets set FLUX_API_KEY="your_flux_key_here"
fly secrets set FRONTEND_URL="https://your-netlify-site.netlify.app"
```

### Step 3: Create Persistent Volumes

```bash
# Create volumes for file storage
fly volumes create uploads_volume --size 1 --region sin
fly volumes create generated_volume --size 1 --region sin
```

### Step 4: Get Fly.io API Token for GitHub

```bash
# Generate a deploy token
fly tokens create deploy -x 999999h

# Copy the token that appears (starts with 'FlyV1...')
```

### Step 5: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `FLY_API_TOKEN`
5. Value: Paste your Fly token (FlyV1...)
6. Click "Add secret"

### Step 6: Initial Deploy

Do the first deploy manually:

```bash
cd try-on-app/backend
fly deploy --dockerfile Dockerfile.fly
```

## ✅ That's It! Now It Auto-Deploys

From now on:
- **Push to GitHub** → Backend auto-deploys to Fly.io
- **Just like Netlify** → No manual deployment needed
- **GitHub Actions** handles everything

## How It Works

```mermaid
graph LR
    A[Push to GitHub] --> B[GitHub Actions Triggered]
    B --> C[Deploy to Fly.io]
    C --> D[Backend Live!]
```

The workflow only runs when:
- You push to `main` branch
- Changes are in `try-on-app/backend/` folder
- Or you manually trigger it

## Test Your Setup

1. Make a small change to backend code:
```bash
echo "// Test comment" >> try-on-app/backend/server.js
git add .
git commit -m "Test auto-deploy"
git push
```

2. Check GitHub Actions tab - you'll see deployment running

3. Once complete, your backend is updated!

## Manual Deploy (If Needed)

You can still deploy manually:

**Option 1: From GitHub Actions**
- Go to Actions tab
- Select "Deploy Backend to Fly.io"
- Click "Run workflow"

**Option 2: From Command Line**
```bash
cd try-on-app/backend
fly deploy --dockerfile Dockerfile.fly
```

## Monitoring

**View Logs:**
```bash
fly logs --app tryon-app-backend
```

**Check Status:**
```bash
fly status --app tryon-app-backend
```

**Open Dashboard:**
```bash
fly dashboard --app tryon-app-backend
```

## Update Secrets

If you need to change API keys:

```bash
# Update a secret
fly secrets set OPENAI_API_KEY="new_key_here"

# List secrets (names only, not values)
fly secrets list

# Remove a secret
fly secrets unset OLD_SECRET_NAME
```

## Troubleshooting

**Deployment Failed?**
1. Check GitHub Actions logs
2. Check Fly.io logs: `fly logs`
3. Verify secrets are set: `fly secrets list`

**Wrong Region?**
```bash
# Add more regions
fly regions add lax  # Los Angeles
fly regions add ams  # Amsterdam
fly regions list     # View all regions
```

**Need to Scale?**
```bash
# Add more instances
fly scale count 2

# Increase memory
fly scale vm shared-cpu-1x --memory 512
```

## Cost

- **Fly.io**: ~$5/month (Hobby plan)
- **GitHub Actions**: Free for public repos, 2000 minutes/month for private
- **Total**: ~$5/month

## Summary

✅ **GitHub Integration Complete!**
- Push to GitHub → Auto-deploy to Fly.io
- Same workflow as Netlify (push & forget)
- No manual deployment needed
- Secrets stored securely
- Persistent file storage
- Global edge network

Your backend now auto-deploys just like your Netlify frontend! 🎉