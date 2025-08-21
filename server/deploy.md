# Deployment Guide for Google Cloud Run

## Prerequisites
- Google Cloud SDK installed and configured
- Docker installed locally
- Project with Cloud Run API enabled

## Environment Variables for Cloud Run

Set these environment variables in your Cloud Run service:

```bash
# Required
PORT=8000
PYTHONUNBUFFERED=1

# Optional (for production)
DATABASE_URL=sqlite:///./backend.db
MATCH_THRESHOLD=0.6
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=your-bucket-name
```

## Deployment Steps

### 1. Build and Push Docker Image

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export REGION="asia-south1"  # or your preferred region
export SERVICE_NAME="face-attendance-backend"

# Build the image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --concurrency 80 \
  --max-instances 10 \
  --set-env-vars PORT=8000,PYTHONUNBUFFERED=1
```

### 3. Verify Deployment

```bash
# Get the service URL
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

# Test health endpoint
curl https://your-service-url/health

# Test readiness endpoint
curl https://your-service-url/ready
```

## Troubleshooting

### Container Startup Issues

If you see "container failed to start" errors:

1. **Check logs**: Use the Cloud Run console or `gcloud logs read`
2. **Verify port binding**: Ensure the service listens on port 8000
3. **Check dependencies**: Ensure all Python packages are installed
4. **Memory issues**: Increase memory allocation if needed

### Common Issues

1. **Port binding**: The service must listen on the port specified by the `PORT` environment variable
2. **Startup time**: Face recognition models can take time to load; consider increasing timeout
3. **Memory**: DeepFace requires significant memory; use at least 2GB
4. **Dependencies**: Ensure all system libraries for OpenCV are installed

## Health Checks

The service provides two health check endpoints:

- `/health` - Basic health status
- `/ready` - Readiness probe (checks database and file system)

## Monitoring

- Use Cloud Run metrics to monitor performance
- Set up alerts for error rates and response times
- Monitor memory and CPU usage
- Check logs for any startup errors

## Scaling

- **Min instances**: 0 (for cost optimization)
- **Max instances**: 10 (adjust based on expected load)
- **Concurrency**: 80 (adjust based on your application's performance)
- **Memory**: 2GB (required for face recognition models)
- **CPU**: 2 (recommended for better performance)
