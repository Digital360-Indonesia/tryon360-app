# Try-On 360 - Virtual Try-On Application

![Version](https://img.shields.io/badge/version-2.6.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

Aplikasi **Virtual Try-On** profesional berbasis AI yang memungkinkan pengguna menghasilkan foto model profesional yang memakai pakaian kustom dengan detail embroidery/sablon. Aplikasi ini menggunakan arsitektur **monolithic full-stack** dengan teknologi modern.

---

## Table of Contents

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Arsitektur](#arsitektur)
- [Struktur Project](#struktur-project)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [API Endpoints](#api-endpoints)
- [Model Profesional](#model-profesional)
- [AI Providers](#ai-providers)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Fitur Utama

### 1. **AI-Powered Try-On Generation**
- Upload gambar produk + hingga 3 gambar detail (close-up embroidery)
- Generate foto model profesional yang memakai pakaian
- Support multiple AI providers untuk hasil terbaik
- Retry logic dengan exponential backoff
- Fallback system jika API utama gagal

### 2. **Model Profesional**
Tersedia 6 model profesional dengan deskripsi fisik detail:
- **Pria**: Gunawan, Paul, Johny
- **Wanita**: Rachma, Louise, Jennie

Setiap model memiliki:
- Deskripsi fisik detail untuk konsistensi hasil AI
- Multiple pose (standing, arms crossed, hands on hips, dll)
- Referensi foto untuk akurasi tinggi

### 3. **Embroidery Details**
- Upload hingga 3 gambar detail embroidery/sablon
- Tentukan posisi dan deskripsi untuk setiap detail
- Posisi: chest_left, chest_center, back_center, sleeve

### 4. **Generation Tracking**
- Job-based tracking dengan progress updates
- Comprehensive logging throughout flow
- MySQL persistence untuk generation history
- Status tracking: processing, completed, failed

### 5. **Smart Features**
- Smart Add-ons untuk custom enhancements
- Local storage untuk history
- Download hasil langsung
- Responsive UI dengan Tailwind CSS

---

## Teknologi

### Backend
- **Node.js** v18+ - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database (migration dari MongoDB untuk stability)
- **Axios** - HTTP client
- **Multer** - File upload handling
- **Sharp** - Image processing
- **Winston** - Logging
- **Socket.io** - Real-time communication (future use)

### Frontend
- **React** v18 - UI framework
- **React Router** v7 - Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - API client
- **React Dropzone** - File upload UI

### AI Providers
- **Flux Kontext** (Black Forest Labs) - High-quality try-on
- **Gemini 2.5 Flash Image** (Google) - Fast generation
- **Nano Banana / Gemini 3 Pro** (Google) - Enhanced quality
- **Imagen 4.0 Ultra** (Google) - Premium generation

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Landing │  │ Pricing  │  │  Studio  │  │  Logs    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API (Express.js)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  POST /api/generation/try-on                       │    │
│  │  GET  /api/generation/providers                    │    │
│  │  GET  /api/generation/status/:jobId                │    │
│  │  GET  /api/generation/history                     │    │
│  │  DELETE /api/generation/job/:jobId                 │    │
│  │  GET  /api/models                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVICES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  AI Service  │  │Image Processor│  │Prompt Builder│    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │Image Composer│  │   MySQL ORM  │                      │
│  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL APIS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Flux Kontext │  │   Gemini     │  │   Imagen     │    │
│  │  (BFL API)   │  │  (Google)    │  │  (Google)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Struktur Project

```
tryon-app/
├── server.js                 # Main Express server entry point
├── package.json              # Backend dependencies
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Environment variables template
│
├── client/                   # React Frontend Application
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Tailwind CSS configuration
│   ├── public/               # Static assets
│   │   ├── index.html
│   │   └── try-on360-logo.png
│   └── src/
│       ├── index.js          # React entry point
│       ├── App.js            # Main App component
│       ├── index.css         # Global styles
│       ├── pages/            # Page components
│       │   ├── Landing.js          # Landing page
│       │   ├── Landing.css
│       │   ├── Pricing.js          # Pricing page
│       │   ├── Pricing.css
│       │   ├── TryOnStudio.js      # Main studio page
│       │   └── GenerationLogs.js   # Generation logs
│       ├── components/       # Reusable components
│       │   ├── ModelSelector.js    # Model & pose selection
│       │   ├── SimpleUpload.js     # Image upload component
│       │   ├── GenerationPanel.js  # Generation controls
│       │   └── UploadSlots.js      # Upload slot management
│       ├── services/         # Frontend services
│       │   ├── api.js              # API client
│       │   └── storage.js          # Local storage service
│       └── contexts/         # React contexts
│
├── src/                      # Backend Source Code
│   ├── config/               # Configuration files
│   │   ├── database.js       # MySQL connection & setup
│   │   ├── models.js         # Model definitions & poses
│   │   └── aiProviders.js    # AI provider configurations
│   ├── models/               # Database Models
│   │   └── Generation.js     # Generation model (MySQL ORM)
│   ├── routes/               # API Routes
│   │   ├── generation.js     # Generation endpoints
│   │   └── models.js         # Model endpoints
│   └── services/             # Business Logic Services
│       ├── aiService.js      # AI provider integration
│       ├── imageProcessor.js # Image upload & processing
│       ├── promptBuilder.js  # AI prompt construction
│       └── imageComposer.js  # Composite image creation
│
├── models/                   # Model Reference Images
│   ├── gunawan-reference.jpg
│   ├── paul-reference.jpg
│   ├── johny-reference.jpg
│   ├── rachma-reference.png
│   ├── louise-reference.png
│   └── jennie-reference.png
│
├── generated/                # Output Directory (auto-created)
│   └── [generated images]    # Generated try-on images
│
├── build/                    # React Production Build
├── node_modules/             # Backend Dependencies
└── reference/                # Additional reference materials
```

---

## Instalasi

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** v5.7 or higher
- **npm** or **yarn**

### 1. Clone Repository

```bash
git clone <repository-url>
cd tryon-app
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Setup Database

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE tryon;
EXIT;

# Or use MySQL Workbench/phpMyAdmin
```

### 4. Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# API Keys (Dapatkan dari provider masing-masing)
GEMINI_API_KEY=your_gemini_api_key_here
FLUX_API_KEY=your_flux_api_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tryon
DB_USER=root
DB_PASSWORD=your_mysql_password_here

# Server Configuration
PORT=9901
NODE_ENV=development
```

### 5. Build Frontend

```bash
cd client
npm run build
cd ..

# Frontend build akan disalin ke folder /build di root
```

### 6. Start Development Server

```bash
# Development mode dengan auto-reload
npm run dev

# Atau production mode
npm start
```

Aplikasi akan berjalan di:
- **Development**: http://localhost:9901
- **Production**: http://localhost:9901 (sesuai PORT di .env)

---

## Konfigurasi

### API Keys

#### Gemini API Key (Google)
1. Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API key
3. Copy dan paste ke `.env` sebagai `GEMINI_API_KEY`

#### Flux API Key (Black Forest Labs)
1. Kunjungi [BFL API](https://api.bfl.ml/)
2. Sign up dan dapatkan API key
3. Copy dan paste ke `.env` sebagai `FLUX_API_KEY`

### Database Configuration

Database MySQL akan otomatis dibuat saat server pertama kali berjalan. Table schema:

```sql
CREATE TABLE generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jobId VARCHAR(255) UNIQUE NOT NULL,
  modelId VARCHAR(100) NOT NULL,
  pose VARCHAR(100) DEFAULT 'professional_standing',
  provider VARCHAR(100) DEFAULT 'flux_kontext',
  status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
  progress INT DEFAULT 0,
  userIp VARCHAR(45),
  userAgent TEXT,
  imageUrl VARCHAR(500),
  imagePath VARCHAR(500),
  prompt TEXT,
  metadata JSON,
  error TEXT,
  processingTime INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  endTime TIMESTAMP NULL
);
```

---

## API Endpoints

### Health Check

```http
GET /health
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "2.0.0",
  "environment": "production",
  "database": {
    "status": "connected",
    "database": "tryon",
    "host": "localhost",
    "port": 3306
  }
}
```

### Generate Try-On

```http
POST /api/generation/try-on
Content-Type: multipart/form-data
```

Request Body:
```json
{
  "modelId": "gunawan",
  "pose": "professional_standing",
  "providerId": "flux_kontext",
  "garmentDescription": "dark blue polo shirt",
  "embroideryPosition1": "chest_left",
  "embroideryDescription1": "golden company logo"
}
```

Form Data:
- `productImage`: File (required) - Gambar produk utama
- `detail1`: File (optional) - Detail embroidery 1
- `detail2`: File (optional) - Detail embroidery 2
- `detail3`: File (optional) - Detail embroidery 3

Response:
```json
{
  "success": true,
  "jobId": "uuid-v4",
  "result": {
    "imageUrl": "/generated/tryon_1234567890.jpg",
    "imagePath": "/full/path/to/generated/image.jpg",
    "provider": "flux_kontext",
    "prompt": "A professional Indonesian man...",
    "metadata": {
      "modelId": "gunawan",
      "pose": "professional_standing",
      "cost": 0.045
    }
  },
  "processingTime": 15000
}
```

### Get Providers

```http
GET /api/generation/providers
```

Response:
```json
{
  "success": true,
  "providers": [
    {
      "id": "flux_kontext",
      "name": "Flux Kontext",
      "description": "High-quality try-on generation",
      "status": "active",
      "supportsImageInput": true
    }
  ]
}
```

### Get Job Status

```http
GET /api/generation/status/:jobId
```

Response:
```json
{
  "success": true,
  "jobId": "uuid-v4",
  "status": "completed",
  "progress": 100,
  "imageUrl": "/generated/tryon_1234567890.jpg",
  "error": null,
  "processingTime": 15000
}
```

### Get Generation History

```http
GET /api/generation/history?modelId=gunawan&limit=20&page=1
```

Response:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Cancel Job

```http
DELETE /api/generation/job/:jobId
```

### Cleanup Old Files

```http
POST /api/generation/cleanup
Content-Type: application/json

{
  "maxAgeHours": 24
}
```

---

## Model Profesional

### Pria

| ID | Nama | Tipe | Tinggi | Deskripsi Singkat |
|----|------|------|--------|-------------------|
| `gunawan` | Gunawan | Male | 5'10" | Indonesian male model, medium skin, black hair, clean-shaven |
| `paul` | Paul | Male | 5'10" | Indonesian male model, medium-warm skin, side-parted hair, clean-shaven |
| `johny` | Johny | Male | 5'9" | Indonesian male model, light-medium skin, textured hair, light stubble |

### Wanita

| ID | Nama | Tipe | Tinggi | Deskripsi Singkat |
|----|------|------|--------|-------------------|
| `rachma` | Rachma | Female | 5'6" | Indonesian female model with hijab, light skin, brown eyes |
| `louise` | Louise | Female | 5'7" | Professional female model, elegant features |
| `jennie` | Jennie | Female | 5'6" | Professional female model, confident presence |

### Available Poses

- `professional_standing` - Standing straight, arms at sides
- `arms_crossed` - Arms crossed over chest
- `hands_on_hips` - Hands placed on hips
- `hands_in_pockets` - Hands in pockets
- `one_hand_on_hip` - Asymmetric pose
- `hands_clasped` - Hands clasped in front
- `arms_at_sides` - Natural relaxed pose
- `casual_standing` - Relaxed casual pose
- `casual_confident` - Modern confident pose
- `look_over_shoulder` - Back view, head turned
- `side_flex` - Side profile view

---

## AI Providers

### Flux Kontext (Black Forest Labs)

**Status**: Active
**Endpoint**: `https://api.bfl.ai/v1/flux-kontext-pro`

**Features**:
- High-quality try-on generation
- Image composite support
- Aspect ratio: 9:16
- Timeout: 420s (7 minutes)
- Retries: 3

**Cost**: ~$0.045 per HD image

### Gemini 2.5 Flash Image (Google)

**Status**: Active
**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`

**Features**:
- Fast image generation
- Image input support
- Max resolution: 1024x1024
- Timeout: 60s
- Retries: 3

**Cost**: ~$0.039 per image (1K-2K tokens)

### Nano Banana / Gemini 3 Pro

**Status**: Active
**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`

**Features**:
- Enhanced quality
- 1290 tokens per image
- Timeout: 60s

**Cost**: ~$0.039 per image

### Imagen 4.0 Ultra

**Status**: Active
**Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:generateContent`

**Features**:
- Premium quality
- Max resolution: 2048x2048
- Timeout: 120s

**Cost**: ~$0.06 per image

---

## Development

### Development Workflow

```bash
# Terminal 1: Backend server dengan hot reload
npm run dev

# Terminal 2: Frontend development (jika ingin separate)
cd client
npm start  # Runs on port 7007
```

### Building for Production

```bash
# Build frontend
cd client
npm run build

# Copy build to root
cp -r build ../

# Start production server
cd ..
npm start
```

### Environment Setup Script

```bash
# Setup development environment
npm run setup:dev

# Setup production environment
npm run setup:prod
```

### Testing

```bash
# Run frontend tests
cd client
npm test

# Manual API testing
curl http://localhost:9901/api/health
```

---

## Production Deployment

### Recommended Stack

- **Node.js** v18+ on Ubuntu/Linux
- **MySQL** 5.7+ or MariaDB
- **Nginx** as reverse proxy (optional)
- **PM2** for process management

### PM2 Setup

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name tryon-app

# Setup startup script
pm2 startup
pm2 save

# View logs
pm2 logs tryon-app

# Monitor
pm2 monit
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name tryon.example.com;

    location / {
        proxy_pass http://localhost:9901;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files caching
    location /generated {
        proxy_pass http://localhost:9901;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location /models {
        proxy_pass http://localhost:9901;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=9901

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tryon
DB_USER=tryon_user
DB_PASSWORD=strong_production_password

# API Keys
GEMINI_API_KEY=production_gemini_key
FLUX_API_KEY=production_flux_key
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Failed to connect to MySQL`

**Solution**:
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in `.env`
- Ensure database exists: `mysql -u root -p -e "CREATE DATABASE tryon;"`

#### 2. Frontend Build Not Found

**Error**: `Frontend build not found`

**Solution**:
```bash
cd client
npm run build
cd ..
cp -r build ../
```

#### 3. API Key Errors

**Error**: `401 Unauthorized` or `403 Forbidden`

**Solution**:
- Verify API keys in `.env` are correct
- Check API key quota/billing status
- Regenerate API keys if needed

#### 4. Generation Timeout

**Error**: `Generation timeout: Task did not complete`

**Solution**:
- Check AI provider status (may be down)
- Try different provider (fallback)
- Increase timeout in `src/config/aiProviders.js`

#### 5. Image Upload Size Limit

**Error**: `File too large`

**Solution**:
- Default limit: 10MB per file
- Adjust in `src/routes/generation.js`:
```javascript
limits: {
  fileSize: 20 * 1024 * 1024 // 20MB
}
```

#### 6. Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :9901

# Kill process
kill -9 <PID>

# Or change PORT in .env
PORT=9902
```

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
DEBUG=tryon-app:*
```

### Logging

Logs are stored in:
- Console output (Winston)
- Generated files in `/generated` folder with debug info
- MySQL database for generation tracking

---

## Cost Estimation

Per Generation (per image):

| Provider | Cost per Image | Notes |
|----------|----------------|-------|
| Flux Kontext | $0.045 | HD quality |
| Gemini 2.5 Flash | $0.039 | Fast generation |
| Nano Banana | $0.039 | Enhanced quality |
| Imagen 4 Ultra | $0.06 | Premium quality |

**Example**: 1000 generations/month
- Using Gemini 2.5 Flash: ~$39/month
- Using Flux Kontext: ~$45/month

---

## License

MIT License - Feel free to use this project for personal or commercial purposes.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: support@example.com
- Documentation: [Link to docs]

---

## Changelog

### v2.6.0 (Current)
- Enhanced multi-provider support
- Improved composite image generation
- Better error handling and retry logic
- Comprehensive logging system
- MySQL migration from MongoDB

### v2.5.0
- Added Gemini 2.5 Flash support
- Smart Add-ons feature
- Generation history with local storage

### v2.0.0
- Initial release with Flux Kontext
- 6 professional models
- 11 pose options
- Multi-embroidery detail support

---

**Built with ❤️ for the virtual try-on experience**
