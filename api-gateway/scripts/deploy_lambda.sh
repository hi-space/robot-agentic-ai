#!/bin/bash

# Deploy Lambda functions script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying Lambda functions...${NC}"

# Configuration
REGION=$(aws configure get region || echo "us-east-1")
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="robot-agentic-deployments-$ACCOUNT_ID-$REGION"
STACK_NAME="robot-agentic-api"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${YELLOW}AWS Account ID: $ACCOUNT_ID${NC}"
echo -e "${YELLOW}AWS Region: $REGION${NC}"
echo -e "${YELLOW}Deployment Bucket: $BUCKET_NAME${NC}"

# Create deployment bucket if it doesn't exist
echo -e "${YELLOW}Creating deployment bucket...${NC}"
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# Create deploy directory
mkdir -p deploy

# Function to deploy a single Lambda function
deploy_lambda() {
    local function_name=$1
    local function_dir=$2
    local handler_file=$3
    
    echo -e "${BLUE}Deploying $function_name...${NC}"
    
    # Create temporary directory for packaging
    local temp_dir="temp_$function_name"
    mkdir -p $temp_dir
    
    # Copy function code
    cp -r $function_dir/* $temp_dir/
    
    # Install dependencies
    echo -e "${YELLOW}Installing dependencies for $function_name...${NC}"
    cd $temp_dir
    pip install -r ../../requirements.txt -t . --quiet
    
    # Create deployment package
    zip -r ../deploy/${function_name}.zip . -x "*.pyc" "__pycache__/*" "*.git*" "test*" "*.md"
    
    # Clean up
    cd ..
    rm -rf $temp_dir
    
    # Upload to S3
    echo -e "${YELLOW}Uploading $function_name to S3...${NC}"
    aws s3 cp deploy/${function_name}.zip s3://$BUCKET_NAME/
    
    # Update Lambda function code
    echo -e "${YELLOW}Updating Lambda function code...${NC}"
    aws lambda update-function-code \
        --function-name $function_name \
        --s3-bucket $BUCKET_NAME \
        --s3-key ${function_name}.zip \
        --region $REGION
    
    echo -e "${GREEN}$function_name deployed successfully!${NC}"
}

# Deploy all Lambda functions
echo -e "${YELLOW}Starting Lambda function deployment...${NC}"

# Check if CloudFormation stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo -e "${YELLOW}CloudFormation stack exists, deploying Lambda functions...${NC}"
    
    # Deploy Chat Suggestions Lambda
    deploy_lambda "robot-agentic-chat-suggestions" "lambda_functions/chat_suggestions" "handler.py"
    
    # Deploy Robot Feedback Lambda
    deploy_lambda "robot-agentic-robot-feedback" "lambda_functions/robot_feedback" "handler.py"
    
    # Deploy IoT to SQS Lambda
    deploy_lambda "robot-agentic-iot-to-sqs" "lambda_functions/iot_to_sqs" "handler.py"
    
    echo -e "${GREEN}All Lambda functions deployed successfully!${NC}"
    
    # Get API Gateway URL
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
        --output text)
    
    echo -e "${GREEN}Deployment completed!${NC}"
    echo -e "${GREEN}API Gateway URL: $API_URL${NC}"
    echo -e "${GREEN}Endpoints:${NC}"
    echo -e "  POST $API_URL/chat-suggestions"
    echo -e "  POST $API_URL/robot-feedback"
    
else
    echo -e "${RED}CloudFormation stack '$STACK_NAME' not found.${NC}"
    echo -e "${YELLOW}Please deploy the CloudFormation stack first using:${NC}"
    echo -e "  ./deploy/deploy.sh"
    echo -e "  or"
    echo -e "  cd cdk && cdk deploy"
    exit 1
fi

# Clean up deployment files
echo -e "${YELLOW}Cleaning up deployment files...${NC}"
rm -rf deploy/*.zip

echo -e "${GREEN}Lambda deployment script completed!${NC}"
