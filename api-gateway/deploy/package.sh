#!/bin/bash

# Package script for Lambda functions
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Packaging Lambda functions...${NC}"

# Create deploy directory if it doesn't exist
mkdir -p deploy

# Install dependencies and package chat suggestions lambda
echo -e "${YELLOW}Packaging chat suggestions lambda...${NC}"
cd lambda_functions/chat_suggestions

# Install dependencies
pip install -r ../../requirements.txt -t .

# Create deployment package
zip -r ../../deploy/chat_suggestions.zip . -x "*.pyc" "__pycache__/*" "*.git*"

cd ../..

# Install dependencies and package robot feedback lambda
echo -e "${YELLOW}Packaging robot feedback lambda...${NC}"
cd lambda_functions/robot_feedback

# Install dependencies
pip install -r ../../requirements.txt -t .

# Create deployment package
zip -r ../../deploy/robot_feedback.zip . -x "*.pyc" "__pycache__/*" "*.git*"

cd ../..

echo -e "${GREEN}Packaging completed!${NC}"
echo -e "${GREEN}Deployment packages created in deploy/ directory${NC}"
