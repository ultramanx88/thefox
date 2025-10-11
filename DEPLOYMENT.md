# theFOX Deployment Guide

This guide explains how to deploy theFOX application to Google Cloud using Docker.

## Architecture

The application consists of three main components:
- **Web App**: Next.js application (Port 3000)
- **Mobile App**: Expo web build (Port 8080)
- **Backend API**: Rust application (Port 3001)
- **Nginx**: Reverse proxy and load balancer (Port 80)

## Prerequisites

1. **Google Cloud Account**: Sign up at [Google Cloud Console](https://console.cloud.google.com/)
2. **gcloud CLI**: Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Install [Docker](https://docs.docker.com/get-docker/)

## Quick Start

### 1. Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Create a new project (optional)
gcloud projects create your-project-id

# Set the project
gcloud config set project your-project-id
```

### 2. Deploy to Google Cloud

```bash
# Make the deploy script executable
chmod +x deploy.sh

# Edit the PROJECT_ID in deploy.sh
nano deploy.sh

# Deploy the application
./deploy.sh
```

### 3. Access the Application

After deployment, you'll get URLs for:
- **Web App**: `https://your-service-url.run.app/`
- **Mobile App**: `https://your-service-url.run.app/mobile/`
- **API**: `https://your-service-url.run.app/api/`

## Manual Deployment

### Using Docker Compose (Local Testing)

```bash
# Build and run locally
docker-compose up --build

# Access the application
# Web: http://localhost:3000
# Mobile: http://localhost:8080
# API: http://localhost:3001
```

### Using Google Cloud Build

```bash
# Submit build
gcloud builds submit --config cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy thefox \
  --image gcr.io/your-project-id/thefox:latest \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 80 \
  --memory 2Gi \
  --cpu 2
```

## Configuration

### Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Set to `production` for production builds
- `PORT`: Port for the web application (default: 3000)
- `DATABASE_URL`: SQLite database path (default: `sqlite:///app/data/thefox.db`)

### Database

The application uses SQLite for data storage. The database file is stored in `/app/data/thefox.db` and is persisted using Docker volumes.

### Nginx Configuration

Nginx is configured to:
- Serve static files with caching
- Proxy API requests to the backend
- Proxy mobile app requests to Expo
- Proxy web app requests to Next.js
- Apply rate limiting and security headers

## Monitoring and Logs

### View Logs

```bash
# View all logs
gcloud run services logs tail thefox --region asia-southeast1

# View specific service logs
gcloud run services logs tail thefox --region asia-southeast1 --filter="resource.type=cloud_run_revision"
```

### Health Check

The application provides a health check endpoint at `/health` that returns `200 OK` when all services are running.

## Scaling

### Automatic Scaling

Cloud Run automatically scales based on:
- **CPU utilization**: Default threshold is 60%
- **Concurrent requests**: Default is 100 requests per instance
- **Memory usage**: Monitored but not used for scaling decisions

### Manual Scaling

```bash
# Set minimum instances
gcloud run services update thefox \
  --region asia-southeast1 \
  --min-instances 2

# Set maximum instances
gcloud run services update thefox \
  --region asia-southeast1 \
  --max-instances 20
```

## Security

### HTTPS

All traffic is automatically encrypted with HTTPS when using Cloud Run.

### Security Headers

The application includes security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Rate Limiting

- **API**: 10 requests per second per IP
- **Web**: 30 requests per second per IP

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all dependencies are properly installed
2. **Service won't start**: Check logs for specific error messages
3. **Database issues**: Ensure the database file is writable

### Debug Commands

```bash
# Check service status
gcloud run services describe thefox --region asia-southeast1

# View recent logs
gcloud run services logs read thefox --region asia-southeast1 --limit 50

# Check build logs
gcloud builds list --limit 5
```

## Cost Optimization

### Resource Limits

- **Memory**: 2GB (adjust based on usage)
- **CPU**: 2 cores (adjust based on usage)
- **Max Instances**: 10 (adjust based on traffic)

### Monitoring Costs

```bash
# View current costs
gcloud billing budgets list

# Set up billing alerts
gcloud alpha billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --budget-amount=100USD \
  --display-name="theFOX Budget"
```

## Updates

### Rolling Updates

To update the application:

```bash
# Build new image
gcloud builds submit --config cloudbuild.yaml

# The new version will automatically be deployed
```

### Rollback

```bash
# List revisions
gcloud run revisions list --service thefox --region asia-southeast1

# Rollback to previous revision
gcloud run services update-traffic thefox \
  --region asia-southeast1 \
  --to-revisions REVISION_NAME=100
```

## Support

For issues and questions:
1. Check the logs first
2. Review this documentation
3. Check the GitHub repository issues
4. Contact the development team