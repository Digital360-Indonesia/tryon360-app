# Project Structure

## Root Level Organization
```
kustompedia-tryon-platform/
├── backend/           # Node.js Express API server
├── frontend/          # React web application
├── README.md          # Full project documentation
├── QUICKSTART.md      # 3-minute setup guide
├── setup.sh           # Automated setup script
├── start.sh           # Production start script
└── package.json       # Root package with dev scripts
```

## Backend Structure (`/backend`)
```
backend/
├── src/
│   ├── config/        # Configuration files
│   │   └── models.js  # Model definitions (Johny, Nyoman, Isabella)
│   ├── routes/        # Express route handlers
│   │   ├── tryOn.js   # Try-on generation endpoints
│   │   ├── models.js  # Model management endpoints
│   │   ├── queue.js   # Queue status endpoints
│   │   └── test.js    # Testing endpoints
│   └── services/      # Business logic services
│       ├── imageGenerator.js  # Main image generation orchestrator
│       ├── openai.js          # OpenAI GPT integration
│       ├── flux.js            # FLUX Pro integration
│       ├── fluxFinetuning.js  # Custom model finetuning
│       └── queueManager.js    # Job queue management
├── uploads/           # Generated and uploaded images
├── temp/              # Temporary processing files
├── finetuning-model/  # Training data for custom models
├── server.js          # Express server entry point
├── .env.example       # Environment template
└── package.json       # Backend dependencies
```

## Frontend Structure (`/frontend`)
```
frontend/
├── src/
│   ├── components/    # Reusable React components
│   │   ├── Header.js  # Top navigation header
│   │   └── Sidebar.js # Navigation sidebar
│   ├── pages/         # Main page components
│   │   ├── Dashboard.js      # Overview dashboard
│   │   ├── TryOnGenerator.js # Main generation interface
│   │   ├── ModelGallery.js   # Model selection gallery
│   │   ├── QueueMonitor.js   # Job queue monitoring
│   │   └── Settings.js       # Configuration settings
│   ├── services/      # API integration
│   │   └── api.js     # Axios-based API client
│   ├── App.js         # Main React app component
│   ├── index.js       # React DOM entry point
│   └── index.css      # Global styles with Tailwind
├── public/
│   ├── models/        # Model avatar images
│   └── index.html     # HTML template
├── tailwind.config.js # Tailwind CSS configuration
└── package.json       # Frontend dependencies
```

## Key File Conventions

### Model Configuration
- Model definitions in `backend/src/config/models.js`
- Each model has: id, name, characteristics, poses, avatar
- Consistent Indonesian personas with specific traits

### API Routes Pattern
- `/api/tryon/*` - Generation endpoints
- `/api/models/*` - Model management
- `/api/queue/*` - Queue operations
- RESTful conventions with proper HTTP methods

### Image Storage
- Generated images: `backend/uploads/`
- Model avatars: `frontend/public/models/`
- Temporary files: `backend/temp/`
- Training data: `backend/finetuning-model/`

### Component Organization
- Pages for main views (`/pages`)
- Reusable components (`/components`)
- Single responsibility principle
- Functional components with hooks

### Styling Approach
- Tailwind CSS utility classes
- Custom color palette (primary orange theme)
- Responsive design patterns
- Component-scoped styling

## Development Patterns

### State Management
- React hooks (useState, useEffect) for local state
- No global state management (Redux/Context not needed)
- API state managed in components

### Error Handling
- Try-catch blocks in async operations
- User-friendly error messages
- Console logging for debugging
- Graceful fallbacks for failed operations

### File Naming
- kebab-case for directories
- PascalCase for React components
- camelCase for JavaScript files
- Descriptive, purpose-driven names