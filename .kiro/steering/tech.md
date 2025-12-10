# Technology Stack

## Architecture
Full-stack JavaScript application with separate backend API and React frontend.

## Backend Stack
- **Runtime**: Node.js 16+
- **Framework**: Express.js - REST API server
- **File Upload**: Multer - handles garment image uploads
- **Image Processing**: Sharp - image manipulation and optimization
- **AI Services**: 
  - OpenAI GPT Image 1 API
  - FLUX Pro 1.1 (Black Forest Labs)
  - Custom finetuned models via FLUX
- **Queue Management**: In-memory job queue with 5 concurrent slots
- **WebSocket**: Socket.io for real-time updates
- **Utilities**: UUID, Winston (logging), Axios, Form-data
- **Environment**: dotenv for configuration

## Frontend Stack
- **Framework**: React 18 with functional components and hooks
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS utility-first framework
- **Icons**: Lucide React icon library
- **HTTP Client**: Axios for API communication
- **Build Tool**: Create React App (react-scripts)

## Development Tools
- **Backend Dev Server**: Nodemon for auto-restart
- **Process Management**: Concurrently for running both services
- **CSS Processing**: PostCSS with Autoprefixer

## Common Commands

### Setup
```bash
# Full setup (both backend and frontend)
npm run setup
# or
chmod +x setup.sh && ./setup.sh
```

### Development
```bash
# Start both services concurrently
npm run dev

# Start backend only
cd backend && npm run dev

# Start frontend only  
cd frontend && npm start
```

### Production
```bash
# Build frontend for production
npm run build

# Start production backend
npm start
```

### Environment Configuration
Backend requires `.env` file with:
- `OPENAI_API_KEY` - OpenAI API key
- `FLUX_API_KEY` - FLUX API key (optional)
- `NODE_ENV` - development/production
- `PORT` - backend port (default 3001)
- `FRONTEND_URL` - frontend URL for CORS

## API Integration
- OpenAI GPT Image 1 for advanced image editing
- FLUX Pro 1.1 for high-quality generation
- Custom finetuned models for consistent character generation
- Real-time WebSocket updates for job progress