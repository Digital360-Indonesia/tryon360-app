# Tata Cara Deployment Garment Try-On App

## 📋 Prasyarat

Sebelum memulai deployment, pastikan Anda memiliki:

- Node.js (v18 atau lebih tinggi)
- npm atau yarn
- Git
- Server/VPS (untuk production)
- MongoDB (local atau cloud seperti MongoDB Atlas)
- API Keys yang diperlukan:
  - Gemini API Key
  - Flux API Key
  - OpenAI API Key (opsional)

## 🏗️ Struktur Proyek (Monolithic)

```
garment-tryon-app/
├── server.js              # Server Express utama
├── package.json           # Dependencies dan scripts
├── .env                   # Environment variables (RAHASIA)
├── .env.example          # Template environment variables
├── .gitignore            # File yang diabaikan Git
├── src/                  # Backend source code
│   ├── config/          # Konfigurasi (AI providers, database)
│   ├── models/          # MongoDB models/schemas
│   ├── routes/          # API routes
│   └── services/        # Business logic
├── client/              # Frontend React app
│   ├── public/          # Static assets
│   ├── src/             # React components
│   └── package.json     # Frontend dependencies
├── models/              # Model reference photos
├── generated/           # Hasil generated images (auto-generated)
└── uploads/             # Upload files sementara (auto-generated)
```

## 🚀 Cara Deployment

### 🎯 Super Simple Deployment (Recommended)

```bash
# 1. Clone repository
git clone <your-repo-url> garment-tryon-app
cd garment-tryon-app

# 2. Setup environment
cp .env.example .env
# Edit .env dengan API keys Anda

# 3. Install + Build everything
npm run setup:prod  # Untuk production
# atau
npm run setup:dev   # Untuk development

# 4. Jalankan aplikasi
npm start           # Production
# atau
npm run dev         # Development
```

Aplikasi akan berjalan di `http://localhost:3000`

---

### 📋 Penjelasan Script

Hanya **4 script** yang tersedia:

- **`npm run setup:dev`** - Install semua dependencies + build (development)
- **`npm run setup:prod`** - Install production dependencies + build (production)
- **`npm start`** - Jalankan server di production mode
- **`npm run dev`** - Jalankan server di development mode dengan auto-reload

### Environment Variables

Edit file `.env`:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/garment-tryon

# AI Provider API Keys
GEMINI_API_KEY=your_gemini_api_key_here
FLUX_API_KEY=your_flux_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Opsional

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🔧 Production Deployment

### Opsi 1: Direct Deployment (VPS/Dedicated Server)

```bash
# Install PM2 untuk process management
npm install -g pm2

# Clone dan setup
git clone <your-repo-url> garment-tryon-app
cd garment-tryon-app
cp .env.example .env
# Edit .env dengan production API keys

# Setup lengkap untuk production
npm run setup:prod

# Jalankan dengan PM2
pm2 start server.js --name "garment-tryon"

# Simpan konfigurasi PM2
pm2 save
pm2 startup
```

### Opsi 2: Deployment dengan Docker

Buat `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install production dependencies dan build
RUN npm run setup:prod

# Copy source code (excluding node_modules)
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

Build dan run Docker:
```bash
docker build -t garment-tryon .
docker run -p 3000:3000 --env-file .env garment-tryon
```

### Opsi 3: Deployment dengan Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

Konfigurasi Nginx (`/etc/nginx/sites-available/garment-tryon`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Konfigurasi Tambahan

### 1. SSL/HTTPS dengan Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Dapatkan SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 2. Firewall Setup

```bash
# Allow HTTP, HTTPS, dan SSH
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Backup Data

Buat script backup (`backup.sh`):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/garment-tryon"
APP_DIR="/path/to/garment-tryon-app"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup generated files
tar -czf $BACKUP_DIR/generated_$DATE.tar.gz -C $APP_DIR generated/ uploads/

# Backup environment file
cp $APP_DIR/.env $BACKUP_DIR/env_$DATE

# Hapus backup lama (opsional)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Jadwalkan backup dengan cron:
```bash
# Edit crontab
crontab -e

# Tambahkan baris berikut untuk backup setiap hari jam 2 pagi
0 2 * * * /path/to/backup.sh
```

## 📊 Monitoring

### 1. Monitoring dengan PM2

```bash
# Monitoring real-time
pm2 monit

# Lihat logs
pm2 logs garment-tryon

# Restart app
pm2 restart garment-tryon
```

### 2. Health Check

Aplikasi sudah memiliki endpoint health check:
- `GET /health` - Menampilkan status server dan database
- `GET /api/health` - Sama dengan /health

### 3. MongoDB Setup

#### Local MongoDB
```bash
# Install MongoDB (Ubuntu/Debian)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### MongoDB Atlas (Cloud)
1. Buka [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP address (0.0.0.0/0 untuk all access)
5. Copy connection string ke `.env`

Contoh connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/garment-tryon?retryWrites=true&w=majority
```

## 🚨 Troubleshooting

### 1. Port Sudah Digunakan

```bash
# Cek port yang aktif
sudo netstat -tlnp | grep :3000

# Kill process
sudo kill -9 <PID>
```

### 2. Permission Error

```bash
# Fix ownership
sudo chown -R $USER:$USER /path/to/garment-tryon-app
sudo chmod -R 755 /path/to/garment-tryon-app
```

### 3. API Key Not Working

- Pastikan API key valid dan aktif
- Cek kuota API
- Verifikasi konfigurasi di file `.env`
- Restart server setelah mengubah `.env`

### 4. MongoDB Connection Error

```bash
# Cek MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Cek logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh "mongodb://localhost:27017/garment-tryon"
```

### 5. Build Gagal

```bash
# Clean install
rm -rf node_modules client/node_modules client/build
npm run setup:dev  # atau setup:prod
```

## 📝 Checklist Production

- [ ] Environment variables sudah dikonfigurasi
- [ ] MongoDB connection sudah di-tes
- [ ] API keys valid dan aktif
- [ ] Frontend sudah di-build (`npm run setup:prod`)
- [ ] Firewall sudah dikonfigurasi
- [ ] SSL/HTTPS sudah di-setup
- [ ] Backup sudah dijadwalkan (database + files)
- [ ] Monitoring sudah aktif

## 🔄 Update Aplikasi

Untuk update ke versi terbaru:

```bash
# Pull changes
git pull origin main

# Setup ulang (jika ada dependencies baru)
npm run setup:prod

# Restart server
pm2 restart garment-tryon
```

## 🆘 Bantuan

Jika mengalami masalah:

1. Cek logs: `pm2 logs garment-tryon`
2. Pastikan semua dependencies terinstall
3. Verifikasi konfigurasi environment
4. Test API endpoints secara manual
5. Cek resource usage (CPU, RAM, disk)

## 🎉 Summary

Deployment hanya butuh **4 command**:

```bash
git clone <repo-url>
cd garment-tryon-app
cp .env.example .env && nano .env
npm run setup:prod && npm start
```

Hanya **4 script npm** yang perlu diingat:
- `npm run setup:dev` - Setup development
- `npm run setup:prod` - Setup production
- `npm start` - Run production
- `npm run dev` - Run development

Simple dan cepat! 🚀