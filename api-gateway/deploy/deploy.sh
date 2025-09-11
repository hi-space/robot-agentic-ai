#!/bin/bash

# Deploy script for API Gateway and Lambda functions
set -e

# Configuration
REGION="us-east-1"
STACK_NAME="robot-agentic-api"
BUCKET_NAME="robot-agentic-deployments"
FUNCTION_PREFIX="robot-agentic"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of Robot Agentic API...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

# Create S3 bucket for deployments if it doesn't exist
echo -e "${YELLOW}Creating S3 bucket for deployments...${NC}"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Create deployment packages
echo -e "${YELLOW}Creating deployment packages...${NC}"

# Chat Suggestions Lambda
echo "Packaging chat suggestions lambda..."
cd lambda_functions/chat_suggestions
zip -r ../../deploy/chat_suggestions.zip .
cd ../..

# Robot Feedback Lambda
echo "Packaging robot feedback lambda..."
cd lambda_functions/robot_feedback
zip -r ../../deploy/robot_feedback.zip .
cd ../..

# Upload packages to S3
echo -e "${YELLOW}Uploading packages to S3...${NC}"
aws s3 cp deploy/chat_suggestions.zip s3://$BUCKET_NAME/
aws s3 cp deploy/robot_feedback.zip s3://$BUCKET_NAME/

# Deploy CloudFormation stack
echo -e "${YELLOW}Deploying CloudFormation stack...${NC}"
aws cloudformation deploy \
    --template-file deploy/cloudformation.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        BucketName=$BUCKET_NAME \
        Region=$REGION \
    --capabilities CAPABILITY_IAM \
    --region $REGION

# Get API Gateway URL
echo -e "${YELLOW}Getting API Gateway URL...${NC}"
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}API Gateway URL: $API_URL${NC}"
echo -e "${GREEN}Endpoints:${NC}"
echo -e "  POST $API_URL/chat-suggestions"
echo -e "  POST $API_URL/robot-feedback"

# Clean up local deployment files
echo -e "${YELLOW}Cleaning up local files...${NC}"
rm -rf deploy/*.zip

echo -e "${GREEN}Deployment script completed!${NC}"
