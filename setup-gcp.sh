#!/bin/bash

# Google Cloud Platform setup script for theFOX
set -e

echo "🚀 Setting up Google Cloud Platform for theFOX..."

# Configuration
PROJECT_ID=""
REGION="asia-southeast1"
SERVICE_NAME="thefox"

# Get project ID from user
if [ -z "$PROJECT_ID" ]; then
    echo "📋 Please enter your Google Cloud Project ID:"
    read -p "Project ID: " PROJECT_ID
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Authenticate
echo "🔐 Authenticating with Google Cloud..."
gcloud auth login

# Set project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable compute.googleapis.com

# Set default region
echo "🌍 Setting default region to $REGION..."
gcloud config set run/region $REGION
gcloud config set compute/region $REGION

# Create service account for Cloud Build
echo "👤 Creating service account for Cloud Build..."
gcloud iam service-accounts create thefox-cloudbuild \
    --display-name="theFOX Cloud Build Service Account" \
    --description="Service account for theFOX Cloud Build"

# Grant necessary permissions
echo "🔑 Granting permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:thefox-cloudbuild@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:thefox-cloudbuild@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:thefox-cloudbuild@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Create Cloud Build trigger (optional)
echo "🔧 Creating Cloud Build trigger..."
gcloud builds triggers create github \
    --repo-name=thefox \
    --repo-owner=ultramanx88 \
    --branch-pattern="^master$" \
    --build-config=cloudbuild.yaml \
    --service-account="thefox-cloudbuild@$PROJECT_ID.iam.gserviceaccount.com"

# Update deploy.sh with project ID
echo "📝 Updating deploy.sh with project ID..."
sed -i.bak "s/your-project-id/$PROJECT_ID/g" deploy.sh

echo "✅ Google Cloud Platform setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test Docker build: ./test-docker.sh"
echo "2. Deploy to Google Cloud: ./deploy.sh"
echo ""
echo "🔗 Useful commands:"
echo "- View logs: gcloud run services logs tail $SERVICE_NAME --region=$REGION"
echo "- View service: gcloud run services describe $SERVICE_NAME --region=$REGION"
echo "- Update service: gcloud run services update $SERVICE_NAME --region=$REGION"
