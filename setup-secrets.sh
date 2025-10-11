#!/bin/bash

# Setup secrets for theFOX deployment
set -e

echo "🔐 Setting up secrets for theFOX deployment..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status > /dev/null 2>&1; then
    echo "🔐 Please authenticate with GitHub:"
    gh auth login
fi

# Get project ID
echo "📋 Please enter your Google Cloud Project ID:"
read -p "Project ID: " PROJECT_ID

# Create service account key
echo "👤 Creating service account key..."
gcloud iam service-accounts keys create thefox-key.json \
    --iam-account=thefox-cloudbuild@$PROJECT_ID.iam.gserviceaccount.com

# Set GitHub secrets
echo "🔑 Setting GitHub secrets..."

# GCP Project ID
gh secret set GCP_PROJECT_ID --body "$PROJECT_ID"

# GCP Service Account Key
gh secret set GCP_SA_KEY --body "$(cat thefox-key.json)"

# Clean up
rm thefox-key.json

echo "✅ Secrets setup completed!"
echo ""
echo "📋 Secrets configured:"
echo "- GCP_PROJECT_ID: $PROJECT_ID"
echo "- GCP_SA_KEY: Service account key"
echo ""
echo "🚀 Ready to deploy with GitHub Actions!"
echo "Push to master branch to trigger deployment."
