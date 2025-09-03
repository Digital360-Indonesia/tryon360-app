# Kustompedia Try-On Platform

AI-powered garment visualization platform for internal use at Kustompedia. Generate high-quality model images for marketing, social media, and web content using OpenAI's GPT Image 1 API.

## Features

### Core Features
- **5-7 Consistent Models**: Pre-defined model personas that maintain exact appearance across generations
- **Logo Enhancement**: Focus enhancement for sablon, embroidery, and other logo details
- **Queue System**: 5-slot parallel processing for efficient generation management
- **Real-time Monitoring**: Live updates on generation progress and queue status

### Technical Features
- **OpenAI GPT Image 1 Integration**: State-of-the-art image generation
- **Quality Settings**: Preview, Standard, and Premium quality options
- **Cost Tracking**: Monitor API costs per generation
- **File Upload**: Support for reference garment images
- **Priority Queue**: High, normal, and low priority processing

## Architecture

### Backend (Node.js)
- **Express.js** - REST API server
- **Multer** - File upload handling
- **Queue Management** - In-memory job queue with 5 slots
- **OpenAI Integration** - Image generation and enhancement

### Frontend (React)
- **React 18** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Axios** - API communication

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- OpenAI API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
NODE_ENV=development
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
FRONTEND_URL=http://localhost:3000
```

5. Start the backend server:
```bash
npm run dev
```

The backend will be available at http://localhost:3001

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at http://localhost:3000

## Usage

### Basic Workflow

1. **Select Model**: Choose from your 7 consistent models (Ari, Sari, Budi, Dina, Raja, Maya, Agus)
2. **Configure Garment**: Set garment type, color, and upload reference image (optional)
3. **Add Branding**: Specify logo description and position
4. **Set Quality**: Choose between Preview ($0.011), Standard ($0.042), or Premium ($0.167)
5. **Generate**: Submit to queue and monitor progress
6. **Download**: Save generated images for use in marketing

### Model Profiles

Each model has consistent characteristics:
- **Ari**: Indonesian male, 25yo, athletic, professional casual
- **Sari**: Indonesian female, 23yo, elegant, approachable  
- **Budi**: Indonesian male, 30yo, mature, reliable
- **Dina**: Indonesian female, 22yo, energetic, youthful
- **Raja**: Indonesian male, 27yo, creative, modern
- **Maya**: Indonesian female, 26yo, sophisticated, versatile
- **Agus**: Indonesian male, 24yo, sporty, approachable

### Queue System

- **5 Concurrent Slots**: Process up to 5 images simultaneously
- **Priority Levels**: High, Normal, Low priority processing
- **Real-time Updates**: Live progress tracking and ETA
- **Auto-retry**: Intelligent retry logic for failed generations

## API Endpoints

### Try-On Generation
- `POST /api/tryon/generate` - Start new generation
- `GET /api/tryon/job/:jobId` - Get job status
- `DELETE /api/tryon/job/:jobId` - Cancel job
- `POST /api/tryon/enhance-logo` - Enhance logo details

### Models & Configuration  
- `GET /api/models` - List all models
- `GET /api/models/:modelId` - Get model details
- `GET /api/models/garments` - List garment types
- `GET /api/models/quality-settings` - List quality options

### Queue Management
- `GET /api/queue/status` - Queue status
- `GET /api/queue/jobs` - List jobs
- `GET /api/queue/stats` - Queue statistics
- `POST /api/queue/clear` - Clear old jobs

## Cost Management

### Quality Tiers
- **Preview**: $0.011 (1024x1024) - Quick previews
- **Standard**: $0.042 (1024x1024) - Social media content  
- **Premium**: $0.167 (1024x1024) - Marketing materials
- **Wide Standard**: $0.063 (1536x1024) - Wide format
- **Wide Premium**: $0.25 (1536x1024) - Wide format premium

### Cost Optimization
- Use Preview quality for quick iterations
- Batch similar requests for efficiency
- Monitor daily spending in dashboard
- Set appropriate priority levels

## Development

### Project Structure
```
kustompedia-tryon-platform/
├── backend/
│   ├── src/
│   │   ├── config/        # Model definitions
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Business logic
│   ├── uploads/           # Generated images
│   └── server.js          # Express server
└── frontend/
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/         # Main page components
    │   └── services/      # API integration
    └── public/            # Static assets
```

### Adding New Models

1. Edit `backend/src/config/models.js`
2. Add model definition with consistent prompts
3. Update frontend model selection
4. Test generation consistency

### Extending Garment Types

1. Add new garment type to `GARMENT_TYPES`
2. Define available logo positions
3. Update frontend garment selection
4. Test with different models

## Deployment

### Production Considerations
- Set `NODE_ENV=production`
- Use process manager (PM2)
- Configure reverse proxy (nginx)
- Set up SSL certificates
- Monitor API usage and costs

### Environment Variables
```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your_production_key
FRONTEND_URL=https://your-domain.com
```

## Troubleshooting

### Common Issues

**OpenAI API Errors**
- Verify API key is valid
- Check rate limits and quotas
- Monitor API status page

**Queue Issues**
- Restart server to clear stuck jobs
- Check job logs for error details
- Adjust timeout settings if needed

**Image Quality Issues**
- Refine model prompts for consistency
- Adjust quality settings
- Use reference images for better results

## Support

For technical support or questions:
- Check logs in `backend/logs/`
- Review API documentation
- Contact development team

## License

Internal use only - Kustompedia Team
