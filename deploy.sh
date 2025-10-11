#!/bin/bash

# Deploy script for theFOX application to Google Cloud
set -e

# Configuration
PROJECT_ID="your-project-id"  # Replace with your Google Cloud project ID
REGION="asia-southeast1"
SERVICE_NAME="thefox"

echo "🚀 Deploying theFOX to Google Cloud..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please authenticate with Google Cloud:"
    gcloud auth login
fi

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml --substitutions=_SERVICE_NAME=$SERVICE_NAME

# Get the service URL
echo "🌐 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed!"
echo "🔗 Service URL: $SERVICE_URL"
echo ""
echo "📱 Mobile App: $SERVICE_URL/mobile/"
echo "🌐 Web App: $SERVICE_URL/"
echo "🔌 API: $SERVICE_URL/api/"
echo ""
echo "📊 To view logs: gcloud run services logs tail $SERVICE_NAME --region=$REGION"
echo "🔄 To update: ./deploy.sh"
