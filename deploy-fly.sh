#!/bin/bash

# =============================================
# FLY.IO DEPLOYMENT SCRIPT FOR TRYON-APP
# =============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="tryon-app-backend"
REGION="sin" # Singapore - change to your preferred region
DOCKERFILE="Dockerfile.fly"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Fly CLI is installed
    if ! command -v fly &> /dev/null; then
        log_error "Fly CLI not found. Installing..."
        curl -L https://fly.io/install.sh | sh
        export FLYCTL_INSTALL="/home/$USER/.fly"
        export PATH="$FLYCTL_INSTALL/bin:$PATH"
    fi
    
    # Check if logged in
    if ! fly auth whoami &> /dev/null; then
        log_warning "Not logged in to Fly.io"
        log_info "Opening browser for authentication..."
        fly auth login
    fi
    
    log_success "Prerequisites checked"
}

# Create or update app
setup_app() {
    log_info "Setting up Fly.io app..."
    
    # Check if app exists
    if fly apps list | grep -q "$APP_NAME"; then
        log_info "App '$APP_NAME' already exists"
    else
        log_info "Creating new app '$APP_NAME'..."
        fly apps create "$APP_NAME"
    fi
    
    log_success "App setup complete"
}

# Set secrets (environment variables)
set_secrets() {
    log_info "Setting secrets (environment variables)..."
    
    echo -e "${CYAN}Please provide your API keys:${NC}"
    
    # OPENAI_API_KEY
    read -p "Enter your OpenAI API Key: " -s openai_key
    echo
    if [ -n "$openai_key" ]; then
        fly secrets set OPENAI_API_KEY="$openai_key" --app "$APP_NAME"
    fi
    
    # FLUX_API_KEY
    read -p "Enter your FLUX API Key: " -s flux_key
    echo
    if [ -n "$flux_key" ]; then
        fly secrets set FLUX_API_KEY="$flux_key" --app "$APP_NAME"
    fi
    
    # FRONTEND_URL
    read -p "Enter your Netlify frontend URL (e.g., https://your-site.netlify.app): " frontend_url
    if [ -n "$frontend_url" ]; then
        fly secrets set FRONTEND_URL="$frontend_url" --app "$APP_NAME"
    fi
    
    log_success "Secrets configured"
    
    # List secrets (without values)
    log_info "Configured secrets:"
    fly secrets list --app "$APP_NAME"
}

# Create persistent volumes
create_volumes() {
    log_info "Checking persistent volumes..."
    
    # Check if volumes exist
    if ! fly volumes list --app "$APP_NAME" | grep -q "uploads_volume"; then
        log_info "Creating uploads volume..."
        fly volumes create uploads_volume --size 1 --region "$REGION" --app "$APP_NAME" -y
    else
        log_info "Uploads volume already exists"
    fi
    
    if ! fly volumes list --app "$APP_NAME" | grep -q "generated_volume"; then
        log_info "Creating generated volume..."
        fly volumes create generated_volume --size 1 --region "$REGION" --app "$APP_NAME" -y
    else
        log_info "Generated volume already exists"
    fi
    
    log_success "Volumes ready"
}

# Deploy application
deploy_app() {
    log_info "Deploying application..."
    
    # Navigate to backend directory
    cd "$(dirname "$0")/backend" || exit 1
    
    # Check if Dockerfile exists
    if [ ! -f "$DOCKERFILE" ]; then
        log_error "Dockerfile '$DOCKERFILE' not found in backend directory"
        exit 1
    fi
    
    # Deploy with specific Dockerfile
    fly deploy --app "$APP_NAME" \
               --dockerfile "$DOCKERFILE" \
               --region "$REGION" \
               --strategy rolling \
               --wait-timeout 300
    
    log_success "Deployment complete!"
}

# Check app status
check_status() {
    log_info "Checking app status..."
    
    # Show app status
    fly status --app "$APP_NAME"
    
    # Get app URL
    APP_URL="https://${APP_NAME}.fly.dev"
    
    log_info "Testing health endpoint..."
    if curl -f "${APP_URL}/health" &> /dev/null; then
        log_success "Health check passed!"
    else
        log_warning "Health check failed. App may still be starting..."
    fi
    
    log_info "View logs with: fly logs --app $APP_NAME"
}

# Scale application
scale_app() {
    log_info "Scaling options:"
    echo "1. Keep current configuration (1 instance, shared CPU)"
    echo "2. Scale to 2 instances (high availability)"
    echo "3. Increase memory to 512MB"
    echo "4. Both 2 and 3"
    read -p "Choose option (1-4): " scale_option
    
    case $scale_option in
        2)
            fly scale count 2 --app "$APP_NAME"
            log_success "Scaled to 2 instances"
            ;;
        3)
            fly scale vm shared-cpu-1x --memory 512 --app "$APP_NAME"
            log_success "Increased memory to 512MB"
            ;;
        4)
            fly scale count 2 --app "$APP_NAME"
            fly scale vm shared-cpu-1x --memory 512 --app "$APP_NAME"
            log_success "Scaled to 2 instances with 512MB memory"
            ;;
        *)
            log_info "Keeping current configuration"
            ;;
    esac
}

# Display final information
display_info() {
    echo
    echo "========================================"
    echo -e "${GREEN}DEPLOYMENT SUCCESSFUL!${NC}"
    echo "========================================"
    echo -e "${CYAN}Backend URL:${NC} https://${APP_NAME}.fly.dev"
    echo -e "${CYAN}Health Check:${NC} https://${APP_NAME}.fly.dev/health"
    echo -e "${CYAN}API Endpoint:${NC} https://${APP_NAME}.fly.dev/api"
    echo
    echo "NEXT STEPS:"
    echo "1. Update Netlify environment variable:"
    echo "   REACT_APP_API_URL=https://${APP_NAME}.fly.dev/api"
    echo
    echo "2. Deploy frontend to Netlify"
    echo
    echo "USEFUL COMMANDS:"
    echo "- View logs: fly logs --app $APP_NAME"
    echo "- SSH to container: fly ssh console --app $APP_NAME"
    echo "- View dashboard: fly dashboard --app $APP_NAME"
    echo "- Check status: fly status --app $APP_NAME"
    echo "- Deploy updates: fly deploy --app $APP_NAME"
    echo "========================================"
}

# Main deployment flow
main() {
    echo "========================================"
    echo -e "${CYAN}FLY.IO DEPLOYMENT SCRIPT${NC}"
    echo "========================================"
    
    check_prerequisites
    setup_app
    set_secrets
    create_volumes
    deploy_app
    check_status
    scale_app
    display_info
}

# Handle script interruption
trap 'log_error "Deployment interrupted!"; exit 1' INT TERM

# Run main function
main "$@"