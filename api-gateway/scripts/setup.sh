#!/bin/bash

# Setup script for Robot Agentic API
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Robot Agentic API...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

# Get AWS account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo -e "${YELLOW}AWS Account ID: $ACCOUNT_ID${NC}"
echo -e "${YELLOW}AWS Region: $REGION${NC}"

# Create deployment bucket
BUCKET_NAME="robot-agentic-deployments-$ACCOUNT_ID-$REGION"
echo -e "${YELLOW}Creating deployment bucket: $BUCKET_NAME${NC}"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Make scripts executable
chmod +x deploy/deploy.sh
chmod +x deploy/package.sh
chmod +x scripts/setup.sh

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Run: ./deploy/package.sh"
echo -e "2. Run: ./deploy/deploy.sh"
echo -e "3. Or use CDK: cd cdk && npm install && cdk deploy"
