#!/bin/bash

# Quick Lambda deployment script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Quick Lambda deployment...${NC}"

# Configuration
REGION=$(aws configure get region || echo "us-east-1")
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="robot-agentic-deployments-$ACCOUNT_ID-$REGION"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${YELLOW}AWS Account ID: $ACCOUNT_ID${NC}"
echo -e "${YELLOW}AWS Region: $REGION${NC}"

# Create deployment bucket if it doesn't exist
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Function to quickly deploy a Lambda function
quick_deploy() {
    local function_name=$1
    local function_dir=$2
    
    echo -e "${BLUE}Deploying $function_name...${NC}"
    
    # Create temporary directory
    local temp_dir="temp_$function_name"
    rm -rf $temp_dir
    mkdir -p $temp_dir
    
    # Copy function code
    cp -r $function_dir/* $temp_dir/
    
    # Install dependencies
    cd $temp_dir
    pip install -r ../../requirements.txt -t . --quiet --disable-pip-version-check
    
    # Create zip file
    zip -r ../${function_name}.zip . -q
    
    # Upload to S3
    aws s3 cp ../${function_name}.zip s3://$BUCKET_NAME/
    
    # Update Lambda function
    aws lambda update-function-code \
        --function-name $function_name \
        --s3-bucket $BUCKET_NAME \
        --s3-key ${function_name}.zip \
        --region $REGION \
        --output table
    
    # Clean up
    cd ..
    rm -rf $temp_dir
    rm -f ${function_name}.zip
    
    echo -e "${GREEN}✅ $function_name deployed!${NC}"
}

# Deploy all functions
echo -e "${YELLOW}Starting quick deployment...${NC}"

# Check if functions exist
if aws lambda get-function --function-name robot-agentic-chat-suggestions --region $REGION &> /dev/null; then
    quick_deploy "robot-agentic-chat-suggestions" "lambda_functions/chat_suggestions"
else
    echo -e "${RED}Function robot-agentic-chat-suggestions not found. Deploy CloudFormation stack first.${NC}"
fi

if aws lambda get-function --function-name robot-agentic-robot-feedback --region $REGION &> /dev/null; then
    quick_deploy "robot-agentic-robot-feedback" "lambda_functions/robot_feedback"
else
    echo -e "${RED}Function robot-agentic-robot-feedback not found. Deploy CloudFormation stack first.${NC}"
fi

if aws lambda get-function --function-name robot-agentic-iot-to-sqs --region $REGION &> /dev/null; then
    quick_deploy "robot-agentic-iot-to-sqs" "lambda_functions/iot_to_sqs"
else
    echo -e "${RED}Function robot-agentic-iot-to-sqs not found. Deploy CloudFormation stack first.${NC}"
fi

echo -e "${GREEN}✅ Quick deployment completed!${NC}"
