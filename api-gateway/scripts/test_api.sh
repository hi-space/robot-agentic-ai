#!/bin/bash

# Test script for Robot Agentic API
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get API Gateway URL from CloudFormation stack
STACK_NAME="robot-agentic-api"
REGION=$(aws configure get region || echo "us-east-1")

echo -e "${GREEN}Testing Robot Agentic API...${NC}"

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text 2>/dev/null)

if [ -z "$API_URL" ]; then
    echo -e "${RED}Error: Could not find API Gateway URL. Make sure the stack is deployed.${NC}"
    exit 1
fi

echo -e "${YELLOW}API Gateway URL: $API_URL${NC}"

# Test Chat Suggestions API
echo -e "${YELLOW}Testing Chat Suggestions API...${NC}"
curl -X POST "$API_URL/chat-suggestions" \
    -H "Content-Type: application/json" \
    -d '{
        "session_id": "test-session-123",
        "limit": 5
    }' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s

echo -e "\n"

# Test Robot Feedback API
echo -e "${YELLOW}Testing Robot Feedback API...${NC}"
curl -X POST "$API_URL/robot-feedback" \
    -H "Content-Type: application/json" \
    -d '{
        "session_id": "test-session-123",
        "task_id": "test-task-456",
        "limit": 10
    }' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s

echo -e "\n"

# Test with sample chat history
echo -e "${YELLOW}Testing with sample chat history...${NC}"

# First, add some chat history to DynamoDB
aws dynamodb put-item \
    --table-name ChatHistory \
    --item '{
        "session_id": {"S": "test-session-123"},
        "messages": {
            "L": [
                {
                    "M": {
                        "role": {"S": "user"},
                        "content": {"S": "로봇이 인사해줘"},
                        "timestamp": {"S": "2024-01-01T10:00:00Z"}
                    }
                },
                {
                    "M": {
                        "role": {"S": "assistant"},
                        "content": {"S": "안녕하세요! 로봇이 인사 제스처를 수행했습니다."},
                        "timestamp": {"S": "2024-01-01T10:00:01Z"}
                    }
                }
            ]
        },
        "ttl": {"N": "1704110400"}
    }' \
    --region $REGION

# Test chat suggestions with the sample history
curl -X POST "$API_URL/chat-suggestions" \
    -H "Content-Type: application/json" \
    -d '{
        "session_id": "test-session-123",
        "limit": 3
    }' \
    -w "\nHTTP Status: %{http_code}\n" \
    -s

echo -e "\n${GREEN}API testing completed!${NC}"
