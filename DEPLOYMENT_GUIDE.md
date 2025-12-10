# TryOn App - Synology Deployment Guide

## Overview
This guide will help you deploy the Virtual Try-On Platform on your Synology DS224+ NAS using Docker containers.

## Prerequisites

### Hardware Requirements
- ✅ Synology DS224+ with Intel Celeron J4125
- ✅ 6GB RAM (sufficient for this application)
- ✅ At least 10GB free space for Docker images and data

### Software Requirements
1. **Container Manager** - Install from Package Center
2. **SSH access** - Enable in Control Panel > Terminal & SNMP
3. **Git** - Install from Package Center (optional, script handles this)

## Quick Deployment

### Step 1: SSH into Your Synology
```bash
ssh admin@your-nas-ip
```

### Step 2: Run Automated Deployment
```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/arayasuryanto/garment-tryon-app/main/try-on-app/deploy-synology.sh
chmod +x deploy-synology.sh
sudo ./deploy-synology.sh
```

### Step 3: Configure Environment Variables
```bash
cd /volume1/docker/tryon-app
nano .env
```

Add your API keys:
```env
FLUX_API_KEY=your_flux_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 4: Restart Services
```bash
docker-compose restart
```

## Manual Deployment (Alternative)

### 1. Create Project Directory
```bash
sudo mkdir -p /volume1/docker/tryon-app
cd /volume1/docker/tryon-app
```

### 2. Clone Repository
```bash
git clone https://github.com/arayasuryanto/garment-tryon-app.git temp
cp -r temp/try-on-app/* .
rm -rf temp
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual values
nano .env
```

### 4. Create Required Directories
```bash
mkdir -p backend/uploads backend/generated backend/logs
mkdir -p nginx/ssl nginx/logs
chmod 755 backend/uploads backend/generated
```

### 5. Deploy Services
```bash
# Basic deployment (frontend + backend)
docker-compose up -d --build frontend backend

# With monitoring (optional)
docker-compose --profile monitoring up -d portainer

# With caching (optional) 
docker-compose --profile cache up -d redis
```

## Service Configuration

### Basic Services (Default)
- **Frontend**: React app served by Nginx on port 3000
- **Backend**: Node.js API server on port 8000

### Optional Services
- **Redis Cache**: Enable with `--profile cache`
- **Monitoring**: Enable with `--profile monitoring` (Portainer on port 9000)
- **Reverse Proxy**: Enable with `--profile production`

## Network Access

### Local Access
- Frontend: `http://your-nas-ip:3000`
- Backend API: `http://your-nas-ip:8000/api`
- Monitoring: `http://your-nas-ip:9000` (if enabled)

### External Access
1. Configure port forwarding on your router:
   - Port 3000 → NAS IP:3000 (Frontend)
   - Port 8000 → NAS IP:8000 (Backend)

2. Optional: Use Synology DDNS for dynamic IP resolution

## SSL/HTTPS Setup (Production)

### Using Let's Encrypt
1. Enable HTTPS in DSM Control Panel
2. Configure SSL certificate for your domain
3. Update docker-compose.yml to use SSL profile:
   ```bash
   docker-compose --profile production up -d
   ```

### Using Custom SSL Certificate
1. Place certificates in `nginx/ssl/`:
   ```
   nginx/ssl/cert.pem
   nginx/ssl/key.pem
   ```
2. Update nginx configuration as needed

## Monitoring & Maintenance

### View Logs
```bash
cd /volume1/docker/tryon-app

# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Check Service Health
```bash
# Check running containers
docker ps --filter "name=tryon-"

# Check service status
docker-compose ps

# View resource usage
docker stats
```

### Update Application
```bash
cd /volume1/docker/tryon-app

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Clean up old images
docker system prune -f
```

## Backup Strategy

### What to Backup
- `/volume1/docker/tryon-app/.env` - Environment configuration
- `/volume1/docker/tryon-app/backend/uploads/` - User uploaded files
- `/volume1/docker/tryon-app/backend/generated/` - Generated images
- Docker volumes (if using database)

### Synology Backup
1. Use **Hyper Backup** package
2. Create task to backup `/volume1/docker/tryon-app/`
3. Schedule regular backups to external storage

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs for errors
docker-compose logs

# Check available resources
free -h
df -h
```

**Port conflicts:**
```bash
# Check what's using ports
netstat -tlnp | grep :3000
netstat -tlnp | grep :8000
```

**Permission errors:**
```bash
# Fix ownership
sudo chown -R 1000:1000 backend/uploads backend/generated

# Fix permissions
sudo chmod -R 755 backend/uploads backend/generated
```

**API keys not working:**
```bash
# Verify environment file
cat .env

# Restart services after changes
docker-compose restart
```

### Performance Optimization

**For DS224+ with 6GB RAM:**
```yaml
# Add to docker-compose.yml services
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
  
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

**Storage optimization:**
```bash
# Clean up old generated files (run weekly)
find backend/generated -type f -mtime +7 -delete

# Clean Docker system
docker system prune -f --volumes
```

## Security Considerations

### Network Security
- Use Synology Firewall to restrict access
- Consider VPN access for remote management
- Regular security updates via Package Center

### Application Security
- Change default passwords in environment files
- Use strong API keys
- Monitor access logs regularly
- Backup encryption recommended

### Docker Security
```bash
# Run containers as non-root user
# Already configured in Dockerfiles

# Regular updates
docker-compose pull
docker-compose up -d
```

## Support & Updates

### Getting Help
1. Check logs first: `docker-compose logs -f`
2. Review this documentation
3. Check GitHub issues: [Repository Issues](https://github.com/arayasuryanto/garment-tryon-app/issues)

### Regular Maintenance
- Weekly: Check logs and disk usage
- Monthly: Update containers and clean up
- Quarterly: Review security and backup restoration

---

## Quick Reference Commands

```bash
# Deployment
sudo ./deploy-synology.sh

# Start services
docker-compose up -d

# Stop services  
docker-compose down

# View logs
docker-compose logs -f

# Update application
git pull && docker-compose up -d --build

# Clean up
docker system prune -f

# Backup important data
tar -czf backup-$(date +%Y%m%d).tar.gz .env backend/uploads backend/generated
```

---

**Deployment Status**: ✅ Ready for Production  
**Last Updated**: September 4, 2025  
**Compatible With**: Synology DSM 7.x, Docker 20.x+