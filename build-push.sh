#!/bin/bash

# Configuration
AWS_REGION="ca-central-1"  # e.g., us-east-1
AWS_ACCOUNT_ID="182491688958"  # Your 12-digit AWS account ID
IMAGE_NAME="workout-tracker"
# Get the current git commit hash
VERSION=$(git rev-parse --short HEAD)

# ECR repository URI
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE_NAME="${ECR_REPO}/${IMAGE_NAME}:${VERSION}"

# Authenticate Docker to ECR
echo "Logging into Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REPO}

# Create ECR repository if it doesn't exist
echo "Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names ${IMAGE_NAME} --region ${AWS_REGION} || \
    aws ecr create-repository --repository-name ${IMAGE_NAME} --region ${AWS_REGION}

# Build the Docker image
echo "Building Docker image: ${FULL_IMAGE_NAME}"
docker build --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_COMMIT_HASH=${VERSION} \
    --build-arg PRISMA_CLI_BINARY_TARGETS="native,linux-musl-openssl-3.0.x" \
    --build-arg PRISMA_CLI_QUERY_ENGINE_TYPE=binary \
    --build-arg PRISMA_CLIENT_ENGINE_TYPE=binary \
    --build-arg GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
    --build-arg GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} \
    --build-arg NEXTAUTH_URL=tracker.flufflylab.cloud \
    --build-arg NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    --build-arg DATABASE_URL=${TRACKER_DATABASE_URL} \
    -t ${FULL_IMAGE_NAME} .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Docker image built successfully"
    
    # Push the image to ECR
    echo "Pushing image to ECR..."
    docker push ${FULL_IMAGE_NAME}
    
    if [ $? -eq 0 ]; then
        echo "Image pushed successfully to ECR"
    else
        echo "Failed to push image to ECR"
        exit 1
    fi
else
    echo "Docker image build failed"
    exit 1
fi