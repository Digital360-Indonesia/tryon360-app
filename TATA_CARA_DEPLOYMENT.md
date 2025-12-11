# Tata Cara Deployment Garment Try-On App

## 📋 Prasyarat

Sebelum memulai deployment, pastikan Anda memiliki:

- Node.js (v18 atau lebih tinggi)
- npm atau yarn
- Git
- Server/VPS (untuk production)
- API Keys yang diperlukan:
  - Gemini API Key
  - Flux API Key

## 🏗️ Struktur Proyek (Monolithic)

```
garment-tryon-app/
├── server.js              # Server Express utama
├── package.json           # Dependencies dan scripts
├── .env                   # Environment variables (RAHASIA)
├── .env.example          # Template environment variables
├── .gitignore            # File yang diabaikan Git
├── src/                  # Backend source code
│   ├── config/          # Konfigurasi AI providers dan models
│   ├── routes/          # API routes
│   └── services/        # Business logic
├── client/              # Frontend React app
│   ├── public/          # Static assets
│   ├── src/             # React components
│   └── package.json     # Frontend dependencies
├── models/              # Model reference photos
├── data/                # Data generated (auto-generated)
└── generated/           # Hasil generated images (auto-generated)
```

## 🚀 Cara Deployment

### 1. Setup Environment

```bash
# Clone repository
git clone <your-repo-url> garment-tryon-app
cd garment-tryon-app

# Install dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Konfigurasi Environment Variables

```bash
# Copy template environment
cp .env.example .env

# Edit .env file dengan API keys Anda
nano .env
```

Isi nilai berikut:
```env
GEMINI_API_KEY=your_gemini_api_key_here
FLUX_API_KEY=your_flux_api_key_here
FRONTEND_PORT=3000
BACKEND_PORT=3000
```

### 3. Build Frontend

```bash
# Build production version
npm run build
```

### 4. Jalankan di Development

```bash
# Mode development
npm run dev

# Atau jalankan langsung
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

### 5. Deployment ke Production

#### Opsi 1: Direct Deployment (VPS/Dedicated Server)

```bash
# Install PM2 untuk process management
npm install -g pm2

# Build aplikasi
npm run build

# Jalankan dengan PM2
pm2 start server.js --name "garment-tryon"

# Simpan konfigurasi PM2
pm2 save
pm2 startup
```

#### Opsi 2: Deployment dengan Docker

Buat `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production
RUN cd client && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

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

#### Opsi 3: Deployment dengan Nginx Reverse Proxy

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

Aktifkan site:
```bash
sudo ln -s /etc/nginx/sites-available/garment-tryon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
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
tar -czf $BACKUP_DIR/generated_$DATE.tar.gz -C $APP_DIR data/ generated/

# Backup database jika ada
# mysqldump -u username -p database > $BACKUP_DIR/db_$DATE.sql

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

Tambahkan endpoint health check di `server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
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

### 4. Frontend Build Gagal

```bash
# Clear cache
cd client
rm -rf node_modules package-lock.json
npm install

# Build ulang
cd ..
npm run build
```

## 📝 Checklist Production

- [ ] Environment variables sudah dikonfigurasi
- [ ] API keys valid dan aktif
- [ ] Frontend sudah di-build
- [ ] Firewall sudah dikonfigurasi
- [ ] SSL/HTTPS sudah di-setup
- [ ] Backup sudah dijadwalkan
- [ ] Monitoring sudah aktif
- [ ] Error handling sudah diuji
- [ ] Load testing sudah dilakukan (opsional)

## 🆘 Bantuan

Jika mengalami masalah:

1. Cek logs: `pm2 logs garment-tryon` atau `journalctl -u nginx`
2. Pastikan semua dependencies terinstall
3. Verifikasi konfigurasi environment
4. Test API endpoints secara manual
5. Cek resource usage (CPU, RAM, disk)

## 🔄 Update Aplikasi

Untuk update ke versi terbaru:

```bash
# Pull changes
git pull origin main

# Install dependencies baru (jika ada)
npm install
cd client && npm install && cd ..

# Build ulang
npm run build

# Restart server
pm2 restart garment-tryon
```