#!/bin/bash

# Deployment script for TheFox project
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
DEPLOY_HOSTING=true
DEPLOY_FUNCTIONS=true
SKIP_BUILD=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment to deploy to (staging|production) [default: staging]"
    echo "  -h, --hosting-only   Deploy hosting only"
    echo "  -f, --functions-only Deploy functions only"
    echo "  -s, --skip-build     Skip build process"
    echo "  --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to staging (default)"
    echo "  $0 -e production             # Deploy to production"
    echo "  $0 -h                        # Deploy hosting only"
    echo "  $0 -f                        # Deploy functions only"
    echo "  $0 -s                        # Skip build and deploy"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--hosting-only)
            DEPLOY_FUNCTIONS=false
            shift
            ;;
        -f|--functions-only)
            DEPLOY_HOSTING=false
            shift
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Build process
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Installing dependencies..."
    npm ci

    print_status "Running linter..."
    npm run lint:all

    print_status "Running type check..."
    npm run typecheck

    if [[ "$DEPLOY_HOSTING" == true ]]; then
        print_status "Building packages..."
        npm run build:packages

        print_status "Building web app..."
        npm run build:web
    fi

    if [[ "$DEPLOY_FUNCTIONS" == true ]]; then
        print_status "Building functions..."
        npm run build:functions
    fi
else
    print_warning "Skipping build process..."
fi

# Deploy to Firebase
if [[ "$DEPLOY_HOSTING" == true && "$DEPLOY_FUNCTIONS" == true ]]; then
    print_status "Deploying hosting and functions to $ENVIRONMENT..."
    if [[ "$ENVIRONMENT" == "production" ]]; then
        firebase deploy --only hosting:production,functions
    else
        firebase hosting:channel:deploy staging --only hosting:staging
        firebase deploy --only functions
    fi
elif [[ "$DEPLOY_HOSTING" == true ]]; then
    print_status "Deploying hosting to $ENVIRONMENT..."
    if [[ "$ENVIRONMENT" == "production" ]]; then
        firebase deploy --only hosting:production
    else
        firebase hosting:channel:deploy staging --only hosting:staging
    fi
elif [[ "$DEPLOY_FUNCTIONS" == true ]]; then
    print_status "Deploying functions..."
    firebase deploy --only functions
fi

print_success "Deployment completed successfully! 🚀"

# Show deployment URLs
if [[ "$DEPLOY_HOSTING" == true ]]; then
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo ""
        print_success "Production URL: https://thefox-sp7zz.web.app"
    else
        echo ""
        print_success "Staging URL: Check Firebase console for the staging channel URL"
    fi
fi