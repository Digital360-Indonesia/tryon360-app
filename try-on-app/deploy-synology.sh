#!/bin/bash

# =============================================
# SYNOLOGY DEPLOYMENT SCRIPT FOR TRYON-APP
# =============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="tryon-app"
PROJECT_DIR="/volume1/docker/${PROJECT_NAME}"
REPO_URL="https://github.com/arayasuryanto/garment-tryon-app.git"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as admin
check_permissions() {
    log_info "Checking permissions..."
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run this script as admin (sudo)"
        exit 1
    fi
    log_success "Running with admin privileges"
}

# Install required packages
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Container Manager from Package Center"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_warning "docker-compose not found. Installing..."
        curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    log_success "Dependencies verified"
}

# Create project directory
setup_project_dir() {
    log_info "Setting up project directory..."
    
    # Create docker directory if it doesn't exist
    mkdir -p /volume1/docker
    
    # Remove existing project directory if it exists
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "Existing project directory found. Backing up..."
        mv "$PROJECT_DIR" "${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create new project directory
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    log_success "Project directory created: $PROJECT_DIR"
}

# Clone repository
clone_repository() {
    log_info "Cloning repository..."
    
    # Clone only the try-on-app folder content
    git clone "$REPO_URL" temp
    cp -r temp/try-on-app/* .
    rm -rf temp
    
    log_success "Repository cloned successfully"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    # Copy example env file
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_warning "Please edit .env file with your actual API keys and configuration"
    fi
    
    # Set proper permissions
    chmod 600 .env 2>/dev/null || true
    
    log_success "Environment files configured"
}

# Create required directories
create_directories() {
    log_info "Creating required directories..."
    
    # Backend directories
    mkdir -p backend/uploads backend/generated backend/logs
    mkdir -p nginx/ssl nginx/logs
    
    # Set permissions
    chmod 755 backend/uploads backend/generated
    chmod 777 nginx/logs  # Nginx needs write access
    
    log_success "Directories created with proper permissions"
}

# Build and start services
deploy_services() {
    log_info "Building and starting services..."
    
    # Pull latest images
    docker-compose pull 2>/dev/null || true
    
    # Build and start basic services (frontend + backend)
    docker-compose up -d --build frontend backend
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Check service health
    check_services_health
}

# Check services health
check_services_health() {
    log_info "Checking services health..."
    
    # Check backend health
    if docker exec tryon-backend curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
        log_success "Backend service is healthy"
    else
        log_warning "Backend service health check failed"
    fi
    
    # Check frontend
    if docker exec tryon-frontend wget -q --spider http://localhost:80 >/dev/null 2>&1; then
        log_success "Frontend service is healthy"
    else
        log_warning "Frontend service health check failed"
    fi
    
    # Show running containers
    log_info "Running containers:"
    docker ps --filter "name=tryon-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Setup monitoring (optional)
setup_monitoring() {
    log_info "Setting up monitoring (optional)..."
    
    read -p "Do you want to enable monitoring with Portainer? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose --profile monitoring up -d portainer
        log_success "Monitoring enabled. Access Portainer at http://your-nas-ip:9000"
    fi
}

# Create systemd service for auto-start
create_systemd_service() {
    log_info "Creating systemd service for auto-start..."
    
    cat > /etc/systemd/system/tryon-app.service << EOF
[Unit]
Description=TryOn App Docker Compose
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/local/bin/docker-compose up -d frontend backend
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable tryon-app.service
    
    log_success "Systemd service created and enabled"
}

# Display final information
display_info() {
    log_success "Deployment completed successfully!"
    echo
    echo "========================================"
    echo "ACCESS INFORMATION:"
    echo "========================================"
    echo "Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    echo "Backend API: http://$(hostname -I | awk '{print $1}'):8000/api"
    echo
    echo "IMPORTANT NEXT STEPS:"
    echo "1. Edit $PROJECT_DIR/.env with your API keys"
    echo "2. Restart services: docker-compose restart"
    echo "3. Check logs: docker-compose logs -f"
    echo "4. Configure port forwarding on your router if needed"
    echo
    echo "USEFUL COMMANDS:"
    echo "- View logs: cd $PROJECT_DIR && docker-compose logs -f"
    echo "- Restart: cd $PROJECT_DIR && docker-compose restart"
    echo "- Stop: cd $PROJECT_DIR && docker-compose down"
    echo "- Update: cd $PROJECT_DIR && ./deploy-synology.sh"
    echo "========================================"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up Docker system..."
    docker system prune -f
    log_success "Cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting TryOn App deployment on Synology NAS..."
    echo "========================================"
    
    check_permissions
    install_dependencies
    setup_project_dir
    clone_repository
    setup_environment
    create_directories
    deploy_services
    setup_monitoring
    create_systemd_service
    cleanup
    display_info
    
    log_success "All done! Your TryOn App is ready to use!"
}

# Handle script interruption
trap 'log_error "Deployment interrupted!"; exit 1' INT TERM

# Run main function
main "$@"