#!/bin/bash

# Local testing script for Lambda functions
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing Lambda functions locally...${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -r requirements.txt

# Create test data directory
mkdir -p test_data

# Test Chat Suggestions Lambda
echo -e "${BLUE}Testing Chat Suggestions Lambda...${NC}"
cat > test_data/chat_suggestions_event.json << 'EOF'
{
  "body": "{\"session_id\": \"test-session-123\", \"limit\": 5}",
  "headers": {
    "Content-Type": "application/json"
  },
  "httpMethod": "POST",
  "path": "/chat-suggestions",
  "queryStringParameters": null
}
EOF

cat > test_data/chat_suggestions_context.json << 'EOF'
{
  "function_name": "test-chat-suggestions",
  "function_version": "1",
  "invoked_function_arn": "arn:aws:lambda:us-east-1:123456789012:function:test-chat-suggestions",
  "memory_limit_in_mb": "256",
  "aws_request_id": "test-request-id",
  "log_group_name": "/aws/lambda/test-chat-suggestions",
  "log_stream_name": "2024/01/01/[$LATEST]test-stream",
  "remaining_time_in_millis": 30000
}
EOF

# Test Robot Feedback Lambda
echo -e "${BLUE}Testing Robot Feedback Lambda...${NC}"
cat > test_data/robot_feedback_event.json << 'EOF'
{
  "body": "{\"session_id\": \"test-session-123\", \"task_id\": \"test-task-456\", \"limit\": 10}",
  "headers": {
    "Content-Type": "application/json"
  },
  "httpMethod": "POST",
  "path": "/robot-feedback",
  "queryStringParameters": null
}
EOF

cat > test_data/robot_feedback_context.json << 'EOF'
{
  "function_name": "test-robot-feedback",
  "function_version": "1",
  "invoked_function_arn": "arn:aws:lambda:us-east-1:123456789012:function:test-robot-feedback",
  "memory_limit_in_mb": "256",
  "aws_request_id": "test-request-id",
  "log_group_name": "/aws/lambda/test-robot-feedback",
  "log_stream_name": "2024/01/01/[$LATEST]test-stream",
  "remaining_time_in_millis": 30000
}
EOF

# Test IoT to SQS Lambda
echo -e "${BLUE}Testing IoT to SQS Lambda...${NC}"
cat > test_data/iot_to_sqs_event.json << 'EOF'
{
  "session_id": "test-session-123",
  "task_id": "test-task-456",
  "status": "completed",
  "message": "Robot completed the task successfully",
  "timestamp": "2024-01-01T10:00:00Z",
  "robot_data": {
    "position": "standing",
    "battery": 85,
    "temperature": 25
  },
  "error": null,
  "progress": 100
}
EOF

cat > test_data/iot_to_sqs_context.json << 'EOF'
{
  "function_name": "test-iot-to-sqs",
  "function_version": "1",
  "invoked_function_arn": "arn:aws:lambda:us-east-1:123456789012:function:test-iot-to-sqs",
  "memory_limit_in_mb": "256",
  "aws_request_id": "test-request-id",
  "log_group_name": "/aws/lambda/test-iot-to-sqs",
  "log_stream_name": "2024/01/01/[$LATEST]test-stream",
  "remaining_time_in_millis": 30000
}
EOF

# Set up environment variables for local testing
export CHAT_HISTORY_TABLE="ChatHistory"
export ROBOT_FEEDBACK_TABLE="RobotFeedback"
export ROBOT_FEEDBACK_QUEUE="https://sqs.us-east-1.amazonaws.com/123456789012/robot-feedback-queue"

# Test Chat Suggestions Lambda
echo -e "${YELLOW}Running Chat Suggestions Lambda test...${NC}"
cd lambda_functions/chat_suggestions
python3 -c "
import json
import sys
sys.path.append('.')
from handler import lambda_handler

# Load test data
with open('../../test_data/chat_suggestions_event.json', 'r') as f:
    event = json.load(f)
with open('../../test_data/chat_suggestions_context.json', 'r') as f:
    context = type('Context', (), json.load(f))()

# Mock DynamoDB for local testing
import boto3
from moto import mock_dynamodb

@mock_dynamodb
def test_lambda():
    # Create mock DynamoDB table
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='ChatHistory',
        KeySchema=[{'AttributeName': 'session_id', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'session_id', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # Add sample data
    table.put_item(Item={
        'session_id': 'test-session-123',
        'messages': [
            {'role': 'user', 'content': '로봇이 인사해줘', 'timestamp': '2024-01-01T10:00:00Z'},
            {'role': 'assistant', 'content': '안녕하세요! 로봇이 인사 제스처를 수행했습니다.', 'timestamp': '2024-01-01T10:00:01Z'}
        ],
        'ttl': 1704110400
    })
    
    # Test the lambda function
    result = lambda_handler(event, context)
    print('Chat Suggestions Result:')
    print(json.dumps(result, indent=2, ensure_ascii=False))

test_lambda()
"
cd ../..

# Test Robot Feedback Lambda
echo -e "${YELLOW}Running Robot Feedback Lambda test...${NC}"
cd lambda_functions/robot_feedback
python3 -c "
import json
import sys
sys.path.append('.')
from handler import lambda_handler

# Load test data
with open('../../test_data/robot_feedback_event.json', 'r') as f:
    event = json.load(f)
with open('../../test_data/robot_feedback_context.json', 'r') as f:
    context = type('Context', (), json.load(f))()

# Mock SQS and DynamoDB for local testing
import boto3
from moto import mock_dynamodb, mock_sqs

@mock_dynamodb
@mock_sqs
def test_lambda():
    # Create mock DynamoDB table
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='RobotFeedback',
        KeySchema=[
            {'AttributeName': 'session_id', 'KeyType': 'HASH'},
            {'AttributeName': 'message_id', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'session_id', 'AttributeType': 'S'},
            {'AttributeName': 'message_id', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # Create mock SQS queue
    sqs = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs.create_queue(QueueName='robot-feedback-queue')['QueueUrl']
    
    # Add sample message to SQS
    sqs.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps({
            'session_id': 'test-session-123',
            'task_id': 'test-task-456',
            'status': 'completed',
            'message': 'Robot completed the task successfully',
            'timestamp': '2024-01-01T10:00:00Z',
            'robot_data': {'position': 'standing', 'battery': 85},
            'error': None,
            'progress': 100
        }),
        MessageAttributes={
            'session_id': {'StringValue': 'test-session-123', 'DataType': 'String'},
            'task_id': {'StringValue': 'test-task-456', 'DataType': 'String'},
            'status': {'StringValue': 'completed', 'DataType': 'String'},
            'timestamp': {'StringValue': '2024-01-01T10:00:00Z', 'DataType': 'String'}
        }
    )
    
    # Test the lambda function
    result = lambda_handler(event, context)
    print('Robot Feedback Result:')
    print(json.dumps(result, indent=2, ensure_ascii=False))

test_lambda()
"
cd ../..

# Test IoT to SQS Lambda
echo -e "${YELLOW}Running IoT to SQS Lambda test...${NC}"
cd lambda_functions/iot_to_sqs
python3 -c "
import json
import sys
sys.path.append('.')
from handler import lambda_handler

# Load test data
with open('../../test_data/iot_to_sqs_event.json', 'r') as f:
    event = json.load(f)
with open('../../test_data/iot_to_sqs_context.json', 'r') as f:
    context = type('Context', (), json.load(f))()

# Mock SQS for local testing
import boto3
from moto import mock_sqs

@mock_sqs
def test_lambda():
    # Create mock SQS queue
    sqs = boto3.client('sqs', region_name='us-east-1')
    queue_url = sqs.create_queue(QueueName='robot-feedback-queue')['QueueUrl']
    
    # Test the lambda function
    result = lambda_handler(event, context)
    print('IoT to SQS Result:')
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Check if message was sent to SQS
    messages = sqs.receive_message(QueueUrl=queue_url)
    if 'Messages' in messages:
        print('Message sent to SQS successfully!')
        print('SQS Message:', json.dumps(messages['Messages'][0], indent=2, ensure_ascii=False))
    else:
        print('No messages found in SQS')

test_lambda()
"
cd ../..

echo -e "${GREEN}Local testing completed!${NC}"
echo -e "${GREEN}All Lambda functions tested successfully.${NC}"

# Clean up
deactivate
