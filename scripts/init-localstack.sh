#!/bin/bash

# Wait for LocalStack to be ready
echo "Waiting for LocalStack to be ready..."
sleep 5

# Set LocalStack endpoint
ENDPOINT_URL="http://localhost:4568"

# Create S3 bucket
echo "Creating S3 bucket 'savepoint-dev'..."
aws --endpoint-url=$ENDPOINT_URL s3 mb s3://savepoint-dev

# Apply CORS configuration
echo "Applying CORS configuration..."
aws --endpoint-url=$ENDPOINT_URL s3api put-bucket-cors \
  --bucket savepoint-dev \
  --cors-configuration "file://$(dirname "$0")/localstack-cors.json"

echo "LocalStack S3 setup complete!"
echo "Bucket 'savepoint-dev' created and configured."
